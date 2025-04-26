"use client";

import React, { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TrendingUp,
    TrendingDown,
    Users,
    Clipboard,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDigitalFormContext } from "@/hooks/digital-form/DigitalFormContext";
import FormStatistics from "../FormStatistics";

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ReactNode;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    bgColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    description,
    icon,
    trend,
    trendValue,
    bgColor = "bg-white"
}) => {
    return (
        <Card className={bgColor}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-gray-100 p-1 flex items-center justify-center text-muted-foreground">
                        {icon}
                    </div>
                </div>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                {trend && (
                    <div className="flex items-center pt-1">
                        {trend === "up" ? (
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        ) : trend === "down" ? (
                            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                        ) : null}
                        <span className={`text-xs ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : ""}`}>
                            {trendValue}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const DigitalFormDashboard: React.FC = () => {
    // Use the context to get form statistics and filters
    const {
        filters,
        updateFilter
    } = useDigitalFormContext();

    // Mock statistics - in a real app, these would come from the form statistics call
    const stats = useMemo(() => ({
        totalForms: 145,
        pendingForms: 32,
        approvedForms: 98,
        rejectedForms: 15,
        totalEntries: 1248,
        totalWorkers: 125,
        trends: {
            forms: { value: "12.5%", direction: "up" as const },
            entries: { value: "8.3%", direction: "up" as const },
            workers: { value: "3.2%", direction: "down" as const },
        },
    }), []);

    // Handle period change
    const handlePeriodChange = useCallback((period: string) => {
        // This would update your period filter in a real application
        console.log("Period changed to:", period);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Tổng Quan Phiếu Công Đoạn</h2>
                <div className="flex space-x-2">
                    <Badge variant="outline" className="bg-blue-50">
                        Tuần này
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Tổng số phiếu"
                    value={stats.totalForms}
                    description="Trong tuần này"
                    icon={<Clipboard className="h-4 w-4" />}
                    trend={stats.trends.forms.direction}
                    trendValue={stats.trends.forms.value}
                />
                <StatCard
                    title="Phiếu chờ duyệt"
                    value={stats.pendingForms}
                    description="Cần được xử lý"
                    icon={<Clock className="h-4 w-4" />}
                    bgColor="bg-yellow-50"
                />
                <StatCard
                    title="Phiếu đã duyệt"
                    value={stats.approvedForms}
                    description="Đã hoàn thành"
                    icon={<CheckCircle className="h-4 w-4" />}
                    bgColor="bg-green-50"
                />
                <StatCard
                    title="Phiếu bị từ chối"
                    value={stats.rejectedForms}
                    description="Cần chỉnh sửa"
                    icon={<XCircle className="h-4 w-4" />}
                    bgColor="bg-red-50"
                />
                <StatCard
                    title="Tổng số dữ liệu"
                    value={stats.totalEntries}
                    description="Số lượng bản ghi"
                    icon={<Clipboard className="h-4 w-4" />}
                    trend={stats.trends.entries.direction}
                    trendValue={stats.trends.entries.value}
                />
                <StatCard
                    title="Tổng số công nhân"
                    value={stats.totalWorkers}
                    description="Đã tham gia"
                    icon={<Users className="h-4 w-4" />}
                    trend={stats.trends.workers.direction}
                    trendValue={stats.trends.workers.value}
                />
            </div>

            <Tabs defaultValue="week">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Thống kê chi tiết</h2>
                    <TabsList>
                        <TabsTrigger value="day" onClick={() => handlePeriodChange("day")}>Ngày</TabsTrigger>
                        <TabsTrigger value="week" onClick={() => handlePeriodChange("week")}>Tuần</TabsTrigger>
                        <TabsTrigger value="month" onClick={() => handlePeriodChange("month")}>Tháng</TabsTrigger>
                        <TabsTrigger value="year" onClick={() => handlePeriodChange("year")}>Năm</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="day">
                    <FormStatistics />
                </TabsContent>
                <TabsContent value="week">
                    <FormStatistics />
                </TabsContent>
                <TabsContent value="month">
                    <FormStatistics />
                </TabsContent>
                <TabsContent value="year">
                    <FormStatistics />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default DigitalFormDashboard;