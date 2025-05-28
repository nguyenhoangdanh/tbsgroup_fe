// utils/throttle.ts
import { useCallback, useRef, useEffect } from 'react';

// Options interface for throttle configuration
interface ThrottleOptions {
  leading?: boolean; // Execute on first call
  trailing?: boolean; // Execute after the throttle period if called during wait
}

// Generic type for throttled function
type ThrottleFunction<F extends (...args: any[]) => any> = {
  (...args: Parameters<F>): ReturnType<F> | undefined;
  cancel: () => void;
  flush: () => ReturnType<F> | undefined;
};

/**
 * Advanced throttle utility supporting sync and async functions
 * @param func Function to throttle
 * @param wait Throttle period in milliseconds (default 300ms)
 * @param options Throttle configuration options
 */
export function throttle<F extends (...args: any[]) => any>(
  func: F,
  wait = 300,
  options: ThrottleOptions = {},
): ThrottleFunction<F> {
  const { leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
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
      console.error('Throttle function error:', error);
      throw error;
    }

    return result;
  };

  const cancelTimer = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
    lastCallTime = null;
    lastThis = null;
  };

  const throttledFunc: ThrottleFunction<F> = function (this: any, ...args: Parameters<F>) {
    const time = Date.now();
    const sinceLastCall = lastCallTime ? time - lastCallTime : 0;

    // Store the context and arguments for potential trailing call
    lastArgs = args;
    // lastThis = this;

    // First invocation with leading option
    if (!lastCallTime && !leading) {
      lastCallTime = time;
    }

    // Check if enough time has passed
    if (!lastCallTime || sinceLastCall >= wait) {
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Immediate execution if leading is true
      if (leading) {
        invokeFunc(time);
      }

      // Reset last call time
      lastCallTime = time;
    }
    // Handle trailing call if enabled
    else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        const currentTime = Date.now();

        // Only execute if there are pending arguments
        if (lastArgs) {
          invokeFunc(currentTime);
        }

        // Reset state
        cancelTimer();
      }, wait - sinceLastCall);
    }

    return result;
  } as ThrottleFunction<F>;

  // Attach utility methods
  throttledFunc.cancel = cancelTimer;
  throttledFunc.flush = () => {
    if (lastArgs) {
      const time = Date.now();
      return invokeFunc(time);
    }
    return undefined;
  };

  return throttledFunc;
}

/**
 * React hook for using throttle with functional components
 * @param func Function to throttle
 * @param wait Throttle period in milliseconds (default 300ms)
 * @param options Throttle configuration options
 */
export function useThrottledCallback<F extends (...args: any[]) => any>(
  func: F,
  wait = 300,
  options: ThrottleOptions = {},
): F {
  const throttledRef = useRef<ThrottleFunction<F> | null>(null);

  useEffect(() => {
    // Create throttled function
    throttledRef.current = throttle(func, wait, options);

    // Cleanup on unmount or dependencies change
    return () => {
      throttledRef.current?.cancel();
    };
  }, [func, wait, JSON.stringify(options)]);

  // Memoized callback to prevent unnecessary re-renders
  const memoizedCallback = useCallback((...args: Parameters<F>) => {
    return throttledRef.current?.apply(null, args);
  }, []);

  return memoizedCallback as F;
}

/**
 * Throttle utility for async functions
 * @param func Async function to throttle
 * @param wait Throttle period in milliseconds (default 300ms)
 * @param options Throttle configuration options
 */
export function throttledAsync<F extends (...args: any[]) => Promise<any>>(
  func: F,
  wait = 300,
  options: ThrottleOptions = {},
): (...args: Parameters<F>) => Promise<ReturnType<F> | undefined> {
  const throttledFn = throttle(func, wait, options);

  return async (...args: Parameters<F>) => {
    try {
      return (await throttledFn(...args)) as Promise<ReturnType<F>>;
    } catch (error) {
      console.warn('Throttled async function error:', error);
      return undefined;
    }
  };
}
