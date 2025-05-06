// components/digital-form/reports/breakdowns/TeamGroupBreakdown.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface TeamGroupBreakdownProps {
    data: Array<{
        groupId: string;
        groupName: string;
        groupCode: string;
        totalOutput: number;
        averageQuality: number;
        workerCount: number;
        efficiency: number;
    }>;
}

export function TeamGroupBreakdown({ data }: TeamGroupBreakdownProps) {
    // Calculate total output for percentage calculations
    const totalOutput = data.reduce((sum, item) => sum + item.totalOutput, 0);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Chi tiết theo nhóm</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã</TableHead>
                            <TableHead>Tên nhóm</TableHead>
                            <TableHead className="text-right">Sản lượng</TableHead>
                            <TableHead className="text-right">Tỷ lệ</TableHead>
                            <TableHead className="text-right">Chất lượng</TableHead>
                            <TableHead className="text-right">Hiệu suất</TableHead>
                            <TableHead className="text-right">Số CN</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(group => {
                            const percentage = totalOutput > 0
                                ? Math.round((group.totalOutput / totalOutput) * 100)
                                : 0;

                            return (
                                <TableRow key={group.groupId}>
                                    <TableCell className="font-medium">{group.groupCode}</TableCell>
                                    <TableCell>{group.groupName}</TableCell>
                                    <TableCell className="text-right">{group.totalOutput.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={percentage} className="h-2" />
                                            <span className="text-xs">{percentage}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{group.averageQuality}%</TableCell>
                                    <TableCell className="text-right">{group.efficiency}%</TableCell>
                                    <TableCell className="text-right">{group.workerCount}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}