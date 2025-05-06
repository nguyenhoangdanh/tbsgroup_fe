// components/digital-form/reports/charts/HourlyOutputChart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface HourlyOutputChartProps {
    data: Array<{
        hour: string;
        totalOutput: number;
        averageOutput: number;
    }>;
}

export function HourlyOutputChart({ data }: HourlyOutputChartProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Sản lượng theo giờ</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Key fix 1: Use a fixed height instead of h-auto */}
                <div style={{ width: '100%', height: 400 }}>
                    {data && data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="totalOutput" name="Tổng sản lượng" fill="#8884d8" />
                                <Bar dataKey="averageOutput" name="Trung bình" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Không có dữ liệu
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}