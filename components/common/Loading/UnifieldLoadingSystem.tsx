"use client";

import React, { useState, useEffect, createContext, useContext, useCallback, ReactNode, useRef } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Loading variants to handle different use cases
export type LoadingVariant =
    | 'fullscreen'  // For full page loading
    | 'container'   // For loading a specific container
    | 'inline'      // For inline elements
    | 'table'       // For table loading
    | 'form'        // For form loading
    | 'skeleton'    // For skeleton loading
    | 'minimal';    // For minimal loading indicators

// Loading types for semantic differentiation
export type LoadingType =
    | 'initial'     // Initial page load
    | 'data'        // Data fetching
    | 'action'      // User action (submit, delete, etc.)
    | 'background'  // Background processing
    | 'custom';     // Custom loading with specific needs

// Configuration for loading states
export interface LoadingConfig {
    message?: string;          // Loading message
    variant?: LoadingVariant;  // Visual variant
    type?: LoadingType;        // Semantic type
    component?: string;        // Component identifier
    autoDismiss?: number;      // Auto dismiss time in ms
    showLogo?: boolean;        // Show logo in loading indicator
    customClass?: string;      // Custom CSS classes
    delay?: number;            // Delay before showing (prevents flashing)
    minDuration?: number;      // Minimum display time
    skeletonConfig?: {         // Configuration for skeleton loaders
        rows?: number;
        columns?: number;
        density?: 'compact' | 'normal' | 'comfortable';
        fields?: Array<'text' | 'input' | 'select' | 'checkbox' | 'date' | 'textarea'>;
    }
}

// Loading state interface
interface LoadingState {
    isLoading: boolean;
    configs: Record<string, LoadingConfig>;
    globalConfig?: LoadingConfig;
}

// Loading manager context interface
interface LoadingContextType {
    startLoading: (key: string, config?: LoadingConfig) => void;
    stopLoading: (key: string) => void;
    updateLoading: (key: string, config: Partial<LoadingConfig>) => void;
    isLoading: (key?: string) => boolean;
    getLoadingState: () => LoadingState;
    setGlobalConfig: (config: LoadingConfig) => void;
}

// Create the context
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * Loading Provider Component - Manages all loading states in the application
 */
