// components/digital-form/reports/charts/DailyOutputChart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface DailyOutputChartProps {
    data: Array<{
        date: string;
        totalOutput: number;
        averageQuality: number;
        attendanceRate: number;
    }>;
}

export function DailyOutputChart({ data }: DailyOutputChartProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Sản lượng theo ngày</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height: 400 }}>
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={data}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="totalOutput"
                                    name="Sản lượng"
                                    stroke="#8884d8"
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="attendanceRate"
                                    name="Tỷ lệ điểm danh (%)"
                                    stroke="#82ca9d"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="averageQuality"
                                    name="Chất lượng (%)"
                                    stroke="#ffc658"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Không có dữ liệu
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}