"use client";
import React, { useEffect, useState } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface LoadingOverlayProps {
    /** Whether the loading state is active */
    isLoading?: boolean;
    /** Type of loader to display */
    type?: 'fullscreen' | 'container' | 'minimal';
    /** Text to display below the spinner */
    text?: string;
    /** Show brand logo */
    showLogo?: boolean;
    /** Auto-dismiss after specified ms */
    autoDismiss?: number;
    /** Additional className for the container */
    className?: string;
    /** Dark mode override */
    forceDarkMode?: boolean;
    /** Callback when loading completes */
    onLoadingComplete?: () => void;
}

const EnhancedLoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isLoading = true,
    type = 'fullscreen',
    text = 'Đang tải dữ liệu...',
    showLogo = true,
    autoDismiss = 0,
    className = '',
    forceDarkMode,
    onLoadingComplete
}) => {
    const [visible, setVisible] = useState(isLoading);
    const { theme } = useTheme();
    const isMobile = useMediaQuery("(max-width: 640px)");
    const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");

    // Adjust size based on device and loader type
    const getSize = () => {
        if (type === 'minimal') return isMobile ? 24 : 32;
        return isMobile ? 36 : isTablet ? 44 : 52;
    };

    const isDark = forceDarkMode !== undefined ? forceDarkMode : theme === 'dark';

    useEffect(() => {
        setVisible(isLoading);

        if (!isLoading) {
            if (onLoadingComplete) onLoadingComplete();
            return;
        }

        // Auto-dismiss logic
        if (autoDismiss > 0 && isLoading) {
            const timer = setTimeout(() => {
                setVisible(false);
                if (onLoadingComplete) onLoadingComplete();
            }, autoDismiss);

            return () => clearTimeout(timer);
        }
    }, [isLoading, autoDismiss, onLoadingComplete]);

    if (!visible) return null;

    // Minimal loader for inline or small container use
    if (type === 'minimal') {
        return (
            <div className={`inline-flex items-center gap-2 ${className}`}>
                <Loader2 size={getSize()} className="animate-spin text-primary" />
                {text && <span className="text-sm font-medium">{text}</span>}
            </div>
        );
    }

    // Container loader with semi-transparent background
    if (type === 'container') {
        return (
            <div className={`absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-10 rounded-lg ${className}`}>
                <div className="flex flex-col items-center p-4 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg">
                    <div className="relative">
                        <div className="absolute inset-0 border-3 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
                        <div className="absolute inset-0 border-3 border-transparent border-b-primary-foreground border-l-primary-foreground rounded-full animate-spin-reverse"></div>
                        {showLogo && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ShoppingBag className={`w-${getSize() / 2} h-${getSize() / 2} text-primary animate-pulse`} />
                            </div>
                        )}
                        <div className={`w-${getSize()} h-${getSize()} rounded-full`}></div>
                    </div>
                    {text && <p className="mt-3 text-sm font-medium text-center">{text}</p>}
                </div>
            </div>
        );
    }

    // Fullscreen loader with elegant backdrop and animation
    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center 
      ${isDark ? 'bg-gray-900/60' : 'bg-black/30'} backdrop-blur-sm ${className}`}>
            <div className={`transform transition-all duration-300 ease-out scale-100 
        flex flex-col items-center p-6 rounded-2xl shadow-xl max-w-[90%] w-auto
        ${isDark ? 'bg-gray-800/90' : 'bg-white/90'}`}>

                <div className={`relative w-${getSize()} h-${getSize()} mb-4`}>
                    {/* Outer spinning border */}
                    <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin-slow"></div>

                    {/* Inner counter-spinning border */}
                    <div className="absolute inset-0 border-4 border-transparent border-b-primary-foreground border-l-primary-foreground rounded-full animate-spin-reverse-slow"></div>

                    {/* Static circle background */}
                    <div className={`absolute inset-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}></div>

                    {/* Logo centered in spinner */}
                    {showLogo && (
                        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                            <ShoppingBag className={`w-${getSize() / 2} h-${getSize() / 2} text-primary`} />
                        </div>
                    )}
                </div>

                {/* Loading text with gradient animation */}
                <div className="text-center space-y-2">
                    <h3 className={`text-xl font-bold tracking-wide animate-pulse
            ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {text}
                    </h3>
                    <p className={`text-sm animate-pulse-slow
            ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Vui lòng chờ trong giây lát...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EnhancedLoadingOverlay;