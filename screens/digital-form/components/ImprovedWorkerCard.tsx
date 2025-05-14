// components/ImprovedWorkerCard.tsx
'use client';

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
  Briefcase,
  Palette,
} from 'lucide-react';
import { useState, memo, useMemo, useCallback } from 'react';

import { AddBagForm } from './add-bag-form';
import { HourlyDataComponent } from './HourlyDataComponent';
import { ShiftTypeBadge } from './shift-type-badge';
import { UpdateProductionForm } from './update-production-form';
import { WorkerStatusBadge } from './worker-status-badge';

import { TIME_SLOTS } from '@/common/constants/time-slots';
import { Worker } from '@/common/types/worker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useForm } from '@/contexts/form-context';

interface ImprovedWorkerCardProps {
  worker: Worker;
  currentTimeSlot: string | null;
  workerEntries?: Worker[]; // All entries for this worker
}

function ImprovedWorkerCardComponent({
  worker,
  currentTimeSlot,
  workerEntries = [],
}: ImprovedWorkerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addBagDialogOpen, setAddBagDialogOpen] = useState(false);
  const [outputDialogOpen, setOutputDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedBagName, setSelectedBagName] = useState('');
  const [currentOutputValue, setCurrentOutputValue] = useState(0);

  const { updateHourlyData, updateAttendanceStatus, updateShiftType, addBag } = useForm();

  // Determine visible time slots based on shift type
  const visibleTimeSlots = useMemo(() => {
    let slots = TIME_SLOTS.slice(0, 8); // Regular shift (8 hours)

    if (worker.shiftType === 'EXTENDED' || worker.shiftType === 'OVERTIME') {
      slots = TIME_SLOTS.slice(0, 10); // Extended shift (10 hours)
    }

    if (worker.shiftType === 'OVERTIME') {
      slots = TIME_SLOTS; // Overtime shift (all 12 hours)
    }

    return slots;
  }, [worker.shiftType]);

  // Group output data by bag for better visualization
  const outputByBag = useMemo(() => {
    // Create a map to track data for each bag
    const bagMap = new Map();

    // Process all worker entries
    const entriesToProcess = workerEntries.length > 0 ? workerEntries : [worker];

    entriesToProcess.forEach(entry => {
      const bagKey = `${entry.bagId}-${entry.processId}-${entry.colorId}`;

      if (!bagMap.has(bagKey)) {
        bagMap.set(bagKey, {
          entryId: entry.id,
          bagId: entry.bagId,
          bagName: entry.bagName,
          processId: entry.processId,
          processName: entry.processName,
          colorId: entry.colorId,
          colorName: entry.colorName,
          hourlyData: {},
          totalOutput: 0,
        });
      }

      // Add hourly data
      if (entry.hourlyData) {
        const bagData = bagMap.get(bagKey);

        Object.entries(entry.hourlyData).forEach(([timeSlot, output]) => {
          bagData.hourlyData[timeSlot] = (bagData.hourlyData[timeSlot] || 0) + output;
          bagData.totalOutput += output;
        });
      }
    });

    return Array.from(bagMap.values()).filter(bag => bag.totalOutput > 0);
  }, [worker, workerEntries]);

  // Calculate total output
  const totalOutput = useMemo(() => {
    return outputByBag.reduce((total, bag) => total + bag.totalOutput, 0);
  }, [outputByBag]);

  // Handle opening the output edit dialog
  const openOutputDialog = useCallback(
    (entryId: string, timeSlot: string, bagName: string, currentValue: number) => {
      setSelectedEntryId(entryId);
      setSelectedTimeSlot(timeSlot);
      setSelectedBagName(bagName);
      setCurrentOutputValue(currentValue);
      setOutputDialogOpen(true);
    },
    [],
  );

  // Handle updating bag output
  const handleUpdateBagOutput = useCallback(
    async (entryId: string, timeSlot: string, newValue: number) => {
      if (updateHourlyData) {
        const success = await updateHourlyData(entryId, timeSlot, newValue);
        return success;
      }
      return false;
    },
    [updateHourlyData],
  );

  // Handle adding a new bag
  const handleAddNewBag = useCallback(
    async (bagData: {
      bagId: string;
      bagName: string;
      processId: string;
      processName: string;
      colorId: string;
      colorName: string;
      timeSlot?: string;
      quantity?: number;
    }) => {
      if (addBag) {
        const success = await addBag(worker.id, bagData);
        return success;
      }
      return false;
    },
    [addBag, worker.id],
  );

  // Calculate time slot stats
  const timeSlotStats = useMemo(() => {
    // Count completed time slots
    const completedSlots = Object.keys(worker.hourlyData || {}).length;

    // Calculate required slots based on shift type
    let totalRequired = 8; // Default for regular shift
    if (worker.shiftType === 'EXTENDED') totalRequired = 10;
    if (worker.shiftType === 'OVERTIME') totalRequired = 12;

    const completionPercentage =
      totalRequired > 0 ? Math.round((completedSlots / totalRequired) * 100) : 0;

    return {
      completed: completedSlots,
      totalRequired,
      completionPercentage,
    };
  }, [worker.hourlyData, worker.shiftType]);

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">{worker.user?.fullName || worker.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {worker.user?.employeeId || worker.employeeId || 'No ID'}
              </p>
            </div>
          </div>
          <div className="flex flex-row gap-1">
            <ShiftTypeBadge type={worker.shiftType} />
            <WorkerStatusBadge status={worker.attendanceStatus} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-muted-foreground">Tiến độ nhập liệu</span>
            <span>{timeSlotStats.completionPercentage}%</span>
          </div>
          <Progress value={timeSlotStats.completionPercentage} className="h-1.5" />
          <div className="flex justify-between mt-2 text-xs">
            <span>
              Đã nhập: {timeSlotStats.completed}/{timeSlotStats.totalRequired}
            </span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-gray-50 rounded-md p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">Tổng sản lượng</p>
            <p className="text-xl font-semibold text-primary">{totalOutput}</p>
          </div>

          <div className="bg-gray-50 rounded-md p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">Trung bình/giờ</p>
            <p className="text-xl font-semibold text-primary">
              {timeSlotStats.completed > 0 ? Math.round(totalOutput / timeSlotStats.completed) : 0}
            </p>
          </div>
        </div>

        {/* Display current work */}
        {outputByBag.length > 0 && (
          <div className="mb-3">
            <div className="text-sm font-medium mb-2">Sản phẩm hiện tại:</div>
            <div className="space-y-2">
              {outputByBag.slice(0, expanded ? outputByBag.length : 1).map((bag, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border rounded-md p-2 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-sm">{bag.bagName}</div>
                    <div className="text-xs text-muted-foreground flex gap-2">
                      <span className="flex items-center">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {bag.processName}
                      </span>
                      <span className="flex items-center">
                        <Palette className="h-3 w-3 mr-1" />
                        {bag.colorName}
                      </span>
                    </div>
                  </div>
                  <div className="text-xl font-semibold">{bag.totalOutput}</div>
                </div>
              ))}
            </div>
            {outputByBag.length > 1 && !expanded && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 w-full text-xs"
                onClick={() => setExpanded(true)}
              >
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                Xem thêm {outputByBag.length - 1} sản phẩm khác
              </Button>
            )}
          </div>
        )}

        {/* Issues indicator */}
        {worker.issues && worker.issues.length > 0 && (
          <div className="mt-3 flex items-center gap-1 text-amber-600 text-xs py-1 px-2 bg-amber-50 rounded-md">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{worker.issues.length} vấn đề cần xử lý</span>
          </div>
        )}

        {/* Hourly data component */}
        {expanded && (
          <div className="mt-4">
            <HourlyDataComponent
              worker={worker}
              currentTimeSlot={currentTimeSlot}
              allWorkerEntries={workerEntries}
            />
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

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setAddBagDialogOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" /> Thêm túi
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <Edit className="h-3.5 w-3.5 mr-1" /> Cập nhật
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Cập nhật thông tin sản xuất - {worker.user?.fullName || worker.name}
                </DialogTitle>
              </DialogHeader>
              <UpdateProductionForm
                worker={worker}
                onUpdateHourlyData={updateHourlyData}
                onUpdateAttendanceStatus={updateAttendanceStatus}
                onUpdateShiftType={updateShiftType}
                currentTimeSlot={currentTimeSlot}
                onSuccess={() => setDialogOpen(false)}
                workerEntries={workerEntries}
              />
            </DialogContent>
          </Dialog>
        </div>
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
                  {/* Only show time slots relevant to worker's shift type */}
                  {visibleTimeSlots.map(slot => {
                    // Determine if this slot is part of a regular, extended, or overtime shift
                    const slotIndex = TIME_SLOTS.findIndex(ts => ts.label === slot.label);
                    const isExtendedSlot = slotIndex >= 8 && slotIndex < 10;
                    const isOvertimeSlot = slotIndex >= 10;

                    // Apply appropriate styling based on slot type
                    const slotClass = isOvertimeSlot
                      ? 'text-xs font-medium text-center py-2 bg-amber-50'
                      : isExtendedSlot
                        ? 'text-xs font-medium text-center py-2 bg-purple-50'
                        : 'text-xs font-medium text-center py-2';

                    return (
                      <TableHead key={slot.id} className={slotClass}>
                        {slot.label.split('-')[0]}
                      </TableHead>
                    );
                  })}
                  <TableHead className="text-xs text-right py-2">Tổng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outputByBag.map((bag, idx) => (
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

                    {/* Show only slots relevant to worker shift type */}
                    {visibleTimeSlots.map(slot => {
                      // Determine if this slot is part of a regular, extended, or overtime shift
                      const slotIndex = TIME_SLOTS.findIndex(ts => ts.label === slot.label);
                      const isExtendedSlot = slotIndex >= 8 && slotIndex < 10;
                      const isOvertimeSlot = slotIndex >= 10;

                      // Apply appropriate styling based on slot type
                      const slotClass = isOvertimeSlot
                        ? 'text-xs text-center py-2 bg-amber-50 cursor-pointer hover:bg-amber-100'
                        : isExtendedSlot
                          ? 'text-xs text-center py-2 bg-purple-50 cursor-pointer hover:bg-purple-100'
                          : 'text-xs text-center py-2 cursor-pointer hover:bg-gray-100';

                      return (
                        <TableCell
                          key={slot.id}
                          className={slotClass}
                          onClick={() =>
                            openOutputDialog(
                              bag.entryId,
                              slot.label,
                              bag.bagName,
                              bag.hourlyData[slot.label] || 0,
                            )
                          }
                        >
                          {bag.hourlyData[slot.label] || '-'}
                        </TableCell>
                      );
                    })}

                    <TableCell className="text-xs font-medium text-right py-2">
                      {bag.totalOutput}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Total row */}
                <TableRow className="bg-muted/30">
                  <TableCell className="text-xs py-2 font-medium">Tổng theo giờ</TableCell>

                  {/* Calculate hourly totals across all bags */}
                  {visibleTimeSlots.map(slot => {
                    // Determine if this slot is part of a regular, extended, or overtime shift
                    const slotIndex = TIME_SLOTS.findIndex(ts => ts.label === slot.label);
                    const isExtendedSlot = slotIndex >= 8 && slotIndex < 10;
                    const isOvertimeSlot = slotIndex >= 10;

                    // Apply appropriate styling based on slot type
                    const slotClass = isOvertimeSlot
                      ? 'text-xs text-center py-2 font-medium bg-amber-50'
                      : isExtendedSlot
                        ? 'text-xs text-center py-2 font-medium bg-purple-50'
                        : 'text-xs text-center py-2 font-medium';

                    const hourlyTotal = outputByBag.reduce(
                      (total, bag) => total + (bag.hourlyData[slot.label] || 0),
                      0,
                    );

                    return (
                      <TableCell key={slot.id} className={slotClass}>
                        {hourlyTotal || '-'}
                      </TableCell>
                    );
                  })}

                  <TableCell className="text-xs font-medium text-right py-2">
                    {totalOutput}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Bag details */}
          {outputByBag.length > 0 && (
            <div className="mt-3 border rounded-md overflow-hidden">
              <div className="bg-muted/50 p-2 text-xs font-medium flex items-center">
                <Package className="h-3.5 w-3.5 mr-1.5" />
                Chi tiết các loại túi đang làm
              </div>

              <div className="p-3 grid gap-2">
                {outputByBag.map((bag, idx) => (
                  <div key={idx} className="bg-white p-2 rounded border flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <Package className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-sm">{bag.bagName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          <span>{bag.processName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Palette className="h-3 w-3" />
                          <span>{bag.colorName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{bag.totalOutput}</div>
                      <div className="text-xs text-muted-foreground">Sản lượng</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new product button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 text-xs"
            onClick={() => setAddBagDialogOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            Thêm sản phẩm mới
          </Button>
        </div>
      )}

      {/* Dialog to add a new bag */}
      <Dialog open={addBagDialogOpen} onOpenChange={setAddBagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm loại túi mới - {worker.user?.fullName || worker.name}</DialogTitle>
          </DialogHeader>
          <AddBagForm
            workerId={worker.id}
            onAddBag={handleAddNewBag}
            onSuccess={() => setAddBagDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog to edit output for a specific bag */}
      {/* <OutputEditDialog
        open={outputDialogOpen}
        onOpenChange={setOutputDialogOpen}
        entryId={selectedEntryId}
        timeSlot={selectedTimeSlot}
        bagName={selectedBagName}
        currentValue={currentOutputValue}
        onUpdate={handleUpdateBagOutput}
      /> */}
    </Card>
  );
}

// Export memoized component to prevent unnecessary rerenders
export const ImprovedWorkerCard = memo(ImprovedWorkerCardComponent);
