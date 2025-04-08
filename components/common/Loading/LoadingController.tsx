"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import EnhancedLoadingOverlay from './EnhancedLoadingOverlay';
import HandbagLoader from './HandbagLoader';
import FormLoader from './FormLoader';
import { useLoading } from './LoadingProvider';

interface LoadingControllerProps {
    /** Default duration for initial page loading */
    initialLoadDuration?: number;
    /** Default duration for data loading */
    dataLoadDuration?: number;
}

const LoadingController: React.FC<LoadingControllerProps> = ({
    initialLoadDuration = 1800,
    dataLoadDuration = 800,
}) => {
    const { loading } = useLoading();
    const pathname = usePathname();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Don't render anything if not loading
    if (!loading.isLoading) return null;

    // Determine which component to show based on loading type and current route
    const renderLoader = () => {
        // Check if we're on a handbag-related page
        const isHandbagPage = pathname?.includes('/handbag') || pathname?.includes('/tui-xach');
        const isFormPage = pathname?.includes('/create') || pathname?.includes('/edit') || pathname?.includes('/form');

        switch (loading.type) {
            case 'initial':
                // For initial page load
                if (isHandbagPage) {
                    return (
                        <div className="fixed inset-0 z-50">
                            <EnhancedLoadingOverlay
                                isLoading={true}
                                type="fullscreen"
                                text={loading.message || "Đang tải dữ liệu..."}
                                showLogo={true}
                                autoDismiss={initialLoadDuration}
                            />
                        </div>
                    );
                }

                // Default initial loader
                return (
                    <div className="fixed inset-0 z-50">
                        <EnhancedLoadingOverlay
                            isLoading={true}
                            type="fullscreen"
                            text={loading.message || "Đang tải..."}
                            showLogo={true}
                            autoDismiss={initialLoadDuration}
                        />
                    </div>
                );

            case 'data':
                // For data loading
                if (isHandbagPage) {
                    return (
                        <div className="fixed inset-0 z-40 bg-white/40 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <div className="max-w-2xl w-full">
                                <HandbagLoader
                                    type="list"
                                    text={loading.message || "Đang tải dữ liệu túi xách..."}
                                />
                            </div>
                        </div>
                    );
                }

                // Default data loader
                return (
                    <div className="fixed inset-0 z-40 bg-white/40 dark:bg-black/40 backdrop-blur-sm">
                        <EnhancedLoadingOverlay
                            isLoading={true}
                            type="container"
                            text={loading.message || "Đang tải dữ liệu..."}
                            autoDismiss={dataLoadDuration}
                        />
                    </div>
                );

            case 'form':
                return (
                    <div className="fixed inset-0 z-40 bg-white/40 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <div className="relative max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
                            <FormLoader
                                fieldCount={6}
                                showTitle={true}
                                showSubmit={true}
                                animationSpeed="normal"
                                forceDarkMode={isDark}
                            />
                        </div>
                    </div>
                );

            case 'action':
                // For actions like saving, deleting, etc.
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto">
                            <EnhancedLoadingOverlay
                                isLoading={true}
                                type="minimal"
                                text={loading.message || "Đang xử lý..."}
                            />
                        </div>
                    </div>
                );

            case 'custom':
                // For custom loading states with custom content
                if (loading.customData?.component === 'HandbagStats') {
                    return (
                        <div className="fixed inset-0 z-40 bg-white/40 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <div className="max-w-4xl w-full">
                                <HandbagLoader
                                    type="stats"
                                    text={loading.message || "Đang tải thống kê túi xách..."}
                                />
                            </div>
                        </div>
                    );
                }

                // Default custom loader
                return (
                    <div className="fixed inset-0 z-40">
                        <EnhancedLoadingOverlay
                            isLoading={true}
                            type="container"
                            text={loading.message || "Đang tải..."}
                        />
                    </div>
                );

            default:
                // Fallback loader
                return (
                    <div className="fixed inset-0 z-40">
                        <EnhancedLoadingOverlay
                            isLoading={true}
                            type="minimal"
                            text={loading.message || "Đang xử lý..."}
                        />
                    </div>
                );
        }
    };

    return (
        <React.Fragment>
            {renderLoader()}
        </React.Fragment>
    );
};

export default LoadingController;