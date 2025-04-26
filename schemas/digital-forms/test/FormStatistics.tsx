"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, Line } from "recharts"
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { useDigitalForms } from "@/hooks/digital-form/useDigitalForms"
import { RecordStatus } from "@/common/types/digital-form"

const FormStatistics: React.FC = () => {
    const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("week")
    const { getFormStats } = useDigitalForms()
    const { data, isLoading, error } = getFormStats({ period })

    // Generate sample data for the charts when real data is not available
    const chartData = useMemo(() => {
        if (!data?.data) {
            // Generate sample data for different periods
            switch (period) {
                case "day":
                    return Array.from({ length: 24 }, (_, i) => ({
                        name: `${i}:00`,
                        pending: Math.floor(Math.random() * 10),
                        approved: Math.floor(Math.random() * 20),
                        rejected: Math.floor(Math.random() * 5),
                        workers: Math.floor(Math.random() * 30),
                    }))
                case "week":
                    return ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(day => ({
                        name: day,
                        pending: Math.floor(Math.random() * 20),
                        approved: Math.floor(Math.random() * 50),
                        rejected: Math.floor(Math.random() * 10),
                        workers: Math.floor(Math.random() * 60),
                    }))
                case "month":
                    return Array.from({ length: 30 }, (_, i) => ({
                        name: `${i + 1}`,
                        pending: Math.floor(Math.random() * 15),
                        approved: Math.floor(Math.random() * 40),
                        rejected: Math.floor(Math.random() * 8),
                        workers: Math.floor(Math.random() * 50),
                    }))
                case "year":
                    return ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"].map(month => ({
                        name: month,
                        pending: Math.floor(Math.random() * 100),
                        approved: Math.floor(Math.random() * 300),
                        rejected: Math.floor(Math.random() * 50),
                        workers: Math.floor(Math.random() * 200),
                    }))
                default:
                    return []
            }
        }

        // Process real data if available
        // For now, we'll continue to use mock data
        return []
    }, [period, data])

    // Generate factory performance data
    const factoryPerformanceData = useMemo(() => {
        return [
            { name: "Xưởng 1", performance: 92, target: 90 },
            { name: "Xưởng 2", performance: 87, target: 90 },
            { name: "Xưởng 3", performance: 95, target: 90 },
            { name: "Xưởng 4", performance: 82, target: 90 },
            { name: "Xưởng 5", performance: 91, target: 90 },
        ]
    }, [])

    // Process status distribution data
    const statusDistributionData = useMemo(() => {
        // In real implementation, calculate this from data.data
        return [
            { name: "Chờ duyệt", value: 32, color: "#facc15" },
            { name: "Đã duyệt", value: 98, color: "#4ade80" },
            { name: "Từ chối", value: 15, color: "#f87171" },
        ]
    }, [])

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Error display
    if (error) {
        return <div className="text-center p-4 text-red-500">Không thể tải dữ liệu thống kê: {error.message}</div>
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Forms by Status Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Phiếu theo trạng thái</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="pending" name="Chờ duyệt" stackId="a" fill="#facc15" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="approved" name="Đã duyệt" stackId="a" fill="#4ade80" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="rejected" name="Từ chối" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="workers" name="Công nhân" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Factory Performance Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Hiệu suất theo xưởng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={factoryPerformanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="performance" name="Hiệu suất (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="target" name="Mục tiêu (%)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Phân bố trạng thái</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {statusDistributionData.map(item => (
                                <div key={item.name} className="flex items-center">
                                    <div className="w-full">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{item.name}</span>
                                            <span className="text-sm font-medium">{item.value}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${(item.value / statusDistributionData.reduce((sum, cur) => sum + cur.value, 0)) * 100}%`,
                                                    backgroundColor: item.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Top công nhân năng suất</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { name: "Nguyễn Văn A", efficiency: 120 },
                                { name: "Trần Thị B", efficiency: 118 },
                                { name: "Lê Văn C", efficiency: 115 },
                                { name: "Phạm Thị D", efficiency: 110 },
                                { name: "Hoàng Văn E", efficiency: 108 },
                            ].map((worker, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-6 text-center">{index + 1}.</div>
                                        <span className="ml-2">{worker.name}</span>
                                    </div>
                                    <span className="font-medium text-green-600">{worker.efficiency}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Top túi sản xuất</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { name: "BAG001 - Túi loại A", count: 560 },
                                { name: "BAG003 - Túi loại C", count: 423 },
                                { name: "BAG002 - Túi loại B", count: 387 },
                                { name: "BAG005 - Túi loại E", count: 245 },
                                { name: "BAG004 - Túi loại D", count: 182 },
                            ].map((bag, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-6 text-center">{index + 1}.</div>
                                        <span className="ml-2">{bag.name}</span>
                                    </div>
                                    <span className="font-medium">{bag.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default FormStatistics