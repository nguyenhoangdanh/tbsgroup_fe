'use client';

import { Edit, PlusCircle } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';

import { ShiftType } from '@/common/types/digital-form';
import { Worker, AttendanceStatus } from '@/common/types/worker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { AddBagForm } from './add-bag-form';
import { BagsTable } from './BagsTable';
import { MultiBagTimeSlotDialog } from './MultiBagTimeSlotDialog';
import { ProductionChart } from './ProductionChart';
import { TimeSlotTable } from './TimeSlotTable';
import { WorkerHeader } from './WorkerHeader';
import { WorkerProgress } from './WorkerProgress';


interface TimeSlotData {
  label: string;
  output: number;
  status: 'completed' | 'current' | 'missing' | 'pending';
}

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

interface ImprovedWorkerViewProps {
  worker: Worker;
  currentTimeSlot: string | null;
  allWorkerEntries: Worker[];
  onUpdateHourlyData: (workerId: string, timeSlot: string, quantity: number) => Promise<boolean>;
  onUpdateAttendanceStatus: (
    workerId: string,
    status: AttendanceStatus,
    note?: string,
  ) => Promise<boolean>;
  onUpdateShiftType: (workerId: string, shiftType: ShiftType) => Promise<boolean>;
  onAddBag: (
    workerId: string,
    bagData: {
      bagId: string;
      bagName: string;
      processId: string;
      processName: string;
      colorId: string;
      colorName: string;
      timeSlot?: string;
      quantity?: number;
    },
  ) => Promise<boolean>;
  onGetBagsForTimeSlot?: (workerId: string, timeSlot: string) => any[];
  refreshData?: () => Promise<void>;
}

