// components/EnhancedWorkerCard.tsx
'use client';

import {useState, memo, useMemo, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle, CardFooter} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {
  Edit,
  AlertCircle,
  UserCircle,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  LineChart,
  PlusCircle,
  ListFilter,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {TimeSlot, Worker} from '@/common/types/worker';
import {WorkerStatusBadge} from './worker-status-badge';
import {ShiftTypeBadge} from './shift-type-badge';
import {TIME_SLOTS} from '@/common/constants/time-slots';
import {UpdateProductionForm} from './update-production-form';
import {useForm} from '@/contexts/form-context';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';

interface EnhancedWorkerCardProps {
  worker: Worker;
  currentTimeSlot: string | null;
}

// Group hourly data by bag for better visualization
const groupHourlyDataByBag = (worker: Worker) => {
  // First, extract all unique bag combinations from hourly data
  const bagGroups: Record<
    string,
    {
      bagId: string;
      bagName: string;
      processId: string;
      processName: string;
      colorId: string;
      colorName: string;
      hourlyData: Record<string, number>;
      totalOutput: number;
    }
  > = {};

  // Default bag (the one stored at worker level)
  const defaultBagKey = `${worker.bagId}-${worker.processId}-${worker.colorId}`;
  bagGroups[defaultBagKey] = {
    bagId: worker.bagId,
    bagName: worker.bagName,
    processId: worker.processId,
    processName: worker.processName,
    colorId: worker.colorId,
    colorName: worker.colorName,
    hourlyData: {},
    totalOutput: 0,
  };

  // Process all hourly data entries
  Object.entries(worker.hourlyData || {}).forEach(([timeSlot, quantity]) => {
    // Get bag metadata from extra data if available for this time slot
    // This would be available if the worker switched bags during the day
    const bagMetadata = worker.hourlyBagData && worker.hourlyBagData[timeSlot];

    // Determine which bag key to use
    let bagKey = defaultBagKey;
    if (bagMetadata) {
      bagKey = `${bagMetadata.bagId}-${bagMetadata.processId}-${bagMetadata.colorId}`;

      // Create bag group if it doesn't exist
      if (!bagGroups[bagKey]) {
        bagGroups[bagKey] = {
          bagId: bagMetadata.bagId,
          bagName: bagMetadata.bagName,
          processId: bagMetadata.processId,
          processName: bagMetadata.processName,
          colorId: bagMetadata.colorId,
          colorName: bagMetadata.colorName,
          hourlyData: {},
          totalOutput: 0,
        };
      }
    }

    // Add hourly data to the bag group
    bagGroups[bagKey].hourlyData[timeSlot] = quantity;
    bagGroups[bagKey].totalOutput += quantity;
  });

  return Object.values(bagGroups).filter(group => group.totalOutput > 0);
};

function WorkerCardComponent({worker, currentTimeSlot}: EnhancedWorkerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'bags'>('timeline');
  const {updateHourlyData, updateAttendanceStatus, updateShiftType} = useForm();

  // Create bag groups for better organization
  const bagGroups = useMemo(() => groupHourlyDataByBag(worker), [worker]);
  const multipleBags = bagGroups.length > 1;

  // Determine time slot statuses more efficiently
  const getTimeSlotStatus = useCallback(
    (slot: TimeSlot) => {
      if (worker.hourlyData && worker.hourlyData[slot.label]) {
        return 'completed';
      }

      if (slot.label === currentTimeSlot) {
        return 'current';
      }

      // Check if this time slot is in the past but has no data
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      if (currentTime > slot.end && !worker.hourlyData[slot.label]) {
        return 'missing';
      }

      return 'pending';
    },
    [worker.hourlyData, currentTimeSlot],
  );

  // Calculate completion stats
  const timeSlotStats = useMemo(() => {
    // Count completed, current, and missing slots
    let completed = 0;
    let current = 0;
    let missing = 0;
    let pending = 0;

    TIME_SLOTS.forEach(slot => {
      const status = getTimeSlotStatus(slot);
      if (status === 'completed') completed++;
      else if (status === 'current') current++;
      else if (status === 'missing') missing++;
      else if (status === 'pending') pending++;
    });

    // Calculate required time slots based on shift type
    let totalRequired = 8; // Default for regular shift
    if (worker.shiftType === 'EXTENDED') totalRequired = 10;
    if (worker.shiftType === 'OVERTIME') totalRequired = 12;

    const completionPercentage =
      totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0;

    return {
      completed,
      current,
      missing,
      pending,
      totalRequired,
      completionPercentage,
    };
  }, [getTimeSlotStatus, worker.shiftType]);

  // Generate hourly data visualization
  const hourlyDataTimeline = useMemo(() => {
    // Get regular work hours based on shift type
    let workHours = TIME_SLOTS.slice(0, 8); // Regular shift
    if (worker.shiftType === 'EXTENDED') {
      workHours = TIME_SLOTS.slice(0, 10);
    } else if (worker.shiftType === 'OVERTIME') {
      workHours = TIME_SLOTS; // All time slots
    }

    return workHours.map(slot => {
      const output = worker.hourlyData?.[slot.label] || 0;
      const status = getTimeSlotStatus(slot);

      // Get bag data for this time slot if it exists
      const bagData = worker.hourlyBagData?.[slot.label];

      return {
        slot,
        output,
        status,
        bagData,
      };
    });
  }, [worker.hourlyData, worker.hourlyBagData, worker.shiftType, getTimeSlotStatus]);

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">{worker.user?.fullName}</CardTitle>
              <p className="text-sm text-muted-foreground">Mã: {worker.user?.employeeId}</p>
            </div>
          </div>
          <div className="flex flex-row gap-1">
            <ShiftTypeBadge type={worker.shiftType} />
            <WorkerStatusBadge status={worker.attendanceStatus} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Time slot progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-muted-foreground">Tiến độ nhập liệu</span>
            <span>{timeSlotStats.completionPercentage}%</span>
          </div>
          <Progress value={timeSlotStats.completionPercentage} className="h-1.5" />

          <div className="flex justify-between mt-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              <span>Hoàn thành: {timeSlotStats.completed}</span>
            </div>
            {timeSlotStats.current > 0 && (
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Hiện tại: {timeSlotStats.current}</span>
              </div>
            )}
            {timeSlotStats.missing > 0 && (
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                <span>Thiếu: {timeSlotStats.missing}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
              <span>Chưa đến: {timeSlotStats.pending}</span>
            </div>
          </div>
        </div>

        {/* Multi-bag notice - show only if worker has multiple bags */}
        {multipleBags && (
          <div className="bg-blue-50 rounded-md p-2 mb-3 text-xs flex items-center">
            <ListFilter className="h-3.5 w-3.5 text-blue-500 mr-1.5" />
            <span>Công nhân làm {bagGroups.length} loại túi khác nhau trong ngày</span>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-gray-50 rounded-md p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">Tổng sản lượng</p>
            <p className="text-xl font-semibold text-primary">{worker.totalOutput}</p>
          </div>

          <div className="bg-gray-50 rounded-md p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">Trung bình/giờ</p>
            <p className="text-xl font-semibold text-primary">
              {timeSlotStats.completed > 0
                ? Math.round(worker.totalOutput / timeSlotStats.completed)
                : 0}
            </p>
          </div>
        </div>

        {/* Detailed view tabs */}
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'timeline' | 'bags')}>
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="timeline" className="text-xs py-1">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Theo giờ
            </TabsTrigger>
            <TabsTrigger value="bags" className="text-xs py-1">
              <Package className="h-3.5 w-3.5 mr-1" />
              Theo túi
            </TabsTrigger>
          </TabsList>

          {/* Timeline tab content */}
          <TabsContent value="timeline" className="mt-0">
            <div className="rounded-md border overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[95px] py-1.5 text-xs">Khung giờ</TableHead>
                    <TableHead className="py-1.5 text-xs">Túi</TableHead>
                    <TableHead className="w-[70px] text-right py-1.5 text-xs">Sản lượng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hourlyDataTimeline.map(({slot, output, status, bagData}) => (
                    <TableRow key={slot.id} className={status === 'current' ? 'bg-blue-50' : ''}>
                      <TableCell className="py-1.5 text-xs">
                        <div className="flex items-center gap-1">
                          {status === 'completed' && (
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          )}
                          {status === 'current' && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                          )}
                          {status === 'missing' && (
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          )}
                          {status === 'pending' && (
                            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                          )}
                          {slot.label}
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 text-xs truncate max-w-[120px]">
                        {bagData ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>{bagData.bagName}</span>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <div className="text-xs">
                                  <p>Túi: {bagData.bagName}</p>
                                  <p>Công đoạn: {bagData.processName}</p>
                                  <p>Màu: {bagData.colorName}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span>{worker.bagName}</span>
                        )}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs font-medium text-right">
                        {output}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Bags tab content */}
          <TabsContent value="bags" className="mt-0">
            <div className="rounded-md border overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="py-1.5 text-xs">Túi</TableHead>
                    <TableHead className="w-[80px] text-right py-1.5 text-xs">Sản lượng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bagGroups.map((bag, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="py-1.5 text-xs">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate max-w-[150px]">
                                <span className="font-medium">{bag.bagName}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <div className="text-xs">
                                <p>Túi: {bag.bagName}</p>
                                <p>Công đoạn: {bag.processName}</p>
                                <p>Màu: {bag.colorName}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="py-1.5 text-xs font-medium text-right">
                        {bag.totalOutput}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Issues indicator */}
        {worker.issues && worker.issues.length > 0 && (
          <div className="mt-3 flex items-center gap-1 text-amber-600 text-xs py-1 px-2 bg-amber-50 rounded-md">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{worker.issues.length} vấn đề cần xử lý</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-3 flex justify-between bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-xs"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 mr-1" /> Thu gọn
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 mr-1" /> Chi tiết
            </>
          )}
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <Edit className="h-3.5 w-3.5 mr-1" /> Cập nhật
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cập nhật thông tin sản xuất - {worker.name}</DialogTitle>
            </DialogHeader>
            <UpdateProductionForm
              worker={worker}
              onUpdateHourlyData={updateHourlyData}
              onUpdateAttendanceStatus={updateAttendanceStatus}
              onUpdateShiftType={updateShiftType}
              currentTimeSlot={currentTimeSlot}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>

      {/* Expandable content for detailed view */}
      {expanded && (
        <div className="px-4 pb-4 bg-gray-50/70">
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted/50 p-2 text-xs font-medium flex items-center">
              <LineChart className="h-3.5 w-3.5 mr-1.5" />
              Chi tiết sản lượng theo giờ và từng loại túi
            </div>

            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs py-2">Túi</TableHead>
                  {TIME_SLOTS.slice(0, 8).map(slot => (
                    <TableHead key={slot.id} className="text-xs font-medium text-center py-2">
                      {slot.label.split('-')[0]}
                    </TableHead>
                  ))}
                  {/* Show extended/overtime slots only if applicable */}
                  {(worker.shiftType === 'EXTENDED' || worker.shiftType === 'OVERTIME') && (
                    <>
                      {TIME_SLOTS.slice(8, 10).map(slot => (
                        <TableHead
                          key={slot.id}
                          className="text-xs font-medium text-center py-2 bg-purple-50"
                        >
                          {slot.label.split('-')[0]}
                        </TableHead>
                      ))}
                    </>
                  )}
                  {worker.shiftType === 'OVERTIME' && (
                    <>
                      {TIME_SLOTS.slice(10, 12).map(slot => (
                        <TableHead
                          key={slot.id}
                          className="text-xs font-medium text-center py-2 bg-amber-50"
                        >
                          {slot.label.split('-')[0]}
                        </TableHead>
                      ))}
                    </>
                  )}
                  <TableHead className="text-xs text-right py-2">Tổng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bagGroups.map((bag, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs py-2">
                      <div className="truncate max-w-[100px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium">{bag.bagName}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <p>Túi: {bag.bagName}</p>
                                <p>Công đoạn: {bag.processName}</p>
                                <p>Màu: {bag.colorName}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>

                    {/* Regular shift slots */}
                    {TIME_SLOTS.slice(0, 8).map(slot => (
                      <TableCell key={slot.id} className="text-xs text-center py-2">
                        {bag.hourlyData[slot.label] || '-'}
                      </TableCell>
                    ))}

                    {/* Extended shift slots */}
                    {(worker.shiftType === 'EXTENDED' || worker.shiftType === 'OVERTIME') && (
                      <>
                        {TIME_SLOTS.slice(8, 10).map(slot => (
                          <TableCell
                            key={slot.id}
                            className="text-xs text-center py-2 bg-purple-50"
                          >
                            {bag.hourlyData[slot.label] || '-'}
                          </TableCell>
                        ))}
                      </>
                    )}

                    {/* Overtime shift slots */}
                    {worker.shiftType === 'OVERTIME' && (
                      <>
                        {TIME_SLOTS.slice(10, 12).map(slot => (
                          <TableCell key={slot.id} className="text-xs text-center py-2 bg-amber-50">
                            {bag.hourlyData[slot.label] || '-'}
                          </TableCell>
                        ))}
                      </>
                    )}

                    <TableCell className="text-xs font-medium text-right py-2">
                      {bag.totalOutput}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Total row */}
                <TableRow className="bg-muted/30">
                  <TableCell className="text-xs py-2 font-medium">Tổng theo giờ</TableCell>

                  {/* Calculate hourly totals across all bags */}
                  {TIME_SLOTS.slice(0, 8).map(slot => {
                    const hourlyTotal = bagGroups.reduce(
                      (total, bag) => total + (bag.hourlyData[slot.label] || 0),
                      0,
                    );
                    return (
                      <TableCell key={slot.id} className="text-xs text-center py-2 font-medium">
                        {hourlyTotal || '-'}
                      </TableCell>
                    );
                  })}

                  {/* Extended shift totals */}
                  {(worker.shiftType === 'EXTENDED' || worker.shiftType === 'OVERTIME') && (
                    <>
                      {TIME_SLOTS.slice(8, 10).map(slot => {
                        const hourlyTotal = bagGroups.reduce(
                          (total, bag) => total + (bag.hourlyData[slot.label] || 0),
                          0,
                        );
                        return (
                          <TableCell
                            key={slot.id}
                            className="text-xs text-center py-2 font-medium bg-purple-50"
                          >
                            {hourlyTotal || '-'}
                          </TableCell>
                        );
                      })}
                    </>
                  )}

                  {/* Overtime shift totals */}
                  {worker.shiftType === 'OVERTIME' && (
                    <>
                      {TIME_SLOTS.slice(10, 12).map(slot => {
                        const hourlyTotal = bagGroups.reduce(
                          (total, bag) => total + (bag.hourlyData[slot.label] || 0),
                          0,
                        );
                        return (
                          <TableCell
                            key={slot.id}
                            className="text-xs text-center py-2 font-medium bg-amber-50"
                          >
                            {hourlyTotal || '-'}
                          </TableCell>
                        );
                      })}
                    </>
                  )}

                  <TableCell className="text-xs font-medium text-right py-2">
                    {worker.totalOutput}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Add new product button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 text-xs"
            onClick={() => setDialogOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            Thêm sản phẩm mới
          </Button>
        </div>
      )}
    </Card>
  );
}

// Export memoized component to prevent unnecessary rerenders
export const WorkerCard = memo(WorkerCardComponent);
