"use client";

import { useEffect, useMemo, useCallback } from 'react';
import { LoadingConfig, useLoading } from './UnifieldLoadingSystem';

/**
 * Hook for managing data fetching loading states
 * 
 * @param key Unique identifier for this loading state
 * @param options Configuration options
 * @returns Loading state controls and state
 */
export const useDataLoading = (
  key: string,
  options: {
    message?: string;
    variant?: 'fullscreen' | 'container' | 'inline' | 'table' | 'minimal';
    autoDismiss?: number;
    delay?: number;
    initialState?: boolean;
  } = {}
) => {
  const { startLoading, stopLoading, isLoading } = useLoading();
  
  const config: LoadingConfig = useMemo(() => ({
    message: options.message || 'Đang tải dữ liệu...',
    variant: options.variant || 'container',
    type: 'data',
    autoDismiss: options.autoDismiss,
    delay: options.delay || 300, // Small delay to prevent flash
    minDuration: 500, // Minimum duration to prevent flash
  }), [options.message, options.variant, options.autoDismiss, options.delay]);
  
  // Start loading if initialState is true
  useEffect(() => {
    if (options.initialState) {
      startLoading(key, config);
    }
    
    return () => {
      stopLoading(key);
    };
  }, []);
  
  const startDataLoading = useCallback(() => {
    startLoading(key, config);
  }, [key, config, startLoading]);
  
  const stopDataLoading = useCallback(() => {
    stopLoading(key);
  }, [key, stopLoading]);
  
  return {
    isLoading: isLoading(key),
    startLoading: startDataLoading,
    stopLoading: stopDataLoading,
    loadingKey: key
  };
};

/**
 * Hook for managing form submission loading states
 * 
 * @param key Unique identifier for this loading state
 * @param options Configuration options
 * @returns Loading state controls and wrappers
 */
export const useFormLoading = (
  key: string,
  options: {
    message?: string;
    variant?: 'minimal' | 'inline' | 'container';
    successMessage?: string;
    errorMessage?: string;
  } = {}
) => {
  const { startLoading, stopLoading, updateLoading, isLoading } = useLoading();
  
  const config: LoadingConfig = useMemo(() => ({
    message: options.message || 'Đang xử lý...',
    variant: options.variant || 'minimal',
    type: 'action',
    minDuration: 300, // Minimum duration to prevent flash
  }), [options.message, options.variant]);
  
  const startFormLoading = useCallback(() => {
    startLoading(key, config);
  }, [key, config, startLoading]);
  
  const stopFormLoading = useCallback(() => {
    stopLoading(key);
  }, [key, stopLoading]);
  
  const setSuccessState = useCallback(() => {
    if (options.successMessage) {
      updateLoading(key, { message: options.successMessage });
      // Auto-dismiss success message after 1.5s
      setTimeout(() => stopLoading(key), 1500);
    } else {
      stopLoading(key);
    }
  }, [key, updateLoading, stopLoading, options.successMessage]);
  
  const setErrorState = useCallback(() => {
    if (options.errorMessage) {
      updateLoading(key, { message: options.errorMessage });
      // Auto-dismiss error message after 2s
      setTimeout(() => stopLoading(key), 2000);
    } else {
      stopLoading(key);
    }
  }, [key, updateLoading, stopLoading, options.errorMessage]);
  
  // Wrap async functions with loading states
  const withLoading = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T
  ): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      try {
        startFormLoading();
        const result = await fn(...args);
        setSuccessState();
        return result;
      } catch (error) {
        setErrorState();
        throw error;
      }
    };
  }, [startFormLoading, setSuccessState, setErrorState]);
  
  return {
    isLoading: isLoading(key),
    startLoading: startFormLoading,
    stopLoading: stopFormLoading,
    setSuccessState,
    setErrorState,
    withLoading,
    loadingKey: key
  };
};

/**
 * Hook for managing page loading states
 * 
 * @param options Configuration options
 * @returns Loading state controls
 */
