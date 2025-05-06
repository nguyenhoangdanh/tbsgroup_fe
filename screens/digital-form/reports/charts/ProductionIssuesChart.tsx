// components/digital-form/reports/charts/ProductionIssuesChart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProductionIssuesChartProps {
    data: Array<{
        issueType: string;
        occurrences: number;
        totalImpact: number;
    }>;
}

// Map issue types to Vietnamese
const issueTypeMap: Record<string, string> = {
    ABSENT: 'Vắng mặt',
    LATE: 'Đi muộn',
    WAITING_MATERIALS: 'Chờ vật liệu',
    QUALITY_ISSUES: 'Vấn đề chất lượng',
    LOST_MATERIALS: 'Mất vật liệu',
    OTHER: 'Khác',
};

export function ProductionIssuesChart({ data }: ProductionIssuesChartProps) {
    // Transform data for display
    const chartData = data.map(issue => ({
        name: issueTypeMap[issue.issueType] || issue.issueType,
        occurrences: issue.occurrences,
        impact: issue.totalImpact,
    }));

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Phân tích vấn đề sản xuất</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height: 400 }}>
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="occurrences" name="Số lần xảy ra" fill="#8884d8" />
                                <Bar yAxisId="right" dataKey="impact" name="Mức độ tác động" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Không có vấn đề sản xuất nào được ghi nhận
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}