'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';


import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ReportService } from '@/services/reportService';

import { ComparisonByBagChart } from './charts/ComparisonByBagChart';
import { ComparisonByProcessChart } from './charts/ComparisonByProcessChart';
import { ComparisonTimeSeriesChart } from './charts/ComparisonTimeSeriesChart';
import { ComparisonProductionSummary } from './summaries/ComparisonProductionSummary';

interface ComparisonReportProps {
  lineId: string;
  entityIds: string[];
  compareBy: 'team' | 'group';
  dateFrom: Date;
  dateTo: Date;
  includeHandBags: boolean;
  includeProcesses: boolean;
  includeTimeSeries: boolean;
  onLineChange: (lineId: string) => void;
  onEntityIdsChange: (entityIds: string[]) => void;
  onCompareByChange: (compareBy: 'team' | 'group') => void;
  onIncludeHandBagsChange: (value: boolean) => void;
  onIncludeProcessesChange: (value: boolean) => void;
  onIncludeTimeSeriesChange: (value: boolean) => void;
}

export function ComparisonReport({
  lineId,
  entityIds,
  compareBy,
  dateFrom,
  dateTo,
  includeHandBags,
  includeProcesses,
  includeTimeSeries,
  onLineChange,
  onEntityIdsChange,
  onCompareByChange,
  onIncludeHandBagsChange,
  onIncludeProcessesChange,
  onIncludeTimeSeriesChange,
}: ComparisonReportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<{ id: string; name: string }[]>([]);
  const [entities, setEntities] = useState<{ id: string; name: string }[]>([]);
  const [report, setReport] = useState<any>(null);

  // Fetch lines list on component mount
  useEffect(() => {
    async function fetchLines() {
      try {
        const response = await ReportService.getLines();

        if (response.success) {
          setLines(
            response.data.map(line => ({
              id: line.id,
              name: line.name,
            })),
          );
        } else {
          setError('Không thể tải danh sách chuyền');
        }
      } catch (err) {
        console.error(err);
        setError('Lỗi kết nối đến máy chủ');
      }
    }

    fetchLines();
  }, []);

  // Fetch entities (teams or groups) when lineId or compareBy changes
  useEffect(() => {
    if (!lineId) return;

    async function fetchEntities() {
      try {
        let response;

        if (compareBy === 'team') {
          response = await ReportService.getTeams(lineId);
        } else {
          // For groups, we might need to get all groups in this line
          response = await ReportService.getLineGroups(lineId);
        }

        if (response.success) {
          setEntities(
            response.data.map(entity => ({
              id: entity.id,
              name: entity.name,
            })),
          );
        } else {
          setError(`Không thể tải danh sách ${compareBy === 'team' ? 'tổ' : 'nhóm'}`);
        }
      } catch (err) {
        console.error(err);
        setError('Lỗi kết nối đến máy chủ');
      }
    }

    fetchEntities();
  }, [lineId, compareBy]);

  // Fetch report data when parameters change
  useEffect(() => {
    if (!lineId || !entityIds.length) return;

    async function fetchReport() {
      setLoading(true);
      setError(null);

      try {
        const dateFromStr = dateFrom.toISOString().split('T')[0];
        const dateToStr = dateTo.toISOString().split('T')[0];

        const response = await ReportService.getComparisonReport(
          lineId,
          entityIds,
          compareBy,
          dateFromStr,
          dateToStr,
          {
            includeHandBags,
            includeProcesses,
            includeTimeSeries,
          },
        );

        if (response.success) {
          setReport(response.data);
        } else {
          setError(response.error || 'Không thể tải báo cáo');
        }
      } catch (err) {
        console.error(err);
        setError('Lỗi kết nối đến máy chủ');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [
    lineId,
    entityIds,
    compareBy,
    dateFrom,
    dateTo,
    includeHandBags,
    includeProcesses,
    includeTimeSeries,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="space-y-4 w-full md:w-auto">
          <div className="w-full md:w-64">
            <Label htmlFor="line-select">Chọn chuyền</Label>
            <Select value={lineId} onValueChange={onLineChange}>
              <SelectTrigger id="line-select">
                <SelectValue placeholder="Chọn chuyền" />
              </SelectTrigger>
              <SelectContent>
                {lines.map(line => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-64">
            <Label htmlFor="compare-by-select">So sánh theo</Label>
            <Select
              value={compareBy}
              onValueChange={(value: 'team' | 'group') => onCompareByChange(value)}
            >
              <SelectTrigger id="compare-by-select">
                <SelectValue placeholder="Chọn loại so sánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Tổ</SelectItem>
                <SelectItem value="group">Nhóm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-64">
            <Label htmlFor="entities-select">
              Chọn {compareBy === 'team' ? 'tổ' : 'nhóm'} để so sánh
            </Label>
            <MultiSelect values={entityIds} onValuesChange={onEntityIdsChange}>
              <MultiSelectTrigger id="entities-select">
                <MultiSelectValue placeholder={`Chọn ${compareBy === 'team' ? 'tổ' : 'nhóm'}`} />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {entities.map(entity => (
                  <MultiSelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tùy chọn báo cáo</Label>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-hand-bags"
                checked={includeHandBags}
                onCheckedChange={onIncludeHandBagsChange}
              />
              <label htmlFor="include-hand-bags" className="text-sm">
                Hiển thị theo túi
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-processes"
                checked={includeProcesses}
                onCheckedChange={onIncludeProcessesChange}
              />
              <label htmlFor="include-processes" className="text-sm">
                Hiển thị theo công đoạn
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-time-series"
                checked={includeTimeSeries}
                onCheckedChange={onIncludeTimeSeriesChange}
              />
              <label htmlFor="include-time-series" className="text-sm">
                Hiển thị theo thời gian
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
          Chọn chuyền, loại so sánh và các {compareBy === 'team' ? 'tổ' : 'nhóm'} để xem báo cáo
        </div>
      ) : (
        <div className="space-y-6">
          <ComparisonProductionSummary report={report} />

          {report.comparisonByBag && report.comparisonByBag.length > 0 && (
            <ComparisonByBagChart data={report.comparisonByBag} />
          )}

          {report.comparisonByProcess && report.comparisonByProcess.length > 0 && (
            <ComparisonByProcessChart data={report.comparisonByProcess} />
          )}

          {report.timeSeriesData && report.timeSeriesData.length > 0 && (
            <ComparisonTimeSeriesChart data={report.timeSeriesData} />
          )}
        </div>
      )}
    </div>
  );
}
