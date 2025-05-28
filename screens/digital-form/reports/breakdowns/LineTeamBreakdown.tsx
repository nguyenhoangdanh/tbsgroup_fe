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

interface LineTeamBreakdownProps {
  data: Array<{
    teamId: string;
    teamName: string;
    teamCode: string;
    totalOutput: number;
    averageQuality: number;
    groupCount: number;
    workerCount: number;
    efficiency: number;
  }>;
}

export function LineTeamBreakdown({ data }: LineTeamBreakdownProps) {
  // Calculate total output for percentage calculations
  const totalOutput = data.reduce((sum, item) => sum + item.totalOutput, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Chi tiết theo tổ</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên tổ</TableHead>
              <TableHead className="text-right">Sản lượng</TableHead>
              <TableHead className="text-right">Tỷ lệ</TableHead>
              <TableHead className="text-right">Chất lượng</TableHead>
              <TableHead className="text-right">Hiệu suất</TableHead>
              <TableHead className="text-right">Số nhóm</TableHead>
              <TableHead className="text-right">Số CN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(team => {
              const percentage =
                totalOutput > 0 ? Math.round((team.totalOutput / totalOutput) * 100) : 0;

              return (
                <TableRow key={team.teamId}>
                  <TableCell className="font-medium">{team.teamCode}</TableCell>
                  <TableCell>{team.teamName}</TableCell>
                  <TableCell className="text-right">{team.totalOutput.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="h-2" />
                      <span className="text-xs">{percentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{team.averageQuality}%</TableCell>
                  <TableCell className="text-right">{team.efficiency}%</TableCell>
                  <TableCell className="text-right">{team.groupCount}</TableCell>
                  <TableCell className="text-right">{team.workerCount}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