export const usePageLoading = (
  options: {
    key?: string;
    initialDelay?: number;
    minDuration?: number;
    showLogo?: boolean;
    message?: string;
  } = {}
) => {
  const loadingKey = options.key || 'page-loading';
  const { startLoading, stopLoading, isLoading } = useLoading();
  
  const config: LoadingConfig = useMemo(() => ({
    message: options.message || 'Đang tải trang...',
    variant: 'fullscreen',
    type: 'initial',
    delay: options.initialDelay || 0,
    minDuration: options.minDuration || 800,
    showLogo: options.showLogo !== undefined ? options.showLogo : true,
  }), [options.message, options.initialDelay, options.minDuration, options.showLogo]);
  
  // Start page loading when component mounts
  useEffect(() => {
    startLoading(loadingKey, config);
    
    return () => {
      stopLoading(loadingKey);
    };
  }, []);
  
  const startPageLoading = useCallback(() => {
    startLoading(loadingKey, config);
  }, [loadingKey, config, startLoading]);
  
  const stopPageLoading = useCallback(() => {
    stopLoading(loadingKey);
  }, [loadingKey, stopLoading]);
  
  return {
    isLoading: isLoading(loadingKey),
    startLoading: startPageLoading,
    stopLoading: stopPageLoading,
    loadingKey
  };
};

/**
 * Hook for creating skeleton loaders
 * 
 * @param options Configuration options
 * @returns Functions to control skeleton loading states
 */
export const useSkeletonLoading = (
  options: {
    key?: string;
    variant?: 'table' | 'form' | 'skeleton';
    rows?: number;
    columns?: number;
    fields?: Array<'text' | 'input' | 'select' | 'checkbox' | 'date' | 'textarea'>;
    duration?: number;
    autoStart?: boolean;
  }
) => {
  const loadingKey = options.key || `skeleton-${Math.random().toString(36).substring(2, 9)}`;
  const { startLoading, stopLoading, isLoading } = useLoading();
  
  const config: LoadingConfig = useMemo(() => ({
    variant: options.variant || 'skeleton',
    type: 'data',
    skeletonConfig: {
      rows: options.rows,
      columns: options.columns,
      fields: options.fields
    },
    minDuration: options.duration || 800
  }), [
    options.variant, 
    options.rows, 
    options.columns, 
    options.fields, 
    options.duration
  ]);
  
  // Auto-start if specified
  useEffect(() => {
    if (options.autoStart) {
      startLoading(loadingKey, config);
    }
    
    return () => {
      stopLoading(loadingKey);
    };
  }, []);
  
  const startSkeletonLoading = useCallback(() => {
    startLoading(loadingKey, config);
  }, [loadingKey, config, startLoading]);
  
  const stopSkeletonLoading = useCallback(() => {
    stopLoading(loadingKey);
  }, [loadingKey, stopLoading]);
  
  return {
    isLoading: isLoading(loadingKey),
    startLoading: startSkeletonLoading,
    stopLoading: stopSkeletonLoading,
    loadingKey
  };
};

/**
 * Hook for managing background processes loading
 * 
 * @param key Unique identifier for this loading process
 * @param options Configuration options
 * @returns Controls for background loading
 */
export const useBackgroundLoading = (
  key: string,
  options: {
    message?: string;
    variant?: 'minimal' | 'inline';
  } = {}
) => {
  const { startLoading, stopLoading, isLoading } = useLoading();
  
  const config: LoadingConfig = useMemo(() => ({
    message: options.message || 'Đang xử lý...',
    variant: options.variant || 'inline',
    type: 'background',
    delay: 150, // Small delay to prevent flash
  }), [options.message, options.variant]);
  
  const startBackgroundLoading = useCallback(() => {
    startLoading(key, config);
  }, [key, config, startLoading]);
  
  const stopBackgroundLoading = useCallback(() => {
    stopLoading(key);
  }, [key, stopLoading]);
  
  const withBackgroundLoading = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T
  ): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      try {
        startBackgroundLoading();
        const result = await fn(...args);
        stopBackgroundLoading();
        return result;
      } catch (error) {
        stopBackgroundLoading();
        throw error;
      }
    };
  }, [startBackgroundLoading, stopBackgroundLoading]);
  
  return {
    isLoading: isLoading(key),
    startLoading: startBackgroundLoading,
    stopLoading: stopBackgroundLoading,
    withBackgroundLoading,
    loadingKey: key
  };
};