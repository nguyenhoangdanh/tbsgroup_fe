'use client';

import { Card, CardContent } from '@/components/ui/card';

interface FactoryProductionSummaryProps {
  report: {
    factoryId: string;
    factoryName: string;
    factoryCode: string;
    dateRange: {
      from: string;
      to: string;
    };
    totalForms: number;
    totalEntries: number;
    totalOutput: number;
    averageQuality: number;
  };
}

export function FactoryProductionSummary({ report }: FactoryProductionSummaryProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">{report.factoryName}</h3>
          <p className="text-sm text-muted-foreground">
            {report.dateRange.from} - {report.dateRange.to}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold">{report.totalOutput.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Tổng sản lượng</div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold">{report.averageQuality}%</div>
            <div className="text-sm text-muted-foreground">Chất lượng trung bình</div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold">{report.totalForms}</div>
            <div className="text-sm text-muted-foreground">Số biểu mẫu</div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold">{report.totalEntries}</div>
            <div className="text-sm text-muted-foreground">Số dòng dữ liệu</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
