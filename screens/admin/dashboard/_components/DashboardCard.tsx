"use client";

import { type LucideIcon } from 'lucide-react';
import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface DashboardCardProps {
    title: string;
    description: string;
    data: string | number;
    icon: LucideIcon;
    color?: string;
    theme?: string;
    bgdark?: string;
    onClick?: () => void;
}

export const DashboardCardComponent = memo<DashboardCardProps>(({
    title,
    description,
    data,
    icon: Icon,
    color = "bg-yellow-100",
    theme,
    bgdark = "bg-gray-800",
    onClick,
}) => {
    const isDark = theme === "dark";
    const bgColor = isDark ? bgdark : color;
    const textColor = isDark ? "text-white" : "text-gray-900";

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
                        <Icon size={18} className={isDark ? "text-white" : ""} />
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