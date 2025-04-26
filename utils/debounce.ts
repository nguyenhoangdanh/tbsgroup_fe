// utils/debounce.ts
import { useCallback, useRef, useEffect } from 'react';

// Options interface for debounce configuration
interface DebounceOptions {
  leading?: boolean; // Execute immediately on first call
  trailing?: boolean; // Execute after delay
  maxWait?: number; // Maximum wait time
}

// Generic type for debounced function
type DebounceFunction<F extends (...args: any[]) => any> = {
  (...args: Parameters<F>): ReturnType<F> | undefined;
  cancel: () => void;
  flush: () => ReturnType<F> | undefined;
};

/**
 * Advanced debounce utility supporting sync and async functions
 * @param func Function to debounce
 * @param wait Delay in milliseconds (default 300ms)
 * @param options Debounce configuration options
 */
export function debounce<F extends (...args: any[]) => any>(
  func: F, 
  wait = 300, 
  options: DebounceOptions = {}
): DebounceFunction<F> {
  const { 
    leading = false, 
    trailing = true, 
    maxWait 
  } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<F> | null = null;
  let lastThis: any = null;
  let lastCallTime: number | null = null;
  let result: ReturnType<F> | undefined;

  const invokeFunc = (time: number) => {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastCallTime = time;

    try {
      result = func.apply(thisArg, args as Parameters<F>);
    } catch (error) {
      console.error('Debounce function error:', error);
      throw error;
    }

    return result;
  };

  const remainingWait = (time: number) => {
    if (!lastCallTime) return wait;
    const timeSinceLastCall = time - lastCallTime;
    return Math.max(wait - timeSinceLastCall, 0);
  };

  const startTimer = (pendingFunc: () => void, localWait: number) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(pendingFunc, localWait);
  };

  const cancelTimer = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (maxTimeoutId) clearTimeout(maxTimeoutId);
    timeoutId = null;
    maxTimeoutId = null;
    lastArgs = null;
    lastCallTime = null;
    lastThis = null;
  };

  const debouncedFunc: DebounceFunction<F> = function(this: any, ...args: Parameters<F>) {
    const time = Date.now();
    const isInvoking = 
      (leading && (!lastCallTime || time - lastCallTime >= wait)) || 
      (trailing && (lastArgs !== null));

    lastArgs = args;
    lastThis = this;

    if (isInvoking) {
      if (!timeoutId) {
        // Immediate execution for leading option
        if (leading) {
          invokeFunc(time);
        }

        // Set max wait timeout if specified
        if (maxWait) {
          maxTimeoutId = setTimeout(() => {
            const scheduledTime = Date.now();
            if (lastArgs) {
              invokeFunc(scheduledTime);
            }
          }, maxWait);
        }

        // Schedule trailing execution
        startTimer(() => {
          const scheduledTime = Date.now();
          if (trailing && lastArgs) {
            invokeFunc(scheduledTime);
          }
          cancelTimer();
        }, wait);
      }
    }

    return result;
  } as DebounceFunction<F>;

  // Attach utility methods
  debouncedFunc.cancel = cancelTimer;
  debouncedFunc.flush = () => {
    if (lastArgs && timeoutId) {
      const time = Date.now();
      return invokeFunc(time);
    }
    return undefined;
  };

  return debouncedFunc;
}

/**
 * React hook for using debounce with functional components
 * @param func Function to debounce
 * @param wait Delay in milliseconds (default 300ms)
 * @param options Debounce configuration options
 */
export function useDebouncedCallback<F extends (...args: any[]) => any>(
  func: F, 
  wait = 300, 
  options: DebounceOptions = {}
): F {
  const debouncedRef = useRef<DebounceFunction<F> | null>(null);

  useEffect(() => {
    // Create debounced function
    debouncedRef.current = debounce(func, wait, options);

    // Cleanup on unmount or dependencies change
    return () => {
      debouncedRef.current?.cancel();
    };
  }, [func, wait, JSON.stringify(options)]);

  // Memoized callback to prevent unnecessary re-renders
  const memoizedCallback = useCallback((...args: Parameters<F>) => {
    return debouncedRef.current?.apply(null, args);
  }, []);

  return memoizedCallback as F;
}

/**
 * Debounce utility for async functions with promise cancellation
 * @param func Async function to debounce
 * @param wait Delay in milliseconds (default 300ms)
 * @param options Debounce configuration options
 */
export function debouncedAsync<F extends (...args: any[]) => Promise<any>>(
  func: F, 
  wait = 300, 
  options: DebounceOptions = {}
): (...args: Parameters<F>) => Promise<ReturnType<F> | undefined> {
  const debouncedFn = debounce(func, wait, options);

  return async (...args: Parameters<F>) => {
    try {
      return await debouncedFn(...args) as Promise<ReturnType<F>>;
    } catch (error) {
      console.warn('Debounced async function error:', error);
      return undefined;
    }
  };
}