// components/digital-form/reports/FactoryReport.tsx
'use client';

import {useEffect, useState} from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Checkbox} from '@/components/ui/checkbox';
import {Label} from '@/components/ui/label';
import {Loader2} from 'lucide-react';
import {Separator} from '@/components/ui/separator';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {FactoryProductionSummary} from './summaries/FactoryProductionSummary';
import {FactoryLineBreakdown} from './breakdowns/FactoryLineBreakdown';
import {OutputByBagChart} from './charts/OutputByBagChart';
import {OutputByProcessChart} from './charts/OutputByProcessChart';
import {HourlyOutputChart} from './charts/HourlyOutputChart';
import {DailyOutputChart} from './charts/DailyOutputChart';
import {AttendanceStats} from './stats/AttendanceStats';
import {ProductionIssuesChart} from './charts/ProductionIssuesChart';
import {ReportService} from '@/services/reportService';
import {PerformanceOutputChart} from './charts/PerformanceOutputChart';

interface FactoryReportProps {
  factoryId: string;
  dateFrom: Date;
  dateTo: Date;
  includeLines: boolean;
  includeTeams: boolean;
  includeGroups: boolean;
  groupByBag: boolean;
  groupByProcess: boolean;
  onFactoryChange: (factoryId: string) => void;
  onIncludeLinesChange: (value: boolean) => void;
  onIncludeTeamsChange: (value: boolean) => void;
  onIncludeGroupsChange: (value: boolean) => void;
  onGroupByBagChange: (value: boolean) => void;
  onGroupByProcessChange: (value: boolean) => void;
}

export function FactoryReport({
  factoryId,
  dateFrom,
  dateTo,
  includeLines,
  includeTeams,
  includeGroups,
  groupByBag,
  groupByProcess,
  onFactoryChange,
  onIncludeLinesChange,
  onIncludeTeamsChange,
  onIncludeGroupsChange,
  onGroupByBagChange,
  onGroupByProcessChange,
}: FactoryReportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factories, setFactories] = useState<{id: string; name: string}[]>([]);
  const [report, setReport] = useState<any>(null);

  // Fetch factories list on component mount
  useEffect(() => {
    async function fetchFactories() {
      try {
        const response = await ReportService.getFactories();

        if (response.success) {
          setFactories(
            response.data.map(factory => ({
              id: factory.id,
              name: factory.name,
            })),
          );
        } else {
          setError('Không thể tải danh sách nhà máy');
        }
      } catch (err) {
        setError('Lỗi kết nối đến máy chủ');
      }
    }

    fetchFactories();
  }, []);
  // Fetch report data when parameters change
  useEffect(() => {
    if (!factoryId) return;

    async function fetchReport() {
      setLoading(true);
      setError(null);

      try {
        const dateFromStr = dateFrom.toISOString().split('T')[0];
        const dateToStr = dateTo.toISOString().split('T')[0];

        const response = await ReportService.getFactoryReport(factoryId, dateFromStr, dateToStr, {
          includeLines,
          includeTeams,
          includeGroups,
          groupByBag,
          groupByProcess,
        });

        if (response.success) {
          setReport(response.data);
        } else {
          setError(response.error || 'Không thể tải báo cáo');
        }
      } catch (err) {
        setError('Lỗi kết nối đến máy chủ');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [
    factoryId,
    dateFrom,
    dateTo,
    includeLines,
    includeTeams,
    includeGroups,
    groupByBag,
    groupByProcess,
  ]);

  const hourlyData = [
    {hour: '07:30-8:30', totalOutput: 85, plannedOutput: 100},
    {hour: '08:30-9:30', totalOutput: 92, plannedOutput: 100},
    {hour: '09:30:10:30', totalOutput: 98, plannedOutput: 100},
    {hour: '10:30:11:30', totalOutput: 105, plannedOutput: 100},
    {hour: '12:30:13:30', totalOutput: 88, plannedOutput: 100},
    {hour: '13:30:14:30', totalOutput: 78, plannedOutput: 100},
    {hour: '14:30:15:30', totalOutput: 102, plannedOutput: 100},
    {hour: '15:30:16:30', totalOutput: 95, plannedOutput: 100},
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="w-64">
          <Label htmlFor="factory-select">Chọn nhà máy</Label>
          <Select value={factoryId} onValueChange={onFactoryChange}>
            <SelectTrigger id="factory-select">
              <SelectValue placeholder="Chọn nhà máy" />
            </SelectTrigger>
            <SelectContent>
              {factories.map(factory => (
                <SelectItem key={factory.id} value={factory.id}>
                  {factory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tùy chọn báo cáo</Label>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-lines"
                checked={includeLines}
                onCheckedChange={onIncludeLinesChange}
              />
              <label htmlFor="include-lines" className="text-sm">
                Hiển thị chuyền
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-teams"
                checked={includeTeams}
                onCheckedChange={onIncludeTeamsChange}
              />
              <label htmlFor="include-teams" className="text-sm">
                Hiển thị tổ
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-groups"
                checked={includeGroups}
                onCheckedChange={onIncludeGroupsChange}
              />
              <label htmlFor="include-groups" className="text-sm">
                Hiển thị nhóm
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="group-by-bag"
                checked={groupByBag}
                onCheckedChange={onGroupByBagChange}
              />
              <label htmlFor="group-by-bag" className="text-sm">
                Phân loại theo túi
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="group-by-process"
                checked={groupByProcess}
                onCheckedChange={onGroupByProcessChange}
              />
              <label htmlFor="group-by-process" className="text-sm">
                Phân loại theo công đoạn
              </label>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Đang tải báo cáo...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !report ? (
        <div className="text-center py-8 text-muted-foreground">
          Chọn nhà máy và khoảng thời gian để xem báo cáo
        </div>
      ) : (
        <div className="space-y-6">
          <FactoryProductionSummary report={report} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.hourlyBreakdown && <PerformanceOutputChart data={hourlyData} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.hourlyBreakdown && <HourlyOutputChart data={report.hourlyBreakdown} />}

            {report.dailyBreakdown && <DailyOutputChart data={report.dailyBreakdown} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.outputByBag && report.outputByBag.length > 0 && (
              <OutputByBagChart data={report.outputByBag} />
            )}

            {report.outputByProcess && report.outputByProcess.length > 0 && (
              <OutputByProcessChart data={report.outputByProcess} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.attendanceStats && <AttendanceStats data={report.attendanceStats} />}

            {report.productionIssues && report.productionIssues.length > 0 && (
              <ProductionIssuesChart data={report.productionIssues} />
            )}
          </div>

          {report.lineBreakdown && report.lineBreakdown.length > 0 && (
            <FactoryLineBreakdown data={report.lineBreakdown} />
          )}
        </div>
      )}
    </div>
  );
}