export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State for tracking all loading operations
    const [loadingState, setLoadingState] = useState<LoadingState>({
        isLoading: false,
        configs: {},
    });

    // Refs for tracking timeouts
    const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
    const loadingStartTimesRef = useRef<Record<string, number>>({});

    // Utility to clean up a specific timeout
    const clearLoadingTimeout = useCallback((key: string) => {
        if (timeoutsRef.current[key]) {
            clearTimeout(timeoutsRef.current[key]);
            delete timeoutsRef.current[key];
        }
    }, []);

    // Start a loading operation
    const startLoading = useCallback((key: string, config?: LoadingConfig) => {
        clearLoadingTimeout(key);

        // If delay is specified, wait before showing the loading indicator
        if (config?.delay && config.delay > 0) {
            timeoutsRef.current[key] = setTimeout(() => {
                loadingStartTimesRef.current[key] = Date.now();
                setLoadingState(prevState => ({
                    isLoading: true,
                    configs: {
                        ...prevState.configs,
                        [key]: {
                            ...prevState.globalConfig,
                            ...config,
                        }
                    },
                    globalConfig: prevState.globalConfig
                }));
            }, config.delay);
            return;
        }

        // Otherwise show immediately
        loadingStartTimesRef.current[key] = Date.now();
        setLoadingState(prevState => ({
            isLoading: true,
            configs: {
                ...prevState.configs,
                [key]: {
                    ...prevState.globalConfig,
                    ...config,
                }
            },
            globalConfig: prevState.globalConfig
        }));

        // Handle auto-dismiss if specified
        if (config?.autoDismiss && config.autoDismiss > 0) {
            timeoutsRef.current[key] = setTimeout(() => {
                stopLoading(key);
            }, config.autoDismiss);
        }
    }, []);

    // Stop a loading operation
    const stopLoading = useCallback((key: string) => {
        clearLoadingTimeout(key);

        // If minDuration is set, ensure loading shows for at least that time
        const startTime = loadingStartTimesRef.current[key];
        const config = loadingState.configs[key];

        if (startTime && config?.minDuration) {
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < config.minDuration) {
                const remainingTime = config.minDuration - elapsedTime;
                timeoutsRef.current[key] = setTimeout(() => {
                    setLoadingState(prevState => {
                        const newConfigs = { ...prevState.configs };
                        delete newConfigs[key];
                        return {
                            isLoading: Object.keys(newConfigs).length > 0,
                            configs: newConfigs,
                            globalConfig: prevState.globalConfig
                        };
                    });
                }, remainingTime);
                return;
            }
        }

        // Otherwise remove immediately
        setLoadingState(prevState => {
            const newConfigs = { ...prevState.configs };
            delete newConfigs[key];
            return {
                isLoading: Object.keys(newConfigs).length > 0,
                configs: newConfigs,
                globalConfig: prevState.globalConfig
            };
        });
    }, [loadingState.configs]);

    // Update configuration for an active loading operation
    const updateLoading = useCallback((key: string, config: Partial<LoadingConfig>) => {
        setLoadingState(prevState => {
            if (!prevState.configs[key]) return prevState;

            return {
                ...prevState,
                configs: {
                    ...prevState.configs,
                    [key]: {
                        ...prevState.configs[key],
                        ...config
                    }
                }
            };
        });
    }, []);

    // Check if a specific loading key or any loading is active
    const isLoading = useCallback((key?: string): boolean => {
        if (key) return !!loadingState.configs[key];
        return loadingState.isLoading;
    }, [loadingState]);

    // Get entire loading state
    const getLoadingState = useCallback((): LoadingState => {
        return loadingState;
    }, [loadingState]);

    // Set global configuration that applies to all loading operations
    const setGlobalConfig = useCallback((config: LoadingConfig) => {
        setLoadingState(prevState => ({
            ...prevState,
            globalConfig: {
                ...prevState.globalConfig,
                ...config
            }
        }));
    }, []);

    // Clean up all timeouts on unmount
    useEffect(() => {
        return () => {
            Object.keys(timeoutsRef.current).forEach(key => {
                clearTimeout(timeoutsRef.current[key]);
            });
        };
    }, []);

    // Context value
    const contextValue: LoadingContextType = {
        startLoading,
        stopLoading,
        updateLoading,
        isLoading,
        getLoadingState,
        setGlobalConfig
    };

    return (
        <LoadingContext.Provider value={contextValue}>
            {children}
            <LoadingRenderer />
        </LoadingContext.Provider>
    );
};

/**
 * Hook to use the loading context
 */
export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};

/**
 * Component that renders active loading indicators
 */
const LoadingRenderer: React.FC = () => {
    const { getLoadingState } = useLoading();
    const loadingState = getLoadingState();

    if (!loadingState.isLoading) return null;

    return (
        <>
            {Object.entries(loadingState.configs).map(([key, config]) => (
                <LoadingComponent key={key} id={key} config={config} />
            ))}
        </>
    );
};

/**
 * Individual loading component that renders based on configuration
 */
