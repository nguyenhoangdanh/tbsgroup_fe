"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingProps {
    /** Text to display below the spinner */
    text?: string;
    /** Size of the spinner in pixels */
    size?: number;
    /** Color of the spinner */
    color?: string;
    /** Whether to show a backdrop behind the loader */
    hasBackdrop?: boolean;
    /** Whether the loading state is active */
    isLoading?: boolean;
    /** Additional className for the container */
    className?: string;
}

const Loading: React.FC<LoadingProps> = ({
    text = "Đang tải...",
    size = 40,
    color = "#3B82F6", // blue-500
    hasBackdrop = false,
    isLoading = true,
    className = "",
}) => {
    if (!isLoading) return null;

    return (
        <div
            className={`${hasBackdrop
                ? "fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                : "relative"
                } ${className}`}
        >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
                <div className="animate-pulse bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                    <Loader2
                        size={size}
                        className="animate-spin text-primary"
                        style={{ color }}
                    />
                </div>
                {text && (
                    <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Loading;