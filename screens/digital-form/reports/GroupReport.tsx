'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ReportService } from '@/services/reportService';

import { GroupWorkerBreakdown } from './breakdowns/GroupWorkerBreakdown';
import { DailyOutputChart } from './charts/DailyOutputChart';
import { HourlyOutputChart } from './charts/HourlyOutputChart';
import { OutputByBagChart } from './charts/OutputByBagChart';
import { OutputByProcessChart } from './charts/OutputByProcessChart';
import { ProductionIssuesChart } from './charts/ProductionIssuesChart';
import { AttendanceStats } from './stats/AttendanceStats';
import { GroupProductionSummary } from './summaries/GroupProductionSummary';


interface GroupReportProps {
  groupId: string;
  dateFrom: Date;
  dateTo: Date;
  includeWorkers: boolean;
  detailedAttendance: boolean;
  groupByBag: boolean;
  groupByProcess: boolean;
  onGroupChange: (groupId: string) => void;
  onIncludeWorkersChange: (value: boolean) => void;
  onDetailedAttendanceChange: (value: boolean) => void;
  onGroupByBagChange: (value: boolean) => void;
  onGroupByProcessChange: (value: boolean) => void;
}

export function GroupReport({
  groupId,
  dateFrom,
  dateTo,
  includeWorkers,
  detailedAttendance,
  groupByBag,
  groupByProcess,
  onGroupChange,
  onIncludeWorkersChange,
  onDetailedAttendanceChange,
  onGroupByBagChange,
  onGroupByProcessChange,
}: GroupReportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [report, setReport] = useState<any>(null);

  // Fetch groups list on component mount
  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await ReportService.getGroups();

        if (response.success) {
          setGroups(
            response.data.map(group => ({
              id: group.id,
              name: group.name,
            })),
          );
        } else {
          setError('Không thể tải danh sách nhóm');
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Lỗi kết nối đến máy chủ');
      }
    }

    fetchGroups();
  }, []);

  // Fetch report data when parameters change
  useEffect(() => {
    if (!groupId) return;

    async function fetchReport() {
      setLoading(true);
      setError(null);

      try {
        const dateFromStr = dateFrom.toISOString().split('T')[0];
        const dateToStr = dateTo.toISOString().split('T')[0];

        const response = await ReportService.getGroupReport(groupId, dateFromStr, dateToStr, {
          includeWorkers,
          detailedAttendance,
          groupByBag,
          groupByProcess,
        });

        if (response.success) {
          setReport(response.data);
        } else {
          setError(response.error || 'Không thể tải báo cáo');
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Lỗi kết nối đến máy chủ');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [groupId, dateFrom, dateTo, includeWorkers, detailedAttendance, groupByBag, groupByProcess]);

  console.log('report', report);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="w-64">
          <Label htmlFor="group-select">Chọn nhóm</Label>
          <Select value={groupId} onValueChange={onGroupChange}>
            <SelectTrigger id="group-select">
              <SelectValue placeholder="Chọn nhóm" />
            </SelectTrigger>
            <SelectContent>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
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
                id="include-workers"
                checked={includeWorkers}
                onCheckedChange={onIncludeWorkersChange}
              />
              <label htmlFor="include-workers" className="text-sm">
                Hiển thị công nhân
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="detailed-attendance"
                checked={detailedAttendance}
                onCheckedChange={onDetailedAttendanceChange}
              />
              <label htmlFor="detailed-attendance" className="text-sm">
                Chi tiết điểm danh
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
          Chọn nhóm và khoảng thời gian để xem báo cáo
        </div>
      ) : (
        <div className="space-y-6">
          <GroupProductionSummary report={report} />

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

          {report.workerBreakdown && report.workerBreakdown.length > 0 && (
            <GroupWorkerBreakdown data={report.workerBreakdown} />
          )}
        </div>
      )}
    </div>
  );
}
