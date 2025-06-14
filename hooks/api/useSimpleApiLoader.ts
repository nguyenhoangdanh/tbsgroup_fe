import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api/api';

interface ApiEndpoint {
  name: string;
  endpoint: string;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Simplified API loader hook for immediate use
 */
export const useSimpleApiLoader = (endpoints: ApiEndpoint[]) => {
  const [data, setData] = useState<Record<string, any>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, Error | null>>({});
  const loadedRef = useRef<Set<string>>(new Set());

  const loadApi = useCallback(async (endpoint: ApiEndpoint) => {
    const { name, endpoint: url } = endpoint;

    if (loadedRef.current.has(name)) {
      return data[name];
    }

    setLoadingStates(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: null }));

    try {
      const response = await api.get(url);
      const result = response.data;
      
      setData(prev => ({ ...prev, [name]: result }));
      loadedRef.current.add(name);
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setErrors(prev => ({ ...prev, [name]: err }));
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, [name]: false }));
    }
  }, [data]);

  const loadUserManagementApis = useCallback(async () => {
    const highPriority = endpoints.filter(ep => ep.priority === 'high');
    const mediumPriority = endpoints.filter(ep => ep.priority === 'medium');
    const lowPriority = endpoints.filter(ep => ep.priority === 'low');

    // Load high priority immediately
    await Promise.all(highPriority.map(loadApi));

    // Load medium priority with delay
    setTimeout(() => {
      Promise.all(mediumPriority.map(loadApi));
    }, 100);

    // Load low priority with more delay
    setTimeout(() => {
      Promise.all(lowPriority.map(loadApi));
    }, 300);
  }, [endpoints, loadApi]);

  return {
    data,
    loadingStates,
    errors,
    loadApi,
    loadUserManagementApis,
    isLoading: (name: string) => loadingStates[name] || false,
    hasError: (name: string) => !!errors[name],
    isLoaded: (name: string) => loadedRef.current.has(name),
  };
};
