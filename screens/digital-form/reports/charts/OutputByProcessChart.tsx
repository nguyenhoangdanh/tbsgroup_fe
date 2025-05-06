// components/digital-form/reports/charts/OutputByProcessChart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface OutputByProcessChartProps {
    data: Array<{
        processId: string;
        processCode: string;
        processName: string;
        totalOutput: number;
    }>;
}

export function OutputByProcessChart({ data }: OutputByProcessChartProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Sản lượng theo công đoạn</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height: 400 }}>
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                layout="vertical"
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <XAxis type="number" />
                                <YAxis
                                    dataKey="processName"
                                    type="category"
                                    width={150}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip formatter={(value) => [`${value} sản phẩm`, 'Sản lượng']} />
                                <Bar dataKey="totalOutput" fill="#8884d8" name="Sản lượng" />
                            </BarChart>
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