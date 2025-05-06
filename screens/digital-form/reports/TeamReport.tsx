// components/digital-form/reports/TeamReport.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TeamProductionSummary } from './summaries/TeamProductionSummary';
import { TeamGroupBreakdown } from './breakdowns/TeamGroupBreakdown';
import { OutputByBagChart } from './charts/OutputByBagChart';
import { OutputByProcessChart } from './charts/OutputByProcessChart';
import { HourlyOutputChart } from './charts/HourlyOutputChart';
import { DailyOutputChart } from './charts/DailyOutputChart';
import { AttendanceStats } from './stats/AttendanceStats';
import { ProductionIssuesChart } from './charts/ProductionIssuesChart';
import { ReportService } from '@/services/reportService';

interface TeamReportProps {
  teamId: string;
  dateFrom: Date;
  dateTo: Date;
  includeGroups: boolean;
  includeWorkers: boolean;
  groupByBag: boolean;
  groupByProcess: boolean;
  onTeamChange: (teamId: string) => void;
  onIncludeGroupsChange: (value: boolean) => void;
  onIncludeWorkersChange: (value: boolean) => void;
  onGroupByBagChange: (value: boolean) => void;
  onGroupByProcessChange: (value: boolean) => void;
}

export function TeamReport({
  teamId,
  dateFrom,
  dateTo,
  includeGroups,
  includeWorkers,
  groupByBag,
  groupByProcess,
  onTeamChange,
  onIncludeGroupsChange,
  onIncludeWorkersChange,
  onGroupByBagChange,
  onGroupByProcessChange,
}: TeamReportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [report, setReport] = useState<any>(null);

  // Fetch teams list on component mount
  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await ReportService.getTeams();

        if (response.success) {
          setTeams(response.data.map(team => ({
            id: team.id,
            name: team.name
          })));
        } else {
          setError('Không thể tải danh sách tổ');
        }
      } catch (err) {
        setError('Lỗi kết nối đến máy chủ');
      }
    }

    fetchTeams();
  }, []);

  // Fetch report data when parameters change
  useEffect(() => {
    if (!teamId) return;

    async function fetchReport() {
      setLoading(true);
      setError(null);

      try {
        const dateFromStr = dateFrom.toISOString().split('T')[0];
        const dateToStr = dateTo.toISOString().split('T')[0];

        const response = await ReportService.getTeamReport(
          teamId,
          dateFromStr,
          dateToStr,
          {
            includeGroups,
            includeWorkers,
            groupByBag,
            groupByProcess
          }
        );

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
  }, [teamId, dateFrom, dateTo, includeGroups, includeWorkers, groupByBag, groupByProcess]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="w-64">
          <Label htmlFor="team-select">Chọn tổ</Label>
          <Select value={teamId} onValueChange={onTeamChange}>
            <SelectTrigger id="team-select">
              <SelectValue placeholder="Chọn tổ" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
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
          Chọn tổ và khoảng thời gian để xem báo cáo
        </div>
      ) : (
        <div className="space-y-6">
          <TeamProductionSummary report={report} />

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

          {report.groupBreakdown && report.groupBreakdown.length > 0 && (
            <TeamGroupBreakdown data={report.groupBreakdown} />
          )}
        </div>
      )}
    </div>
  );
}