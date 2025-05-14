'use client';

import { Clock, PlusCircle, Edit, Briefcase, Package, Palette } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';

import { MultiBagTimeSlotDialog } from './multi-bag-time-slot-dialog';

import { TIME_SLOTS } from '@/common/constants/time-slots';
import { Worker } from '@/common/types/worker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useForm } from '@/contexts/form-context';

interface HourlyDataComponentProps {
  worker: Worker;
  currentTimeSlot: string | null;
  allWorkerEntries: Worker[];
}

export function HourlyDataComponent({
  worker,
  currentTimeSlot,
  allWorkerEntries,
}: HourlyDataComponentProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'summary'>('timeline');
  const [multiBagDialogOpen, setMultiBagDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  const { getBagsForTimeSlot, getHourlyDataByTimeSlot } = useForm();

  // Get hourly data organized by time slot for all worker's entries
  const hourlyDataByTimeSlot = useMemo(() => {
    return getHourlyDataByTimeSlot ? getHourlyDataByTimeSlot(worker.id) : {};
  }, [worker.id, getHourlyDataByTimeSlot]);

  // Determine which time slots to show based on shift type
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

  console.log('hourlyDataByTimeSlot', hourlyDataByTimeSlot);

  // Group data by bag for summary view
  const bagSummaries = useMemo(() => {
    const bagMap = new Map();

    // Process all time slots
    Object.entries(hourlyDataByTimeSlot).forEach(([timeSlot, data]) => {
      // Process all bags in this time slot
      data.bags.forEach(bag => {
        const bagKey = `${bag.bagId}-${bag.processId}-${bag.colorId}`;

        if (!bagMap.has(bagKey)) {
          bagMap.set(bagKey, {
            bagId: bag.bagId,
            bagName: bag.bagName,
            processId: bag.processId,
            processName: bag.processName,
            colorId: bag.colorId,
            colorName: bag.colorName,
            totalOutput: 0,
            hourlyData: {},
          });
        }

        // Update the bag's total output
        const bagData = bagMap.get(bagKey);
        bagData.totalOutput += bag.output;

        // Track hourly data
        if (!bagData.hourlyData[timeSlot]) {
          bagData.hourlyData[timeSlot] = 0;
        }
        bagData.hourlyData[timeSlot] += bag.output;
      });
    });

    return Array.from(bagMap.values());
  }, [hourlyDataByTimeSlot]);

  // Determine time slot status
  const getTimeSlotStatus = useCallback(
    (timeSlot: string) => {
      const slotData = hourlyDataByTimeSlot[timeSlot];

      if (slotData && slotData.totalOutput > 0) {
        return 'completed';
      }

      if (timeSlot === currentTimeSlot) {
        return 'current';
      }

      // Check if this slot is in the past
      const [slotEndTime] = timeSlot.split('-').reverse();

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (currentTime > slotEndTime) {
        return 'missing';
      }

      return 'pending';
    },
    [hourlyDataByTimeSlot, currentTimeSlot],
  );

  // Handle opening the dialog for a specific time slot
  const handleOpenDialog = useCallback((timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setMultiBagDialogOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as 'timeline' | 'summary')}
      >
        <TabsList className="grid grid-cols-2 mb-2">
          <TabsTrigger value="timeline" className="text-xs py-1">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Theo giờ
          </TabsTrigger>
          <TabsTrigger value="summary" className="text-xs py-1">
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
                  <TableHead className="w-[50px] py-1.5 text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTimeSlots.map(slot => {
                  const timeSlotKey = slot.label;
                  const timeSlotData = hourlyDataByTimeSlot[timeSlotKey];
                  const bags = timeSlotData?.bags || [];
                  const totalOutput = timeSlotData?.totalOutput || 0;
                  const status = getTimeSlotStatus(timeSlotKey);

                  // Empty time slot - show option to add bag
                  if (bags.length === 0) {
                    return (
                      <TableRow
                        key={timeSlotKey}
                        className={status === 'current' ? 'bg-blue-50' : ''}
                      >
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
                            {timeSlotKey}
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 text-xs truncate max-w-[120px]">
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                        <TableCell className="py-1.5 text-xs font-medium text-right">0</TableCell>
                        <TableCell className="py-1.5 text-xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleOpenDialog(timeSlotKey)}
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  // Display all bags for this time slot
                  return bags.map((bag, idx) => (
                    <TableRow
                      key={`${timeSlotKey}-${bag.entryId}-${idx}`}
                      className={status === 'current' ? 'bg-blue-50' : ''}
                    >
                      {idx === 0 && (
                        <TableCell className="py-1.5 text-xs" rowSpan={bags.length}>
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
                            {timeSlotKey}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="py-1.5 text-xs truncate max-w-[120px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{bag.bagName}</span>
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
                        {bag.output}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs">
                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleOpenDialog(timeSlotKey)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          {idx === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleOpenDialog(timeSlotKey)}
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ));
                })}

                {/* Show total row if multiple bags exist */}
                {Object.values(hourlyDataByTimeSlot).some(data => data.bags.length > 1) && (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={2} className="py-1.5 text-xs font-medium text-right">
                      Tổng sản lượng:
                    </TableCell>
                    <TableCell colSpan={2} className="py-1.5 text-xs font-medium text-right">
                      {worker.totalOutput}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Summary tab content - Bags view */}
        <TabsContent value="summary" className="mt-0">
          <div className="rounded-md border overflow-hidden">
            <Table className="w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="py-1.5 text-xs">Túi</TableHead>
                  <TableHead className="w-[80px] text-right py-1.5 text-xs">Sản lượng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bagSummaries.map((bag, idx) => (
                  <TableRow key={idx} className="group hover:bg-muted/30">
                    <TableCell className="py-1.5 text-xs">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate max-w-[150px] flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-primary"></span>
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

          {/* Bag details cards */}
          <div className="mt-3 space-y-2">
            {bagSummaries.map((bag, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">{bag.bagName}</h4>
                    <span className="ml-auto font-medium">{bag.totalOutput}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      <span>{bag.processName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      <span>{bag.colorName}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(bag.hourlyData).map(([timeSlot, output]) => (
                      <Badge key={timeSlot} variant="outline" className="text-xs">
                        {timeSlot.split('-')[0]}: {output}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Multi-bag dialog */}
      <MultiBagTimeSlotDialog
        open={multiBagDialogOpen}
        onOpenChange={setMultiBagDialogOpen}
        worker={worker}
        timeSlot={selectedTimeSlot}
        onSuccess={() => setMultiBagDialogOpen(false)}
      />
    </div>
  );
}
