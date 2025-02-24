import { type LucideIcon } from 'lucide-react';
import React from 'react'

export interface DashboardCardProps {
    title: string;
    description: string;
    data: string | number;
    icon: LucideIcon;
    color?: string;
    theme?: string;
    bgdark?: string;
}

export const DashboardCardComponent: React.FC<DashboardCardProps> = ({
    title,
    description,
    data,
    icon: Icon,
    color = "bg-yellow-100",
    theme,
    bgdark,
}) => {
    return (
        <div
            className={`flex flex-col gap-2 rounded-lg h-[100px] p-4 shadow-md border border-gray-200
                 ${theme === "dark" ? bgdark : color}`}
        >
            <div className="flex items-center gap-2 ">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center ">
                    {<Icon />}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">{title}</span>
                    <span className="text-xs">{description}</span>
                </div>
            </div>
            <div className="flex flex-1 items-end justify-end">
                <span className="text-2xl font-semibold">{data}</span>
            </div>
        </div>
    )
}

