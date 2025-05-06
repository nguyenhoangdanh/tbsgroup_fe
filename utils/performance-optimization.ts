// utils/performance-optimization.ts

/**
 * Utility functions to optimize performance for high-scale applications
 * These utilities help reduce re-renders and improve overall performance
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { throttle, debounce } from 'lodash';

/**
 * Custom hook to track component renders for debugging performance issues
 * Only active in development mode
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCount.current += 1;
      console.log(`[Performance] ${componentName} rendered: ${renderCount.current} times`);
    }
  });
  
  return renderCount.current;
}

/**
 * Custom hook for detecting slow render times
 * Only active in development mode
 */
export function useRenderPerformance(componentName: string, threshold = 16) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > threshold) {
          console.warn(`[Performance] Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      };
    }
  });
}

/**
 * Custom hook for throttled window resize events
 * Useful for responsive UI calculations that don't need to run on every resize event
 */
export function useThrottledResize(callback: () => void, delay = 200) {
  useEffect(() => {
    const handleResize = throttle(() => {
      callback();
    }, delay);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      handleResize.cancel();
      window.removeEventListener('resize', handleResize);
    };
  }, [callback, delay]);
}

/**
 * Custom hook for debounced input events
 * Helps reduce state updates and API calls when user is typing
 */
export function useDebouncedInput(initialValue: string, delay = 300) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  
  // Create memoized debounced function
  const debouncedSetValue = useCallback(
    debounce((value: string) => {
      setDebouncedValue(value);
    }, delay),
    [delay]
  );
  
  // Update input immediately, but debounce the internal value
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    debouncedSetValue(newValue);
  }, [debouncedSetValue]);
  
  // Clean up debounced function when unmounting
  useEffect(() => {
    return () => {
      debouncedSetValue.cancel();
    };
  }, [debouncedSetValue]);
  
  return {
    inputValue,
    debouncedValue,
    handleChange,
    setInputValue
  };
}

/**
 * Custom hook for resource pooling when dealing with many objects
 * Helps reduce GC pressure by reusing existing objects instead of creating new ones
 */
export function useObjectPool<T>(
  factory: () => T, 
  reset: (obj: T) => void, 
  initialSize = 10
) {
  const pool = useRef<T[]>([]);
  
  // Initialize pool
  useEffect(() => {
    if (pool.current.length === 0) {
      for (let i = 0; i < initialSize; i++) {
        pool.current.push(factory());
      }
    }
    // Clean up is unnecessary for this case
  }, [factory, initialSize]);
  
  // Get object from pool or create new if empty
  const acquire = useCallback(() => {
    if (pool.current.length > 0) {
      return pool.current.pop()!;
    }
    return factory();
  }, [factory]);
  
  // Return object to pool
  const release = useCallback((obj: T) => {
    reset(obj);
    pool.current.push(obj);
  }, [reset]);
  
  return { acquire, release };
}

/**
 * Custom hook for managing virtual lists
 * Renders only visible items for better performance with large lists
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  visibleCount: number,
  buffer: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = useCallback(
    throttle(() => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    }, 16), // ~60fps
    []
  );
  
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        handleScroll.cancel();
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);
  
  // Calculate which items should be rendered
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + (visibleCount * itemHeight)) / itemHeight) + buffer
  );
  
  // Only render visible items plus buffer
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  // Calculate offset to position items correctly
  const offsetY = startIndex * itemHeight;
  
  return {
    containerRef,
    visibleItems,
    startIndex,
    totalHeight,
    offsetY
  };
}

/**
 * React Query optimized fetch options with error handling
 */
export const optimizedQueryOptions = {
  staleTime: 60000, // 1 minute
  cacheTime: 3600000, // 1 hour
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: true,
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  onError: (error: Error) => {
    console.error('Query error:', error);
  }
};

/**
 * Utility function to create stable query keys
 * Prevents unnecessary refetches by ensuring consistent key structure
 */
export function createStableKey(baseKey: string, params?: Record<string, any>) {
  if (!params) return [baseKey];
  
  // Sort keys for consistent order
  const sortedKeys = Object.keys(params).sort();
  
  // Filter out undefined and null values
  const filteredParams: Record<string, any> = {};
  
  sortedKeys.forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      filteredParams[key] = value;
    }
  });
  
  return [baseKey, filteredParams];
}

/**
 * Utility function to chunk large operations for better UI responsiveness
 * Processes large arrays in smaller chunks with yield to main thread
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => R,
  chunkSize = 50,
  delayBetweenChunks = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    // Process current chunk
    const chunkResults = chunk.map(processor);
    results.push(...chunkResults);
    
    // Yield to main thread to prevent UI freezing
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
    }
  }
  
  return results;
}

/**
 * Cache calculation results to avoid redundant expensive operations
 */
export function createMemoizedCalculator<T, R>(calculator: (input: T) => R, cacheSize = 100) {
  const cache = new Map<string, R>();
  
  return (input: T): R => {
    const key = JSON.stringify(input);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = calculator(input);
    
    // Add to cache and maintain size limit
    cache.set(key, result);
    if (cache.size > cacheSize) {
      // Get the first key safely
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  };
}