interface LoadingComponentProps {
    id: string;
    config: LoadingConfig;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({ id, config }) => {
    const { theme } = useTheme();
    const isDark = config.variant === 'fullscreen' ? theme === 'dark' : undefined;
    const isMobile = useMediaQuery("(max-width: 640px)");
    const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");

    // Select appropriate component based on variant
    switch (config.variant) {
        case 'fullscreen':
            return <FullscreenLoader config={config} isDark={isDark} isMobile={isMobile} isTablet={isTablet} />;
        case 'container':
            return <ContainerLoader config={config} isDark={isDark} isMobile={isMobile} isTablet={isTablet} />;
        case 'inline':
            return <InlineLoader config={config} isDark={isDark} isMobile={isMobile} isTablet={isTablet} />;
        case 'table':
            return <TableLoader config={config} isDark={isDark} />;
        case 'form':
            return <FormLoader config={config} isDark={isDark} />;
        case 'skeleton':
            return <SkeletonLoader config={config} isDark={isDark} />;
        case 'minimal':
        default:
            return <MinimalLoader config={config} isDark={isDark} isMobile={isMobile} isTablet={isTablet} />;
    }
};

/**
 * Fullscreen loader component
 */
interface LoaderProps {
    config: LoadingConfig;
    isDark?: boolean;
    isMobile?: boolean;
    isTablet?: boolean;
}

const FullscreenLoader: React.FC<LoaderProps> = ({ config, isDark, isMobile, isTablet }) => {
    const getSize = () => {
        return isMobile ? 36 : isTablet ? 44 : 52;
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center 
      ${isDark ? 'bg-gray-900/60' : 'bg-black/30'} backdrop-blur-sm ${config.customClass || ''}`}>
            <div className={`transform transition-all duration-300 ease-out scale-100 
        flex flex-col items-center p-6 rounded-2xl shadow-xl max-w-[90%] w-auto
        ${isDark ? 'bg-gray-800/90' : 'bg-white/90'}`}>

                <div className={`relative w-${getSize()} h-${getSize()} mb-4`}>
                    {/* Outer spinning border */}
                    <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>

                    {/* Inner counter-spinning border */}
                    <div className="absolute inset-0 border-4 border-transparent border-b-primary-foreground border-l-primary-foreground rounded-full animate-spin-reverse"></div>

                    {/* Static circle background */}
                    <div className={`absolute inset-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}></div>

                    {/* Logo centered in spinner */}
                    {config.showLogo && (
                        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                            <ShoppingBag className={`w-${getSize() / 2} h-${getSize() / 2} text-primary`} />
                        </div>
                    )}
                </div>

                {/* Loading text with animation */}
                <div className="text-center space-y-2">
                    <h3 className={`text-xl font-bold tracking-wide animate-pulse
            ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {config.message || "Đang tải..."}
                    </h3>
                    <p className={`text-sm animate-pulse
            ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Vui lòng chờ trong giây lát...
                    </p>
                </div>
            </div>
        </div>
    );
};

/**
 * Container loader component
 */
const ContainerLoader: React.FC<LoaderProps> = ({ config, isDark, isMobile, isTablet }) => {
    const getSize = () => {
        return isMobile ? 28 : isTablet ? 32 : 36;
    };

    return (
        <div className={`absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-10 rounded-lg ${config.customClass || ''}`}>
            <div className="flex flex-col items-center p-4 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-3 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 border-3 border-transparent border-b-primary-foreground border-l-primary-foreground rounded-full animate-spin-reverse"></div>
                    {config.showLogo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                    )}
                </div>
                {config.message && <p className="mt-3 text-sm font-medium text-center">{config.message}</p>}
            </div>
        </div>
    );
};

/**
 * Inline loader component
 */
const InlineLoader: React.FC<LoaderProps> = ({ config, isDark, isMobile }) => {
    const size = isMobile ? 16 : 20;

    return (
        <div className={`inline-flex items-center gap-2 ${config.customClass || ''}`}>
            <Loader2 size={size} className="animate-spin text-primary" />
            {config.message && <span className="text-sm font-medium">{config.message}</span>}
        </div>
    );
};

/**
 * Minimal loader component
 */
