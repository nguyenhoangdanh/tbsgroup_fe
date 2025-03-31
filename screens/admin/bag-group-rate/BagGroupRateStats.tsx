"use client";

import React from "react";
import { Activity, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { useBagGroupRateContext } from "@/hooks/group/bag-group-rate/BagGroupRateContext";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCardComponent } from "@/components/common/layouts/admin/DashboardCard";
import { useTheme } from "next-themes";
import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";

// Wrapper component with Context Bridge
const BagGroupRateStats: React.FC = () => {
    return (
        <BagGroupRateContextBridge>
            <BagGroupRateStatsContent />
        </BagGroupRateContextBridge>
    );
};

// Content component that uses the context
const BagGroupRateStatsContent: React.FC = () => {
    const { stats, isLoading } = useBagGroupRateContext();
    const { theme } = useTheme();

    const cardsData = [
        {
            title: "Tổng số năng suất",
            description: "Tổng số cấu hình năng suất đã thiết lập",
            data: stats.totalRates,
            icon: PieChart,
            bgcolor: "bg-blue-100",
            bgdark: "bg-blue-900",
            iconColor: "text-blue-500"
        },
        {
            title: "Năng suất trung bình",
            description: "Trung bình năng suất tất cả các nhóm",
            data: `${stats.averageOutputRate.toFixed(1)} SP/giờ`,
            icon: Activity,
            bgcolor: "bg-purple-100",
            bgdark: "bg-purple-900",
            iconColor: "text-purple-500"
        },
        {
            title: "Năng suất cao nhất",
            description: "Năng suất cao nhất trong các nhóm",
            data: `${stats.highestOutputRate.toFixed(1)} SP/giờ`,
            icon: TrendingUp,
            bgcolor: "bg-green-100",
            bgdark: "bg-green-900",
            iconColor: "text-green-500"
        },
        {
            title: "Năng suất thấp nhất",
            description: "Năng suất thấp nhất trong các nhóm",
            data: `${stats.lowestOutputRate.toFixed(1)} SP/giờ`,
            icon: TrendingDown,
            bgcolor: "bg-red-200",
            bgdark: "bg-red-900",
            iconColor: "text-red-500"
        }
    ];

    if (isLoading) {
        return (
            <div className="flex flex-wrap gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex-grow basis-60 max-w-xs min-w-60">
                        <Skeleton className="h-32 w-full rounded-md" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-4 mb-6">
            {cardsData.map((card, index) => (
                <div key={`baggroup-card-${index}`} className="flex-grow basis-60 max-w-xs min-w-60">
                    <DashboardCardComponent
                        {...card}
                        theme={theme}
                    />
                </div>
            ))}
        </div>
    );
};

export default BagGroupRateStats;