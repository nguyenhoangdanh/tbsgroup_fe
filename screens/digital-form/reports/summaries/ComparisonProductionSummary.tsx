// components/digital-form/reports/summaries/ComparisonProductionSummary.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComparisonProductionSummaryProps {
    report: {
        factoryName: string;
        factoryCode: string;
        lineName: string;
        lineCode: string;
        dateRange: {
            from: string;
            to: string;
        };
        comparisonType: 'team' | 'group';
        comparisonData: Array<{
            id: string;
            name: string;
            code: string;
            totalOutput: number;
            outputPerWorker: number;
            qualityScore: number;
            attendanceRate: number;
            issueRate: number;
            rank: number;
        }>;
    };
}

export function ComparisonProductionSummary({ report }: ComparisonProductionSummaryProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold">
                        So sánh {report.comparisonType === 'team' ? 'tổ' : 'nhóm'} - {report.lineName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {report.factoryName} | {report.dateRange.from} - {report.dateRange.to}
                    </p>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Thứ hạng</TableHead>
                            <TableHead>Tên {report.comparisonType === 'team' ? 'tổ' : 'nhóm'}</TableHead>
                            <TableHead className="text-right">Sản lượng</TableHead>
                            <TableHead className="text-right">SL/công nhân</TableHead>
                            <TableHead className="text-right">Chất lượng</TableHead>
                            <TableHead className="text-right">Điểm danh</TableHead>
                            <TableHead className="text-right">Tỷ lệ vấn đề</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {report.comparisonData.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.rank}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right">{item.totalOutput.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{item.outputPerWorker.toFixed(1)}</TableCell>
                                <TableCell className="text-right">{item.qualityScore}%</TableCell>
                                <TableCell className="text-right">{item.attendanceRate}%</TableCell>
                                <TableCell className="text-right">{item.issueRate}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}