export function ImprovedWorkerView({
  worker,
  currentTimeSlot,
  allWorkerEntries,
  onUpdateHourlyData,
  onAddBag,
  refreshData,
}: ImprovedWorkerViewProps) {
  const [activeTab, setActiveTab] = useState<'hourly' | 'production'>('hourly');
  const [addBagDialogOpen, setAddBagDialogOpen] = useState<boolean>(false);
  const [selectedBagId, setSelectedBagId] = useState<string>('');
  const [multiBagDialogOpen, setMultiBagDialogOpen] = useState<boolean>(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

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

  // Set the first bag as selected when the list changes
  useEffect(() => {
    if (bagsList.length > 0 && !selectedBagId) {
      setSelectedBagId(bagsList[0].id);
    }
  }, [bagsList, selectedBagId]);

  // Get the currently selected bag
  // const selectedBag = useMemo(() => {
  //   return bagsList.find(bag => bag.id === selectedBagId) || bagsList[0];
  // }, [bagsList, selectedBagId]);

  // Define all possible time slots
  const allTimeSlots = [
    { label: '07:30-08:30' },
    { label: '08:30-09:30' },
    { label: '09:30-10:30' },
    { label: '10:30-11:30' },
    { label: '12:30-13:30' },
    { label: '13:30-14:30' },
    { label: '14:30-15:30' },
    { label: '15:30-16:30' },
    { label: '16:30-17:00' },
    { label: '17:00-18:00' },
    { label: '18:00-19:00' },
    { label: '19:00-20:00' },
  ];

  // Determine visible time slots based on shift type
  const visibleTimeSlots = useMemo(() => {
    if (worker.shiftType === 'OVERTIME') {
      return allTimeSlots;
    } else if (worker.shiftType === 'EXTENDED') {
      return allTimeSlots.slice(0, 10);
    } else {
      return allTimeSlots.slice(0, 8);
    }
  }, [worker.shiftType]);

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

    return visibleTimeSlots.map(slot => {
      const [slotStartTime, slotEndTime] = slot.label.split('-');
      const totalOutput = getTotalOutputForTimeSlot(slot.label);

      let status: 'completed' | 'current' | 'missing' | 'pending' = 'pending';
      if (totalOutput > 0) {
        status = 'completed';
      } else if (slot.label === currentTimeSlot) {
        status = 'current';
      } else if (slotEndTime && currentTime > slotEndTime) {
        status = 'missing';
      }

      return {
        ...slot,
        output: totalOutput,
        status,
      };
    });
  }, [visibleTimeSlots, currentTimeSlot, getTotalOutputForTimeSlot]);

  // Count total completed time slots
  const completedSlots = useMemo(() => {
    return timeSlotData.filter(slot => slot.status === 'completed').length;
  }, [timeSlotData]);

  // Calculate completion percentage
  const completionStats = useMemo(() => {
    const totalRequired = visibleTimeSlots.length;
    const percentage = totalRequired > 0 ? Math.round((completedSlots / totalRequired) * 100) : 0;

    return {
      completed: completedSlots,
      totalRequired,
      percentage,
    };
  }, [completedSlots, visibleTimeSlots.length]);

  //  Handle opening multi-bag dialog for a time slot
  const handleOpenMultiBagDialog = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setMultiBagDialogOpen(true);
  };

  // Handle adding a new bag
  const handleAddNewBag = async (bagData: {
    bagId: string;
    bagName: string;
    processId: string;
    processName: string;
    colorId: string;
    colorName: string;
    timeSlot?: string;
    quantity?: number;
  }) => {
    try {
      const success = await onAddBag(worker.id, bagData);

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

  // Prepare simplified bag data for progress component
  const bagSummaryForProgress = useMemo(() => {
    return bagsList.map(bag => ({
      id: bag.id,
      bagName: bag.bagName,
      totalOutput: bag.totalOutput,
    }));
  }, [bagsList]);

  return (
    <Card className="w-full overflow-hidden">
      <WorkerHeader worker={worker} />

      <CardContent className="pb-3">
        {/* Progress and Summary */}
        <WorkerProgress
          completedSlots={completedSlots}
          totalSlots={visibleTimeSlots.length}
          percentage={completionStats.percentage}
          totalOutput={totalOutput}
          bagsList={bagSummaryForProgress}
        />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as 'hourly' | 'production')}
        >
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="hourly" className="text-xs py-1">
              Theo giờ
            </TabsTrigger>
            <TabsTrigger value="production" className="text-xs py-1">
              Sản lượng
            </TabsTrigger>
          </TabsList>

          {/* Hourly Tab Content */}
          <TabsContent value="hourly" className="mt-0">
            <TimeSlotTable
              timeSlotData={timeSlotData}
              totalOutput={totalOutput}
              getBagsForTimeSlot={getBagsForTimeSlot}
              onEditTimeSlot={handleOpenMultiBagDialog}
            />
          </TabsContent>

          {/* Production Tab Content */}
          <TabsContent value="production" className="mt-0">
            <ProductionChart timeSlotData={timeSlotData} />

            {/* Summary table for all bags */}
            <div className="mt-4">
              <BagsTable
                bagsList={bagsList}
                selectedBagId={selectedBagId}
                totalOutput={totalOutput}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="border-t pt-3 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            const currentSlot = timeSlotData.find(s => s.status === 'current');
            handleOpenMultiBagDialog(currentSlot?.label || timeSlotData[0].label);
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

      {/* Multi-Bag TimeSlot Dialog */}
      <MultiBagTimeSlotDialog
        open={multiBagDialogOpen}
        onOpenChange={setMultiBagDialogOpen}
        worker={worker}
        timeSlot={selectedTimeSlot}
        allWorkerEntries={allWorkerEntries}
        onUpdateHourlyData={onUpdateHourlyData}
        onAddBag={onAddBag}
        refreshData={refreshData}
      />

      {/* Add New Bag Dialog */}
      <Dialog open={addBagDialogOpen} onOpenChange={setAddBagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm túi mới</DialogTitle>
          </DialogHeader>
          <AddBagForm
            workerId={worker.id}
            onAddBag={handleAddNewBag}
            onSuccess={() => setAddBagDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
