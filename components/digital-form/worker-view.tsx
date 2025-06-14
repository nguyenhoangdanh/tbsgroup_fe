'use client';
import {
  Edit,
  PlusCircle,
  User,
  Package,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';


import { ShiftType, AttendanceStatus } from '@/common/types/digital-form';
import { Worker } from '@/common/types/worker';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useDigitalFormContext } from '@/hooks/digital-form';
import { useWorkShifts } from '@/hooks/digital-form/useWorkShifts';
import { cn } from '@/lib/utils';

import { BagTimeSlotGrid } from './bag-time-slot-grid';
import { TimeSlotTable } from './time-slot-table';

// Types for component props
interface WorkerViewProps {
  worker: Worker;
  allWorkerEntries?: Worker[];
  onUpdateHourlyData?: (workerId: string, timeSlot: string, quantity: number) => Promise<boolean>;
  onUpdateAttendanceStatus?: (
    workerId: string,
    status: AttendanceStatus,
    note?: string,
  ) => Promise<boolean>;
  onUpdateShiftType?: (workerId: string, shiftType: ShiftType) => Promise<boolean>;
  onAddBag?: (workerId: string, bagData: any) => Promise<boolean>;
  refreshData?: () => Promise<void>;
}

// Interface for time slot data
interface TimeSlotData {
  label: string;
  output: number;
  status: 'completed' | 'current' | 'missing' | 'pending';
}

// Interface for bag data
interface BagData {
  id: string;
  bagId: string;
  bagName: string;
  processId: string;
  processName: string;
  colorId: string;
  colorName: string;
  hourlyData: Record<string, number>;
  totalOutput: number;
}

// Interface for bag in time slot
interface BagInTimeSlot {
  entryId: string;
  bagId: string;
  bagName: string;
  processId: string;
  processName: string;
  colorId: string;
  colorName: string;
  output: number;
}

