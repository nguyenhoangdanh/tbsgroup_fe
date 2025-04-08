"use client";
import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

// Define loading types
type LoadingType = 'initial' | 'data' | 'form' | 'action' | 'custom';

// Define loading state interface
interface LoadingState {
    type: LoadingType;
    isLoading: boolean;
    message?: string;
    component?: string;
    customData?: any;
}

// Define context interface
interface LoadingContextInterface {
    loading: LoadingState;
    startLoading: (type: LoadingType, message?: string, component?: string, customData?: any) => void;
    stopLoading: (type?: LoadingType) => void;
    isComponentLoading: (component?: string) => boolean;
    setCustomLoadingData: (data: any) => void;
}

// Create the context
const LoadingContext = createContext<LoadingContextInterface | undefined>(undefined);

// Provider component
export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState<LoadingState>({
        type: 'initial',
        isLoading: false,
    });

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Start loading
    const startLoading = useCallback((
        type: LoadingType = 'data',
        message?: string,
        component?: string,
        customData?: any
    ) => {
        // Clear any existing timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setLoading({
            type,
            isLoading: true,
            message,
            component,
            customData
        });
    }, []);

    // Stop loading with optional delay
    const stopLoading = useCallback((type?: LoadingType) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // If a specific type is provided, only stop that type
        if (type && loading.type !== type) {
            return;
        }

        // Add a small delay to prevent flickering for very fast operations
        timeoutRef.current = setTimeout(() => {
            setLoading(prev => ({
                ...prev,
                isLoading: false
            }));
        }, 300);
    }, [loading.type]);

    // Check if a specific component is loading
    const isComponentLoading = useCallback((component?: string) => {
        if (!component) return loading.isLoading;
        return loading.isLoading && loading.component === component;
    }, [loading.isLoading, loading.component]);

    // Set custom loading data
    const setCustomLoadingData = useCallback((data: any) => {
        setLoading(prev => ({
            ...prev,
            customData: data
        }));
    }, []);

    // Clean up timeouts on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <LoadingContext.Provider
            value={{
                loading,
                startLoading,
                stopLoading,
                isComponentLoading,
                setCustomLoadingData
            }}
        >
            {children}
        </LoadingContext.Provider>
    );
};

// Custom hook to use the loading context
export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};

// Higher-order component to manage loading for pages or components
export const withLoading = <P extends object>(
    Component: React.ComponentType<P>,
    loadingType: LoadingType = 'data',
    componentName?: string
) => {
    return function WithLoadingComponent(props: P) {
        const { loading, startLoading, stopLoading } = useLoading();

        React.useEffect(() => {
            startLoading(loadingType, undefined, componentName);

            // Simulate loading for demonstration purposes
            const timer = setTimeout(() => {
                stopLoading(loadingType);
            }, 1500);

            return () => clearTimeout(timer);
        }, []);

        if (loading.isLoading && (loading.component === componentName || !componentName)) {
            return <div>Loading...</div>; // Replace with your actual loading component
        }

        return <Component {...props} />;
    };
};

export default LoadingContext;