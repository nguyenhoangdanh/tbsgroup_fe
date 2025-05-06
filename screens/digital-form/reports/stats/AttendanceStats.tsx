// components/digital-form/reports/stats/AttendanceStats.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AttendanceStatsProps {
    data: {
        present: number;
        absent: number;
        late: number;
        earlyLeave: number;
        leaveApproved: number;
        percentPresent: number;
    };
}

export function AttendanceStats({ data }: AttendanceStatsProps) {
    // Transform data for pie chart
    const chartData = [
        { name: 'Có mặt', value: data.present, color: '#4ade80' },
        { name: 'Vắng mặt', value: data.absent, color: '#f87171' },
        { name: 'Đi muộn', value: data.late, color: '#facc15' },
        { name: 'Về sớm', value: data.earlyLeave, color: '#fb923c' },
        { name: 'Nghỉ phép', value: data.leaveApproved, color: '#60a5fa' },
    ].filter(item => item.value > 0);

    // Calculate total
    const total = data.present + data.absent + data.late + data.earlyLeave + data.leaveApproved;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Thống kê điểm danh</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="text-center mb-4 md:mb-0">
                        <div className="text-3xl font-bold">{data.percentPresent}%</div>
                        <div className="text-sm text-muted-foreground">Tỷ lệ điểm danh</div>
                    </div>

                    {/* <div className="h-64 w-full md:w-64"> */}
                    <div style={{ width: '100%', height: 400 }}>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [`${value} người`, null]} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                Không có dữ liệu
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-2 mt-2">
                    {chartData.map((item, index) => (
                        <div key={index} className="text-center">
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-sm">
                                {item.value} ({Math.round((item.value / total) * 100)}%)
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}