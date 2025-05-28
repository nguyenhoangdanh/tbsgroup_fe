'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FactoryLineBreakdownProps {
  data: Array<{
    lineId: string;
    lineName: string;
    lineCode: string;
    totalOutput: number;
    averageQuality: number;
    teamCount: number;
    workerCount: number;
    efficiency: number;
  }>;
}

export function FactoryLineBreakdown({ data }: FactoryLineBreakdownProps) {
  // Calculate total output for percentage calculations
  const totalOutput = data.reduce((sum, item) => sum + item.totalOutput, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Chi tiết theo chuyền</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên chuyền</TableHead>
              <TableHead className="text-right">Sản lượng</TableHead>
              <TableHead className="text-right">Tỷ lệ</TableHead>
              <TableHead className="text-right">Chất lượng</TableHead>
              <TableHead className="text-right">Hiệu suất</TableHead>
              <TableHead className="text-right">Số tổ</TableHead>
              <TableHead className="text-right">Số CN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(line => {
              const percentage =
                totalOutput > 0 ? Math.round((line.totalOutput / totalOutput) * 100) : 0;

              return (
                <TableRow key={line.lineId}>
                  <TableCell className="font-medium">{line.lineCode}</TableCell>
                  <TableCell>{line.lineName}</TableCell>
                  <TableCell className="text-right">{line.totalOutput.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="h-2" />
                      <span className="text-xs">{percentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{line.averageQuality}%</TableCell>
                  <TableCell className="text-right">{line.efficiency}%</TableCell>
                  <TableCell className="text-right">{line.teamCount}</TableCell>
                  <TableCell className="text-right">{line.workerCount}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
