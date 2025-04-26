"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDigitalForms } from "@/hooks/digital-form/useDigitalForms"
import { Loader2, TrendingUp, TrendingDown, Users, Clipboard, CheckCircle, XCircle } from "lucide-react"

interface StatCardProps {
    title: string
    value: string | number
    description?: string
    icon: React.ReactNode
    trend?: "up" | "down" | "neutral"
    trendValue?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, trend, trendValue }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
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
    )
}

export const FormStatistics: React.FC = () => {
    const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("week")
    const { getFormStats } = useDigitalForms()
    const { data, isLoading, error } = getFormStats({ period })

    const stats = useMemo(() => {
        if (!data?.data) {
            return {
                totalForms: 0,
                pendingForms: 0,
                approvedForms: 0,
                rejectedForms: 0,
                totalEntries: 0,
                totalWorkers: 0,
                trends: {
                    forms: { value: "0%", direction: "neutral" as const },
                    entries: { value: "0%", direction: "neutral" as const },
                    workers: { value: "0%", direction: "neutral" as const },
                },
            }
        }

        const { totalForms, pendingForms, approvedForms, rejectedForms, totalEntries, totalWorkers, previousPeriod } =
            data.data

        // Tính toán xu hướng
        const calculateTrend = (current: number, previous: number) => {
            if (previous === 0) return { value: "0%", direction: "neutral" as const }

            const percentChange = ((current - previous) / previous) * 100
            const direction =
                percentChange > 0 ? ("up" as const) : percentChange < 0 ? ("down" as const) : ("neutral" as const)

            return {
                value: `${Math.abs(percentChange).toFixed(1)}%`,
                direction,
            }
        }

        return {
            totalForms,
            pendingForms,
            approvedForms,
            rejectedForms,
            totalEntries,
            totalWorkers,
            trends: {
                forms: calculateTrend(totalForms, previousPeriod?.totalForms || 0),
                entries: calculateTrend(totalEntries, previousPeriod?.totalEntries || 0),
                workers: calculateTrend(totalWorkers, previousPeriod?.totalWorkers || 0),
            },
        }
    }, [data])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return <div className="text-center p-4 text-red-500">Không thể tải dữ liệu thống kê: {error.message}</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Thống kê phiếu công đoạn</h2>
                <Tabs value={period} onValueChange={(value) => setPeriod(value as any)}>
                    <TabsList>
                        <TabsTrigger value="day">Ngày</TabsTrigger>
                        <TabsTrigger value="week">Tuần</TabsTrigger>
                        <TabsTrigger value="month">Tháng</TabsTrigger>
                        <TabsTrigger value="year">Năm</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Tổng số phiếu"
                    value={stats.totalForms}
                    description={`Trong ${period === "day" ? "ngày" : period === "week" ? "tuần" : period === "month" ? "tháng" : "năm"} này`}
                    icon={<Clipboard />}
                    trend={stats.trends.forms.direction}
                    trendValue={stats.trends.forms.value}
                />
                <StatCard
                    title="Phiếu chờ duyệt"
                    value={stats.pendingForms}
                    description="Cần được xử lý"
                    icon={<Clipboard />}
                />
                <StatCard
                    title="Phiếu đã duyệt"
                    value={stats.approvedForms}
                    description="Đã hoàn thành"
                    icon={<CheckCircle />}
                />
                <StatCard title="Phiếu bị từ chối" value={stats.rejectedForms} description="Cần chỉnh sửa" icon={<XCircle />} />
                <StatCard
                    title="Tổng số dữ liệu"
                    value={stats.totalEntries}
                    description="Số lượng bản ghi"
                    icon={<Clipboard />}
                    trend={stats.trends.entries.direction}
                    trendValue={stats.trends.entries.value}
                />
                <StatCard
                    title="Tổng số công nhân"
                    value={stats.totalWorkers}
                    description="Đã tham gia"
                    icon={<Users />}
                    trend={stats.trends.workers.direction}
                    trendValue={stats.trends.workers.value}
                />
            </div>
        </div>
    )
}

export default FormStatistics
