// components/digital-form/DigitalFormReportsHeader.tsx
'use client';

import {useState, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Calendar as CalendarIcon, Download, BarChart2, ArrowRight} from 'lucide-react';
import {format} from 'date-fns';
import {vi} from 'date-fns/locale';
import {FactoryReport} from './reports/FactoryReport';
import {LineReport} from './reports/LineReport';
import {TeamReport} from './reports/TeamReport';
import {GroupReport} from './reports/GroupReport';
import {ComparisonReport} from './reports/ComparisonReport';

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

export function DigitalFormReportsHeader() {
  // Date range state
  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateFrom] = useState<Date>(new Date());
  const [activeReport, setActiveReport] = useState<string>('factory');

  // Filters state for different report types
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

  // Export function
  const handleExport = useCallback(
    (format: 'pdf' | 'excel' | 'csv') => {
      // Implementation of export functionality
      console.log(`Exporting ${activeReport} report in ${format} format`);
    },
    [activeReport],
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <BarChart2 className="h-5 w-5 mr-2" />
            Báo cáo sản xuất
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-1" />
              CSV
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
              onDateToChange={setDateFrom}
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
