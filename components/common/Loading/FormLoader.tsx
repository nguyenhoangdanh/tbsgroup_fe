"use client";
import React from 'react';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';

interface FormLoaderProps {
    /** Number of fields to show */
    fieldCount?: number;
    /** Types of fields to display */
    fieldTypes?: Array<'short' | 'long' | 'select' | 'checkbox' | 'date'>;
    /** Show submit button */
    showSubmit?: boolean;
    /** Show form title */
    showTitle?: boolean;
    /** Custom class name */
    className?: string;
    /** Animation speed */
    animationSpeed?: 'fast' | 'normal' | 'slow';
    /** Force dark mode */
    forceDarkMode?: boolean;
}

const FormLoader: React.FC<FormLoaderProps> = ({
    fieldCount = 6,
    fieldTypes,
    showSubmit = true,
    showTitle = true,
    className = '',
    animationSpeed = 'normal',
    forceDarkMode
}) => {
    const { theme } = useTheme();
    const isDark = forceDarkMode !== undefined ? forceDarkMode : theme === 'dark';

    // Default field types if not provided
    const defaultFieldTypes = ['short', 'long', 'select', 'checkbox', 'date', 'short'];
    const resolvedFieldTypes = fieldTypes || defaultFieldTypes;

    // Animation delay based on speed setting
    const getAnimationDelay = (index: number) => {
        const baseDelay = animationSpeed === 'fast' ? 0.05 :
            animationSpeed === 'slow' ? 0.15 : 0.1;
        return `${index * baseDelay}s`;
    };

    // Background color classes
    const bgClass = isDark ? 'bg-gray-800' : 'bg-gray-200';
    const bgClassDarker = isDark ? 'bg-gray-700' : 'bg-gray-300';

    // Animation classes
    const animationClass = 'animate-pulse';

    // Render a field skeleton based on its type
    const renderField = (type: string, index: number) => {
        const delay = getAnimationDelay(index);

        switch (type) {
            case 'long':
                return (
                    <div
                        key={`field-${index}`}
                        className="space-y-2 mb-6"
                        style={{ animationDelay: delay }}
                    >
                        <div className={`h-5 w-1/3 rounded ${bgClass} ${animationClass}`}></div>
                        <div className={`h-24 w-full rounded ${bgClass} ${animationClass}`}></div>
                    </div>
                );

            case 'select':
                return (
                    <div
                        key={`field-${index}`}
                        className="space-y-2 mb-6"
                        style={{ animationDelay: delay }}
                    >
                        <div className={`h-5 w-1/4 rounded ${bgClass} ${animationClass}`}></div>
                        <div className={`h-10 w-full rounded ${bgClass} ${animationClass} relative`}>
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
                        <div className={`h-5 w-5 rounded ${bgClass} ${animationClass}`}></div>
                        <div className={`h-5 w-1/3 rounded ${bgClass} ${animationClass}`}></div>
                    </div>
                );

            case 'date':
                return (
                    <div
                        key={`field-${index}`}
                        className="space-y-2 mb-6"
                        style={{ animationDelay: delay }}
                    >
                        <div className={`h-5 w-1/4 rounded ${bgClass} ${animationClass}`}></div>
                        <div className={`h-10 w-full rounded ${bgClass} ${animationClass} relative`}>
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${bgClassDarker} rounded`}></div>
                        </div>
                    </div>
                );

            case 'short':
            default:
                return (
                    <div
                        key={`field-${index}`}
                        className="space-y-2 mb-6"
                        style={{ animationDelay: delay }}
                    >
                        <div className={`h-5 w-1/4 rounded ${bgClass} ${animationClass}`}></div>
                        <div className={`h-10 w-full rounded ${bgClass} ${animationClass}`}></div>
                    </div>
                );
        }
    };

    // Generate required number of fields
    const fields = Array.from({ length: fieldCount }).map((_, index) => {
        const fieldType = resolvedFieldTypes[index % resolvedFieldTypes.length];
        return renderField(fieldType, index);
    });

    return (
        <div className={`w-full px-1 ${className}`}>
            {/* Form title and description */}
            {showTitle && (
                <div className="mb-8 space-y-3">
                    <div className={`h-8 w-1/3 rounded ${bgClass} ${animationClass}`}></div>
                    <div className={`h-4 w-2/3 rounded ${bgClass} ${animationClass}`}></div>
                </div>
            )}

            {/* Form divider */}
            <div className={`h-px w-full ${bgClass} mb-6`}></div>

            {/* Form fields */}
            <div className="py-2">
                {fields}
            </div>

            {/* Submit button(s) */}
            {showSubmit && (
                <div className="mt-6 pt-4 flex justify-end space-x-3">
                    <div className={`h-10 w-24 rounded ${bgClass} ${animationClass}`}></div>
                    <div className={`h-10 w-24 rounded ${bgClassDarker} ${animationClass}`}></div>
                </div>
            )}

            {/* Loading indicator overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[1px] rounded">
                <div className="flex flex-col items-center bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg">
                    <Loader2 size={32} className="animate-spin text-primary mb-2" />
                    <p className="text-sm font-medium">Đang tải biểu mẫu...</p>
                </div>
            </div>
        </div>
    );
};

export default FormLoader;