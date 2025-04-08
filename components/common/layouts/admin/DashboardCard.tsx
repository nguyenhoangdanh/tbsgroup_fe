"use client";

import { LucideProps, type LucideIcon } from 'lucide-react';
import React, { memo, ReactElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

export interface DashboardCardProps {
    title: string;
    description: string;
    data: string | number;
    icon: LucideIcon | React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>> | ReactElement;
    bgcolor?: string;
    iconColor?: string;
    theme?: string;
    bgdark?: string;
    onClick?: () => void;
    isLoading?: boolean;
}

export const DashboardCardComponent = memo<DashboardCardProps>(({
    title,
    description,
    data,
    icon,
    iconColor,
    theme,
    bgcolor = "bg-gray-100",
    bgdark = "bg-gray-800",
    onClick,
    isLoading = false,
}) => {
    const isDark = theme === "dark";
    const bgColor = isDark ? bgdark : bgcolor;
    const textColor = isDark ? "text-white" : "text-gray-900";
    if (isLoading) {
        return (
            <Card className="h-full w-full">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="w-9 h-9 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-32 mt-1" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-28" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={`h-full w-full transition-all hover:shadow-md ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
            onClick={onClick}
            data-testid={`dashboard-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${bgColor} flex-shrink-0`}>
                        {/* <Icon size={18} className={`${isDark ? 'text-white' : 'text-gray-900'} ${iconColor}`} /> */}
                        {React.isValidElement(icon) ? (
                            icon
                        ) : (
                            // For LucideIcon or ForwardRefExoticComponent
                            React.createElement(icon as any, {
                                size: 18,
                                className: `${isDark ? 'text-white' : 'text-gray-900'} ${iconColor || ''}`
                            })
                        )}
                    </div>
                </div>
                <CardDescription className="text-xs truncate">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className={`text-2xl font-bold ${textColor}`}>{data}</p>
            </CardContent>
        </Card>
    );
});

DashboardCardComponent.displayName = "DashboardCardComponent";