const MinimalLoader: React.FC<LoaderProps> = ({ config, isDark, isMobile }) => {
    const size = isMobile ? 20 : 24;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${config.customClass || ''}`}>
            <div className="pointer-events-auto animate-pulse bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                <Loader2 size={size} className="animate-spin text-primary" />
                {config.message && (
                    <span className="mt-2 block text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                        {config.message}
                    </span>
                )}
            </div>
        </div>
    );
};

/**
 * Table loader component
 */
const TableLoader: React.FC<Omit<LoaderProps, 'isMobile' | 'isTablet'>> = ({ config, isDark }) => {
    const columns = config.skeletonConfig?.columns || 5;
    const rows = config.skeletonConfig?.rows || 6;

    // Create a stable width pattern based on row and column indices
    const getWidthClass = (rowIndex: number, colIndex: number) => {
        const options = ["w-16", "w-24", "w-32", "w-40", "w-full"];
        // Use deterministic formula based on indices to select width
        const index = (rowIndex + colIndex) % options.length;
        return options[index];
    };

    return (
        <div className={`w-full animate-pulse ${config.customClass || ''}`}>
            {/* Skeleton for search bar and buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-2 mb-4">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-64"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>

            {/* Table-like structure */}
            <div className="overflow-x-auto border rounded-md bg-white dark:bg-gray-900">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-800 border-b">
                    <div className="flex">
                        {Array.from({ length: columns }).map((_, index) => (
                            <div key={`header-${index}`} className="px-4 py-3 flex-1">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="flex border-b last:border-0">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div key={`cell-${rowIndex}-${colIndex}`} className="px-4 py-3 flex-1">
                                    <div className={`h-5 bg-gray-200 dark:bg-gray-700 rounded ${getWidthClass(rowIndex, colIndex)}`}></div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination skeleton */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-4 mt-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                </div>
            </div>
        </div>
    );
};

/**
 * Form loader component
 */
const FormLoader: React.FC<Omit<LoaderProps, 'isMobile' | 'isTablet'>> = ({ config, isDark }) => {
    const fieldCount = config.skeletonConfig?.rows || 6;
    const fieldTypes = config.skeletonConfig?.fields || ['input', 'input', 'select', 'checkbox', 'date', 'textarea'];

    // Background color classes
    const bgClass = isDark ? 'bg-gray-800' : 'bg-gray-200';
    const bgClassDarker = isDark ? 'bg-gray-700' : 'bg-gray-300';

    // Animation delay based on field index
    const getAnimationDelay = (index: number) => {
        const baseDelay = 0.1;
        return `${index * baseDelay}s`;
    };

    // Render a field skeleton based on its type
    const renderField = (type: string, index: number) => {
        const delay = getAnimationDelay(index);

        switch (type) {
            case 'textarea':
                return (
                    <div
                        key={`field-${index}`}
                        className="space-y-2 mb-6"
                        style={{ animationDelay: delay }}
                    >
                        <div className={`h-5 w-1/3 rounded ${bgClass} animate-pulse`}></div>
                        <div className={`h-24 w-full rounded ${bgClass} animate-pulse`}></div>
                    </div>
                );

            case 'select':
                return (
                    <div
                        key={`field-${index}`}
                        className="space-y-2 mb-6"
                        style={{ animationDelay: delay }}
                    >
                        <div className={`h-5 w-1/4 rounded ${bgClass} animate-pulse`}></div>
                        <div className={`h-10 w-full rounded ${bgClass} animate-pulse relative`}>
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${bgClassDarker} rounded`}></div>
                        </div>
                    </div>
                );

            case 'checkbox':
                return (
                    <div
                        key={`field-${index}`}
                        className="flex items-center space-x-3 mb-6"
                        style={{ animationDelay: delay }}
                    >
                        <div className={`h-5 w-5 rounded ${bgClass} animate-pulse`}></div>
                        <div className={`h-5 w-1/3 rounded ${bgClass} animate-pulse`}></div>
                    </div>
                );

            case 'date':
                return (
                    <div
                        key={`field-${index}`}
                        className="space-y-2 mb-6"
                        style={{ animationDelay: delay }}
                    >
                        <div className={`h-5 w-1/4 rounded ${bgClass} animate-pulse`}></div>
                        <div className={`h-10 w-full rounded ${bgClass} animate-pulse relative`}>
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${bgClassDarker} rounded`}></div>
                        </div>
                    </div>
                );

            case 'input':
            default:
                return (
                    <div
                        key={`field-${index}`}
                        className="space-y-2 mb-6"
                        style={{ animationDelay: delay }}
                    >
                        <div className={`h-5 w-1/4 rounded ${bgClass} animate-pulse`}></div>
                        <div className={`h-10 w-full rounded ${bgClass} animate-pulse`}></div>
                    </div>
                );
        }
    };

    // Generate required number of fields
    const fields = Array.from({ length: fieldCount }).map((_, index) => {
        const fieldType = fieldTypes[index % fieldTypes.length];
        return renderField(fieldType, index);
    });

    return (
        <div className={`w-full px-1 ${config.customClass || ''}`}>
            {/* Form title and description */}
            <div className="mb-8 space-y-3">
                <div className={`h-8 w-1/3 rounded ${bgClass} animate-pulse`}></div>
                <div className={`h-4 w-2/3 rounded ${bgClass} animate-pulse`}></div>
            </div>

            {/* Form divider */}
            <div className={`h-px w-full ${bgClass} mb-6`}></div>

            {/* Form fields */}
            <div className="py-2">
                {fields}
            </div>

            {/* Submit button(s) */}
            <div className="mt-6 pt-4 flex justify-end space-x-3">
                <div className={`h-10 w-24 rounded ${bgClass} animate-pulse`}></div>
                <div className={`h-10 w-24 rounded ${bgClassDarker} animate-pulse`}></div>
            </div>

            {config.message && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[1px] rounded">
                    <div className="flex flex-col items-center bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg">
                        <Loader2 size={32} className="animate-spin text-primary mb-2" />
                        <p className="text-sm font-medium">{config.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * General skeleton loader for custom content
 */
const SkeletonLoader: React.FC<Omit<LoaderProps, 'isMobile' | 'isTablet'>> = ({ config, isDark }) => {
    // This is a simplified version that can be expanded based on specific needs
    const bgClass = isDark ? 'bg-gray-800' : 'bg-gray-200';

    return (
        <div className={`w-full animate-pulse ${config.customClass || ''}`}>
            <div className="space-y-4">
                <div className={`h-8 w-3/4 rounded ${bgClass}`}></div>
                <div className={`h-4 w-full rounded ${bgClass}`}></div>
                <div className={`h-4 w-full rounded ${bgClass}`}></div>
                <div className={`h-4 w-2/3 rounded ${bgClass}`}></div>
            </div>

            <div className="mt-6 space-y-6">
                <div className={`h-32 w-full rounded ${bgClass}`}></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`h-24 rounded ${bgClass}`}></div>
                    <div className={`h-24 rounded ${bgClass}`}></div>
                </div>
                <div className={`h-16 w-full rounded ${bgClass}`}></div>
            </div>
        </div>
    );
};

/**
 * Higher-order component to wrap components with loading functionality
 */
export function withLoading<P extends object>(
    Component: React.ComponentType<P>,
    options: {
        loadingKey?: string;
        loadingConfig?: LoadingConfig;
    } = {}
) {
    return function WithLoadingComponent(props: P) {
        const { startLoading, stopLoading, isLoading } = useLoading();
        const [localLoadingKey] = useState(options.loadingKey || `component-${Math.random().toString(36).substring(2, 9)}`);

        // Handle component mounting/unmounting
        useEffect(() => {
            startLoading(localLoadingKey, options.loadingConfig);

            return () => {
                stopLoading(localLoadingKey);
            };
        }, []);

        if (isLoading(localLoadingKey) && options.loadingConfig?.variant) {
            // For skeleton loaders, we can show the skeleton
            if (options.loadingConfig.variant === 'skeleton') {
                return <SkeletonLoader config={options.loadingConfig} isDark={false} />;
            }
            // For form loaders
            if (options.loadingConfig.variant === 'form') {
                return <FormLoader config={options.loadingConfig} isDark={false} />;
            }
            // For table loaders
            if (options.loadingConfig.variant === 'table') {
                return <TableLoader config={options.loadingConfig} isDark={false} />;
            }

            // For other loader types, we might want to render nothing or a placeholder
            return null;
        }

        return <Component {...props} />;
    };
}

export default LoadingContext;