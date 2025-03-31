"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useBagGroupRateContext } from "@/hooks/group/bag-group-rate/BagGroupRateContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";

interface ProductivityAnalysisProps {
    handBagId: string;
}

interface GroupData {
    groupName: string;
    outputRate: number;
    groupId: string;
    notes?: string;
}

interface AnalysisData {
    handBag: {
        id: string;
        code: string;
        name: string;
        description?: string;
    };
    groups: GroupData[];
    averageOutputRate: number;
    highestOutputRate: number;
    lowestOutputRate: number;
}

// Wrapper component with Context Bridge
const ProductivityAnalysis: React.FC<ProductivityAnalysisProps> = (props) => {
    return (
        <BagGroupRateContextBridge>
            <ProductivityAnalysisContent {...props} />
        </BagGroupRateContextBridge>
    );
};

// Content component that uses the context
const ProductivityAnalysisContent: React.FC<ProductivityAnalysisProps> = ({ handBagId }) => {
    const { getProductivityAnalysis } = useBagGroupRateContext();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

    // Generate colors based on output rate values
    const colors = useMemo(() => {
        if (!analysisData) return [];

        // Calculate color based on performance compared to average
        return analysisData.groups.map(group => {
            const ratio = group.outputRate / analysisData.averageOutputRate;

            // Green for above average, blue for average, red for below average
            if (ratio >= 1.1) {
                return "#10b981"; // Green
            } else if (ratio >= 0.9) {
                return "#3b82f6"; // Blue
            } else {
                return "#ef4444"; // Red
            }
        });
    }, [analysisData]);

    // Fetch analysis data when handBagId changes
    useEffect(() => {
        const fetchAnalysisData = async () => {
            if (!handBagId) return;

            try {
                setLoading(true);
                setError(null);

                const result = await getProductivityAnalysis(handBagId);
                if (result) {
                    setAnalysisData(result);
                } else {
                    setError("Không thể tải dữ liệu phân tích");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu phân tích");
                console.error("Error fetching productivity analysis:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysisData();
    }, [handBagId, getProductivityAnalysis]);

    // Sort data by output rate for better visualization
    const sortedGroupData = useMemo(() => {
        if (!analysisData?.groups) return [];

        return [...analysisData.groups].sort((a, b) => b.outputRate - a.outputRate);
    }, [analysisData]);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Đang tải dữ liệu phân tích...</span>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    // No data state
    if (!analysisData) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Không có dữ liệu</AlertTitle>
                <AlertDescription>Không tìm thấy dữ liệu phân tích cho túi này</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>
                        Phân tích năng suất: {analysisData.handBag.code} - {analysisData.handBag.name}
                    </CardTitle>
                    <CardDescription>
                        {analysisData.handBag.description || "Phân tích năng suất sản xuất túi theo các nhóm khác nhau"}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Năng suất trung bình</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {analysisData.averageOutputRate.toFixed(1)}
                            <span className="text-sm font-normal ml-1">sản phẩm/giờ</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Năng suất cao nhất</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {analysisData.highestOutputRate.toFixed(1)}
                            <span className="text-sm font-normal ml-1">sản phẩm/giờ</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Năng suất thấp nhất</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">
                            {analysisData.lowestOutputRate.toFixed(1)}
                            <span className="text-sm font-normal ml-1">sản phẩm/giờ</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Năng suất theo nhóm</CardTitle>
                    <CardDescription>
                        So sánh năng suất giữa các nhóm sản xuất
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={sortedGroupData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 70,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="groupName"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    interval={0}
                                />
                                <YAxis
                                    label={{
                                        value: "Sản phẩm/giờ",
                                        angle: -90,
                                        position: "insideLeft",
                                        style: { textAnchor: "middle" }
                                    }}
                                />
                                <Tooltip
                                    formatter={(value: any) => [`${value} sản phẩm/giờ`, "Năng suất"]}
                                    labelFormatter={(label) => `Nhóm: ${label}`}
                                />
                                <Legend />
                                <Bar
                                    dataKey="outputRate"
                                    name="Năng suất"
                                    fill="#4f46e5"
                                    barSize={40}
                                >
                                    {sortedGroupData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Chi tiết năng suất theo nhóm</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Nhóm</th>
                                    <th className="text-center p-2">Năng suất (SP/giờ)</th>
                                    <th className="text-center p-2">% so với TB</th>
                                    <th className="text-left p-2">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedGroupData.map((group, index) => {
                                    const percentOfAvg = (group.outputRate / analysisData.averageOutputRate) * 100;

                                    return (
                                        <tr key={group.groupId} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{group.groupName}</td>
                                            <td className="text-center p-2 font-medium">
                                                {group.outputRate.toFixed(1)}
                                            </td>
                                            <td
                                                className={`text-center p-2 font-medium ${percentOfAvg >= 110
                                                    ? 'text-green-600'
                                                    : percentOfAvg < 90
                                                        ? 'text-red-500'
                                                        : 'text-blue-500'
                                                    }`}
                                            >
                                                {percentOfAvg.toFixed(0)}%
                                            </td>
                                            <td className="p-2 text-gray-600">{group.notes || "-"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProductivityAnalysis;