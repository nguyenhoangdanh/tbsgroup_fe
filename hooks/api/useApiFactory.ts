import { useState, useCallback, useRef } from 'react';

interface ApiEndpoint {
  name: string;
  endpoint: string;
  dependencies?: string[];
  cacheKey: string;
  priority?: 'high' | 'medium' | 'low';
  lazy?: boolean;
}

interface ApiFactoryConfig {
  endpoints: ApiEndpoint[];
  globalCache?: boolean;
  batchSize?: number;
}

/**
 * Factory for managing multiple API endpoints with smart loading
 */
export const useApiFactory = (config: ApiFactoryConfig) => {
  const [loadedEndpoints, setLoadedEndpoints] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, Error | null>>({});
  
  const cacheRef = useRef<Record<string, any>>({});
  const priorityQueueRef = useRef<string[]>([]);

  // Load single endpoint
  const loadEndpoint = useCallback(async (endpointName: string) => {
    const endpoint = config.endpoints.find(ep => ep.name === endpointName);
    if (!endpoint) throw new Error(`Endpoint ${endpointName} not found`);

    if (loadedEndpoints.has(endpointName)) {
      return data[endpointName];
    }

    setLoadingStates(prev => ({ ...prev, [endpointName]: true }));
    setErrors(prev => ({ ...prev, [endpointName]: null }));

    try {
      // Check dependencies first
      if (endpoint.dependencies) {
        for (const dep of endpoint.dependencies) {
          if (!loadedEndpoints.has(dep)) {
            await loadEndpoint(dep);
          }
        }
      }

      // Load the actual data (this would be replaced with actual API calls)
      const result = await mockApiCall(endpoint.endpoint);
      
      setData(prev => ({ ...prev, [endpointName]: result }));
      setLoadedEndpoints(prev => new Set([...prev, endpointName]));
      
      if (config.globalCache) {
        cacheRef.current[endpointName] = result;
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setErrors(prev => ({ ...prev, [endpointName]: err }));
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, [endpointName]: false }));
    }
  }, [config.endpoints, loadedEndpoints, data, config.globalCache]);

  // Batch load endpoints by priority
  const loadByPriority = useCallback(async (priority: 'high' | 'medium' | 'low') => {
    const endpointsToLoad = config.endpoints
      .filter(ep => ep.priority === priority && !loadedEndpoints.has(ep.name))
      .map(ep => ep.name);

    const loadPromises = endpointsToLoad.map(loadEndpoint);
    return Promise.allSettled(loadPromises);
  }, [config.endpoints, loadedEndpoints, loadEndpoint]);

  // Smart loading strategy for user management
  const loadUserManagementApis = useCallback(async () => {
    // Load high priority first (roles)
    await loadByPriority('high');
    
    // Load medium priority with delay (factories, departments)
    setTimeout(() => {
      loadByPriority('medium');
    }, 100);
    
    // Load low priority last (lines, teams, groups)
    setTimeout(() => {
      loadByPriority('low');
    }, 300);
  }, [loadByPriority]);

  return {
    loadEndpoint,
    loadByPriority,
    loadUserManagementApis,
    data,
    loadingStates,
    errors,
    loadedEndpoints: Array.from(loadedEndpoints),
    isLoading: (endpoint: string) => loadingStates[endpoint] || false,
    hasError: (endpoint: string) => !!errors[endpoint],
    isLoaded: (endpoint: string) => loadedEndpoints.has(endpoint),
  };
};

// Mock API call - replace with actual API calls
const mockApiCall = async (endpoint: string): Promise<any> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ endpoint, data: [] });
    }, Math.random() * 1000);
  });
};
