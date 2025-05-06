// components/digital-form/ReportsPanel.tsx
'use client';

import {useState, useEffect, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Calendar as CalendarIcon, Download, BarChart2, ArrowRight, Loader2} from 'lucide-react';
import {format} from 'date-fns';
import {vi} from 'date-fns/locale';
import {FactoryReport} from './reports/FactoryReport';
import {LineReport} from './reports/LineReport';
import {TeamReport} from './reports/TeamReport';
import {GroupReport} from './reports/GroupReport';
import {ComparisonReport} from './reports/ComparisonReport';
import { ReportService } from '@/services/reportService';
import { useToast } from '@/hooks/use-toast';

interface ReportDateRangeProps {
  dateFrom: Date;
  dateTo: Date;
  onDateFromChange: (date: Date) => void;
  onDateToChange: (date: Date) => void;
}

const ReportDateRange = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: ReportDateRangeProps) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="grid gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-[130px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Từ ngày'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={date => date && onDateFromChange(date)}
              initialFocus
              locale={vi}
            />
          </PopoverContent>
        </Popover>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
      <div className="grid gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-[130px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Đến ngày'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={date => date && onDateToChange(date)}
              initialFocus
              locale={vi}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export function ReportsPanel() {
  // Date range state
  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [activeReport, setActiveReport] = useState<string>('factory');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { toast } = useToast();

  // Other state variables...
  const [factoryId, setFactoryId] = useState<string>('');
  const [lineId, setLineId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [compareBy, setCompareBy] = useState<'team' | 'group'>('team');

  // Options for different reports
  const [includeLines, setIncludeLines] = useState<boolean>(true);
  const [includeTeams, setIncludeTeams] = useState<boolean>(true);
  const [includeGroups, setIncludeGroups] = useState<boolean>(true);
  const [includeWorkers, setIncludeWorkers] = useState<boolean>(true);
  const [detailedAttendance, setDetailedAttendance] = useState<boolean>(false);
  const [groupByBag, setGroupByBag] = useState<boolean>(true);
  const [groupByProcess, setGroupByProcess] = useState<boolean>(true);
  const [includeHandBags, setIncludeHandBags] = useState<boolean>(true);
  const [includeProcesses, setIncludeProcesses] = useState<boolean>(true);
  const [includeTimeSeries, setIncludeTimeSeries] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  // Export function
  const handleExport = useCallback(
    async (format: 'pdf' | 'excel' | 'csv') => {
      if (exporting) return; // Prevent multiple export requests

      try {
        setExporting(true);

        // Get parameters based on active report type
        let reportType: 'team' | 'group' | 'comparison';
        let parameters: any = {};

        // Format the date strings
        const dateFromStr = dateFrom.toISOString().split('T')[0];
        const dateToStr = dateTo.toISOString().split('T')[0];

        // Set common parameters
        parameters.dateFrom = dateFromStr;
        parameters.dateTo = dateToStr;

        if (activeReport === 'factory') {
          reportType = 'comparison'; // Use comparison for factory since API doesn't have factory export
          parameters = {
            ...parameters,
            lineId: '', // Will export all lines in factory
            factoryId: factoryId,
            compareBy: 'team',
            entityIds: [], // Empty means all teams
          };
        } else if (activeReport === 'line') {
          reportType = 'comparison';
          parameters = {
            ...parameters,
            lineId: lineId,
            compareBy: 'team',
            entityIds: [], // Empty means all teams in this line
          };
        } else if (activeReport === 'team') {
          reportType = 'team';
          parameters = {
            ...parameters,
            teamId: teamId,
            includeGroups,
            includeWorkers,
            groupByBag,
            groupByProcess,
          };
        } else if (activeReport === 'group') {
          reportType = 'group';
          parameters = {
            ...parameters,
            groupId: groupId,
            includeWorkers,
            detailedAttendance,
            groupByBag,
            groupByProcess,
          };
        } else { // comparison
          reportType = 'comparison';
          parameters = {
            ...parameters,
            lineId: lineId,
            entityIds: entityIds,
            compareBy: compareBy,
            includeHandBags,
            includeProcesses,
            includeTimeSeries,
          };
        }

        // Call the export service
        const response = await ReportService.exportReport(reportType, parameters, format);

        if (response.success && response.data?.fileUrl) {
          // Create a download link
          const a = document.createElement('a');
          a.href = response.data.fileUrl;
          a.download = `Báo_cáo_${activeReport}_${format}_${new Date().toISOString().slice(0, 10)}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          toast({
            title: "Xuất báo cáo thành công",
            description: `Báo cáo ${activeReport} đã được xuất dưới dạng ${format.toUpperCase()}`,
          });
        } else {
          throw new Error(response.error || 'Export failed');
        }
      } catch (error) {
        console.error(`Error exporting ${activeReport} report:`, error);
        toast({
          variant: "destructive",
          title: "Xuất báo cáo thất bại",
          description: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setExporting(false);
      }
    },
    [
      activeReport, exporting, dateFrom, dateTo, factoryId, lineId, teamId, groupId,
      entityIds, compareBy, includeLines, includeTeams, includeGroups, includeWorkers,
      detailedAttendance, groupByBag, groupByProcess, includeHandBags, includeProcesses,
      includeTimeSeries, toast
    ],
  );

  // Rest of the component remains the same...

  if (!isExpanded) {
    return (
      <Card className="mb-6">
        <CardHeader className="p-4">
          <Button
            variant="ghost"
            className="flex items-center justify-between w-full"
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              <span>Xem báo cáo sản xuất</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <BarChart2 className="h-5 w-5 mr-2" />
            Báo cáo sản xuất
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(false)}
              disabled={exporting}
            >
              Thu gọn
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="factory" onValueChange={setActiveReport}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="factory">Nhà máy</TabsTrigger>
              <TabsTrigger value="line">Chuyền</TabsTrigger>
              <TabsTrigger value="team">Tổ</TabsTrigger>
              <TabsTrigger value="group">Nhóm</TabsTrigger>
              <TabsTrigger value="comparison">So sánh</TabsTrigger>
            </TabsList>
            <ReportDateRange
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
          </div>

          <TabsContent value="factory">
            <FactoryReport
              factoryId={factoryId}
              dateFrom={dateFrom}
              dateTo={dateTo}
              includeLines={includeLines}
              includeTeams={includeTeams}
              includeGroups={includeGroups}
              groupByBag={groupByBag}
              groupByProcess={groupByProcess}
              onFactoryChange={setFactoryId}
              onIncludeLinesChange={setIncludeLines}
              onIncludeTeamsChange={setIncludeTeams}
              onIncludeGroupsChange={setIncludeGroups}
              onGroupByBagChange={setGroupByBag}
              onGroupByProcessChange={setGroupByProcess}
            />
          </TabsContent>

          <TabsContent value="line">
            <LineReport
              lineId={lineId}
              dateFrom={dateFrom}
              dateTo={dateTo}
              includeTeams={includeTeams}
              includeGroups={includeGroups}
              groupByBag={groupByBag}
              groupByProcess={groupByProcess}
              onLineChange={setLineId}
              onIncludeTeamsChange={setIncludeTeams}
              onIncludeGroupsChange={setIncludeGroups}
              onGroupByBagChange={setGroupByBag}
              onGroupByProcessChange={setGroupByProcess}
            />
          </TabsContent>

          <TabsContent value="team">
            <TeamReport
              teamId={teamId}
              dateFrom={dateFrom}
              dateTo={dateTo}
              includeGroups={includeGroups}
              includeWorkers={includeWorkers}
              groupByBag={groupByBag}
              groupByProcess={groupByProcess}
              onTeamChange={setTeamId}
              onIncludeGroupsChange={setIncludeGroups}
              onIncludeWorkersChange={setIncludeWorkers}
              onGroupByBagChange={setGroupByBag}
              onGroupByProcessChange={setGroupByProcess}
            />
          </TabsContent>

          <TabsContent value="group">
            <GroupReport
              groupId={groupId}
              dateFrom={dateFrom}
              dateTo={dateTo}
              includeWorkers={includeWorkers}
              detailedAttendance={detailedAttendance}
              groupByBag={groupByBag}
              groupByProcess={groupByProcess}
              onGroupChange={setGroupId}
              onIncludeWorkersChange={setIncludeWorkers}
              onDetailedAttendanceChange={setDetailedAttendance}
              onGroupByBagChange={setGroupByBag}
              onGroupByProcessChange={setGroupByProcess}
            />
          </TabsContent>

          <TabsContent value="comparison">
            <ComparisonReport
              lineId={lineId}
              entityIds={entityIds}
              compareBy={compareBy}
              dateFrom={dateFrom}
              dateTo={dateTo}
              includeHandBags={includeHandBags}
              includeProcesses={includeProcesses}
              includeTimeSeries={includeTimeSeries}
              onLineChange={setLineId}
              onEntityIdsChange={setEntityIds}
              onCompareByChange={setCompareBy}
              onIncludeHandBagsChange={setIncludeHandBags}
              onIncludeProcessesChange={setIncludeProcesses}
              onIncludeTimeSeriesChange={setIncludeTimeSeries}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
