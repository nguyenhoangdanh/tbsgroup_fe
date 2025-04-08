"use client";
import React from 'react';
import { ShoppingBag, Package, CheckCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';

interface HandbagLoaderProps {
    /** Type of loader to display */
    type?: 'list' | 'detail' | 'stats';
    /** Text to display */
    text?: string;
    /** Whether to show in dark mode */
    forceDarkMode?: boolean;
    /** Additional className */
    className?: string;
}

const HandbagLoader: React.FC<HandbagLoaderProps> = ({
    type = 'list',
    text = 'Đang tải dữ liệu túi xách...',
    forceDarkMode,
    className = ''
}) => {
    const { theme } = useTheme();
    const isDark = forceDarkMode !== undefined ? forceDarkMode : theme === 'dark';

    // Stats type loader - animated dashboard cards
    if (type === 'stats') {
        return (
            <div className={`w-full py-4 ${className}`}>
                <div className="flex flex-wrap gap-4 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={`skeleton-card-${i}`}
                            className={`flex-grow basis-60 max-w-xs min-w-60 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className={`h-6 w-32 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                    <div className={`h-4 w-40 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                </div>
                                <div className={`p-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                            </div>
                            <div className={`mt-6 h-10 w-20 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Detail type loader - for form loading
    if (type === 'detail') {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center p-8 ${className}`}>
                <div className="relative w-20 h-20">
                    {/* Animated bag icon that "opens and closes" */}
                    <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'text-primary-foreground' : 'text-primary'
                        }`}>
                        <ShoppingBag size={48} className="animate-bounce" strokeWidth={1.5} />
                    </div>

                    {/* Small package that moves from side to bag */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Package
                            size={20}
                            className={`absolute animate-float-to-center ${isDark ? 'text-blue-400' : 'text-blue-600'
                                }`}
                        />
                    </div>

                    {/* Checkmark that appears */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 animate-fade-in-out">
                        <CheckCircle2
                            size={24}
                            className={`${isDark ? 'text-green-400' : 'text-green-600'}`}
                        />
                    </div>
                </div>

                <p className={`mt-4 text-center font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {text}
                </p>
            </div>
        );
    }

    // List type - default table/list loader
    return (
        <div className={`w-full ${className}`}>
            {/* Header skeleton */}
            <div className="mb-6 space-y-4">
                <div className={`h-8 w-1/3 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-4 w-2/3 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`}></div>
            </div>

            {/* Search and action buttons */}
            <div className="flex justify-between mb-6">
                <div className={`h-10 w-1/3 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`}></div>
                <div className="flex space-x-2">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={`button-${i}`}
                            className={`h-10 w-24 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`}
                        ></div>
                    ))}
                </div>
            </div>

            {/* Table header */}
            <div className={`h-12 w-full rounded-t ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse mb-1`}></div>

            {/* Table rows */}
            {[...Array(6)].map((_, i) => (
                <div
                    key={`row-${i}`}
                    className={`h-14 w-full rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse mb-1`}
                    style={{
                        animationDelay: `${i * 0.1}s`,
                        opacity: 1 - (i * 0.1) // Fade out lower rows
                    }}
                ></div>
            ))}

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className={`h-6 w-40 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-10 w-56 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`}></div>
            </div>
        </div>
    );
};

export default HandbagLoader;