// Component implementation
export const WorkerView: React.FC<WorkerViewProps> = ({
  worker,
  allWorkerEntries = [],
  onUpdateHourlyData,
  onUpdateAttendanceStatus,
  onUpdateShiftType,
  onAddBag,
  refreshData,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'hourly' | 'bags'>('hourly');
  const [addBagDialogOpen, setAddBagDialogOpen] = useState<boolean>(false);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [timeSlotDialogOpen, setTimeSlotDialogOpen] = useState<boolean>(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Get hooks
  const { timeSlots, currentSlot } = useWorkShifts(worker.shiftType);
  const { updateHourlyData } = useDigitalFormContext();

  // Process all bag data from worker entries
  const bagsList = useMemo(() => {
    if (!allWorkerEntries || allWorkerEntries.length === 0) return [];

    const bagMap = new Map<string, BagData>();

    allWorkerEntries.forEach(entry => {
      // Skip entries without bag data
      if (!entry.bagId || !entry.processId || !entry.colorId) return;

      const key = `${entry.bagId}-${entry.processId}-${entry.colorId}`;

      if (!bagMap.has(key)) {
        bagMap.set(key, {
          id: entry.id,
          bagId: entry.bagId,
          bagName: entry.handBag?.name || entry.bagName || 'Unknown Bag',
          processId: entry.processId,
          processName: entry.process?.name || entry.processName || 'Unknown Process',
          colorId: entry.colorId,
          colorName: entry.bagColor?.colorName || entry.colorName || 'Unknown Color',
          hourlyData: {},
          totalOutput: 0,
        });
      }

      // Add hourly data
      if (entry.hourlyData) {
        const bagData = bagMap.get(key)!;
        Object.entries(entry.hourlyData).forEach(([timeSlot, output]) => {
          if (!bagData.hourlyData[timeSlot]) {
            bagData.hourlyData[timeSlot] = 0;
          }
          bagData.hourlyData[timeSlot] += output;
          bagData.totalOutput += output;
        });
      }
    });

    return Array.from(bagMap.values());
  }, [allWorkerEntries]);

  // Calculate total output for all bags
  const totalOutput = useMemo(() => {
    return bagsList.reduce((sum, bag) => sum + bag.totalOutput, 0);
  }, [bagsList]);

  // Get bags for a specific time slot
  const getBagsForTimeSlot = useCallback(
    (timeSlot: string): BagInTimeSlot[] => {
      const bags: BagInTimeSlot[] = [];

      allWorkerEntries.forEach(entry => {
        // Skip entries without bag data
        if (!entry.bagId || !entry.bagName) return;

        const hourlyData = entry.hourlyData || {};
        const output = hourlyData[timeSlot] || 0;

        // For UI purposes, include all bags even if output is 0
        bags.push({
          entryId: entry.id,
          bagId: entry.bagId,
          bagName: entry.handBag?.name || entry.bagName,
          processId: entry.processId,
          processName: entry.process?.name || entry.processName || '',
          colorId: entry.colorId,
          colorName: entry.bagColor?.colorName || entry.colorName || '',
          output: output,
        });
      });

      return bags;
    },
    [allWorkerEntries],
  );

  // Get total output for a time slot across all bags
  const getTotalOutputForTimeSlot = useCallback(
    (timeSlot: string): number => {
      const bags = getBagsForTimeSlot(timeSlot);
      return bags.reduce((sum, bag) => sum + bag.output, 0);
    },
    [getBagsForTimeSlot],
  );

  // Process time slot data with status and output
  const timeSlotData: TimeSlotData[] = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return timeSlots.map(slot => {
      const [slotStartTime, slotEndTime] = slot.label.split('-');
      const totalOutput = getTotalOutputForTimeSlot(slot.label);

      let status: 'completed' | 'current' | 'missing' | 'pending' = 'pending';

      if (totalOutput > 0) {
        status = 'completed';
      } else if (slot.label === currentSlot?.label) {
        status = 'current';
      } else if (slotEndTime && currentTime > slotEndTime) {
        status = 'missing';
      }

      return {
        label: slot.label,
        output: totalOutput,
        status,
      };
    });
  }, [timeSlots, currentSlot, getTotalOutputForTimeSlot]);

  // Count total completed time slots
  const completedSlots = useMemo(() => {
    return timeSlotData.filter(slot => slot.status === 'completed').length;
  }, [timeSlotData]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    return timeSlots.length > 0 ? Math.round((completedSlots / timeSlots.length) * 100) : 0;
  }, [completedSlots, timeSlots]);

  // Handle opening time slot dialog
  const handleOpenTimeSlotDialog = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setTimeSlotDialogOpen(true);
  };

  // Handle adding a new bag
  const handleAddNewBag = async (bagData: any) => {
    if (!onAddBag) return false;

    try {
      const success = await onAddBag(worker.id, {
        ...bagData,
        timeSlot: bagData.timeSlot || currentSlot?.label || '',
        quantity: bagData.quantity || 0,
      });

      if (success) {
        setAddBagDialogOpen(false);
        if (refreshData) await refreshData();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error adding new bag:', error);
      return false;
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Worker Header */}
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border">
              <AvatarFallback className="bg-primary/10 text-primary">
                {worker.name?.charAt(0) || worker.user?.fullName?.charAt(0) || 'W'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-base font-medium">{worker.user?.fullName || worker.name}</h4>
              <p className="text-xs text-muted-foreground">
                {worker.user?.employeeId || worker.employeeId || 'ID chưa xác định'}
              </p>
            </div>
          </div>

          {/* Attendance Status Badge */}
          <AttendanceStatusBadge status={worker.attendanceStatus} />
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t">
          <div className="flex flex-col items-center text-center">
            <span className="text-xs text-muted-foreground">Sản lượng</span>
            <span className="text-base font-medium">{totalOutput}</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-xs text-muted-foreground">Thời gian</span>
            <span className="text-base font-medium">
              {completedSlots}/{timeSlots.length}
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-xs text-muted-foreground">Túi</span>
            <span className="text-base font-medium">{bagsList.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span>Tiến độ</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardHeader>

      {/* Tab Content */}
      <CardContent className="p-3">
        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as 'hourly' | 'bags')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-3">
            <TabsTrigger value="hourly" className="text-xs py-1">
              Theo giờ
            </TabsTrigger>
            <TabsTrigger value="bags" className="text-xs py-1">
              Túi
            </TabsTrigger>
          </TabsList>

          {/* Hourly Tab Content */}
          <TabsContent value="hourly" className="mt-0">
            <TimeSlotTable
              timeSlotData={timeSlotData}
              totalOutput={totalOutput}
              getBagsForTimeSlot={getBagsForTimeSlot}
              onEditTimeSlot={handleOpenTimeSlotDialog}
            />
          </TabsContent>

          {/* Bags Tab Content */}
          <TabsContent value="bags" className="mt-0 space-y-3">
            {bagsList.length === 0 ? (
              <div className="text-center py-8 bg-muted/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Chưa có túi nào được thêm</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddBagDialogOpen(true)}
                  className="mt-3"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Thêm túi mới
                </Button>
              </div>
            ) : (
              bagsList.map(bag => (
                <BagCard
                  key={`${bag.bagId}-${bag.processId}-${bag.colorId}`}
                  bag={bag}
                  isSelected={selectedBagId === bag.id}
                  onClick={() => setSelectedBagId(bag.id === selectedBagId ? null : bag.id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Card Footer with Actions */}
      <CardFooter className="border-t pt-3 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            const currentSlot = timeSlotData.find(s => s.status === 'current');
            handleOpenTimeSlotDialog(currentSlot?.label || timeSlotData[0].label);
          }}
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          Cập nhật sản lượng
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setAddBagDialogOpen(true)}
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          Thêm túi mới
        </Button>
      </CardFooter>

      {/* Add New Bag Dialog */}
      <Dialog open={addBagDialogOpen} onOpenChange={setAddBagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm túi mới</DialogTitle>
          </DialogHeader>
          {/* <AddBagForm
            workerId={worker.id}
            onAddBag={handleAddNewBag}
            onSuccess={() => setAddBagDialogOpen(false)}
          /> */}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Helper component for bag cards in the bags tab
interface BagCardProps {
  bag: BagData;
  isSelected?: boolean;
  onClick?: () => void;
}

const BagCard: React.FC<BagCardProps> = ({ bag, isSelected, onClick }) => {
  return (
    <div
      className={cn(
        'p-3 border rounded-md cursor-pointer transition-all',
        isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/30',
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <Package className="h-4 w-4 mr-1.5 text-muted-foreground" />
          <h4 className="text-sm font-medium truncate max-w-[200px]">{bag.bagName}</h4>
        </div>
        <Badge variant="outline" className="text-xs">
          {bag.totalOutput}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
          {bag.processName}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <span
            className="w-2 h-2 rounded-full mr-1.5"
            style={{
              backgroundColor:
                bag.colorName.toLowerCase() !== 'unknown color' ? bag.colorName : '#888',
            }}
          ></span>
          {bag.colorName}
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 pt-2 border-t">
          <BagTimeSlotGrid
            entryId={bag.id}
            hourlyData={bag.hourlyData}
            className="p-0 shadow-none border-0"
          />
        </div>
      )}
    </div>
  );
};

// Helper component for attendance status badge
interface AttendanceStatusBadgeProps {
  status?: AttendanceStatus;
}

const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return (
        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 gap-1">
          <CheckCircle className="h-3 w-3" /> Có mặt
        </Badge>
      );
    case AttendanceStatus.ABSENT:
      return (
        <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 gap-1">
          <AlertCircle className="h-3 w-3" /> Vắng
        </Badge>
      );
    case AttendanceStatus.LATE:
      return (
        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 gap-1">
          <Clock className="h-3 w-3" /> Đi muộn
        </Badge>
      );
    case AttendanceStatus.EARLY_LEAVE:
      return (
        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 gap-1">
          <Clock className="h-3 w-3" /> Về sớm
        </Badge>
      );
    case AttendanceStatus.LEAVE_APPROVED:
      return (
        <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 gap-1">
          <Calendar className="h-3 w-3" /> Nghỉ phép
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700 gap-1">
          <User className="h-3 w-3" /> Chưa xác định
        </Badge>
      );
  }
};

export default WorkerView;
