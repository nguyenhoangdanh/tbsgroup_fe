import { useState, useCallback, useRef, useEffect } from 'react';

interface ApiConfig {
  name: string;
  loader: () => Promise<any>;
  dependencies?: string[];
  priority?: 'high' | 'medium' | 'low';
  cache?: boolean;
}

/**
 * Hook để load nhiều API một cách tối ưu với priority và lazy loading
 */
export function useLazyApiLoader(configs: ApiConfig[]) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, Error | null>>({});
  const loadedRef = useRef<Set<string>>(new Set());
  const cacheRef = useRef<Record<string, any>>({});

  // Load API với priority
  const loadApi = useCallback(async (config: ApiConfig) => {
    const { name, loader, cache = true } = config;

    // Skip nếu đã load và có cache
    if (cache && loadedRef.current.has(name) && cacheRef.current[name]) {
      setData(prev => ({ ...prev, [name]: cacheRef.current[name] }));
      return cacheRef.current[name];
    }

    setLoadingStates(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: null }));

    try {
      const result = await loader();
      
      if (cache) {
        cacheRef.current[name] = result;
        loadedRef.current.add(name);
      }

      setData(prev => ({ ...prev, [name]: result }));
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setErrors(prev => ({ ...prev, [name]: err }));
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, [name]: false }));
    }
  }, []);

  // Load multiple APIs theo priority
  const loadApis = useCallback(async (apiNames?: string[]) => {
    const apisToLoad = apiNames 
      ? configs.filter(config => apiNames.includes(config.name))
      : configs;

    // Sort by priority
    const sortedApis = apisToLoad.sort((a, b) => {
      const priorities = { high: 3, medium: 2, low: 1 };
      return (priorities[b.priority || 'medium'] - priorities[a.priority || 'medium']);
    });

    // Load high priority first
    const highPriority = sortedApis.filter(api => api.priority === 'high');
    const mediumPriority = sortedApis.filter(api => api.priority === 'medium');
    const lowPriority = sortedApis.filter(api => api.priority === 'low');

    // Load high priority APIs immediately
    await Promise.all(highPriority.map(loadApi));

    // Load medium priority with small delay
    setTimeout(() => {
      Promise.all(mediumPriority.map(loadApi));
    }, 100);

    // Load low priority after more delay
    setTimeout(() => {
      Promise.all(lowPriority.map(loadApi));
    }, 300);
  }, [configs, loadApi]);

  // Auto-load high priority APIs on mount
  useEffect(() => {
    const highPriorityApis = configs
      .filter(config => config.priority === 'high')
      .map(config => config.name);
    
    if (highPriorityApis.length > 0) {
      loadApis(highPriorityApis);
    }
  }, []);

  return {
    data,
    loadingStates,
    errors,
    loadApi,
    loadApis,
    // Helpers
    isLoading: (apiName: string) => loadingStates[apiName] || false,
    hasError: (apiName: string) => !!errors[apiName],
    isLoaded: (apiName: string) => loadedRef.current.has(apiName),
  };
}
