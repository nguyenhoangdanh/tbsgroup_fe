'use client';

import { Badge } from '@/components/ui/badge';
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

interface GroupWorkerBreakdownProps {
  data: Array<{
    userId: string;
    employeeId: string;
    fullName: string;
    totalOutput: number;
    averageQuality: number;
    attendanceRate: number;
    efficiency: number;
  }>;
}

export function GroupWorkerBreakdown({ data }: GroupWorkerBreakdownProps) {
  // Calculate total output for percentage calculations
  const totalOutput = data.reduce((sum, item) => sum + item.totalOutput, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Chi tiết theo công nhân</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã NV</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead className="text-right">Sản lượng</TableHead>
              <TableHead className="text-right">Tỷ lệ</TableHead>
              <TableHead className="text-right">Chất lượng</TableHead>
              <TableHead className="text-right">Điểm danh</TableHead>
              <TableHead className="text-right">Hiệu suất</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(worker => {
              const percentage =
                totalOutput > 0 ? Math.round((worker.totalOutput / totalOutput) * 100) : 0;

              return (
                <TableRow key={worker.userId}>
                  <TableCell className="font-medium">{worker.employeeId}</TableCell>
                  <TableCell>{worker.fullName}</TableCell>
                  <TableCell className="text-right">
                    {worker.totalOutput.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="h-2" />
                      <span className="text-xs">{percentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{worker.averageQuality}%</TableCell>
                  <TableCell className="text-right">{worker.attendanceRate}%</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        worker.efficiency >= 100
                          ? 'success'
                          : worker.efficiency >= 80
                            ? 'default'
                            : 'destructive'
                      }
                    >
                      {worker.efficiency}%
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
