// components/ImprovedWorkerView.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    CheckCircle2,
    Clock,
    Edit,
    Package,
    UserCircle,
    PlusCircle,
    Briefcase,
    Palette,
    LineChart,
    Loader2,
    Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Worker, AttendanceStatus } from '@/common/types/worker';
import { ShiftType } from '@/common/types/digital-form';
import { WorkerStatusBadge } from './worker-status-badge';
import { ShiftTypeBadge } from './shift-type-badge';
import { AddBagForm } from './add-bag-form';
import { MultiBagTimeSlotDialog } from './MultiBagTimeSlotDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    onUpdateAttendanceStatus: (workerId: string, status: AttendanceStatus, note?: string) => Promise<boolean>;
    onUpdateShiftType: (workerId: string, shiftType: ShiftType) => Promise<boolean>;
    onAddBag: (workerId: string, bagData: {
        bagId: string;
        bagName: string;
        processId: string;
        processName: string;
        colorId: string;
        colorName: string;
        timeSlot?: string;
        quantity?: number;
    }) => Promise<boolean>;
    onGetBagsForTimeSlot?: (workerId: string, timeSlot: string) => any[];
    refreshData?: () => Promise<void>;
}

export function ImprovedWorkerView({
    worker,
    currentTimeSlot,
    allWorkerEntries,
    onUpdateHourlyData,
    onUpdateAttendanceStatus,
    onUpdateShiftType,
    onAddBag,
    onGetBagsForTimeSlot,
    refreshData
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
                    totalOutput: 0
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
    const selectedBag = useMemo(() => {
        return bagsList.find(bag => bag.id === selectedBagId) || bagsList[0];
    }, [bagsList, selectedBagId]);

    // Define all possible time slots
    const allTimeSlots = [
        { label: "07:30-08:30" }, { label: "08:30-09:30" }, { label: "09:30-10:30" }, { label: "10:30-11:30" },
        { label: "12:30-13:30" }, { label: "13:30-14:30" }, { label: "14:30-15:30" }, { label: "15:30-16:30" },
        { label: "16:30-17:00" }, { label: "17:00-18:00" }, { label: "18:00-19:00" }, { label: "19:00-20:00" }
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
    const getBagsForTimeSlot = useCallback((timeSlot: string): BagInTimeSlot[] => {
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
                output: output
            });
        });

        return bags;
    }, [allWorkerEntries]);

    // Get total output for a time slot across all bags
    const getTotalOutputForTimeSlot = useCallback((timeSlot: string): number => {
        const bags = getBagsForTimeSlot(timeSlot);
        return bags.reduce((sum, bag) => sum + bag.output, 0);
    }, [getBagsForTimeSlot]);

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
                status
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
            percentage
        };
    }, [completedSlots, visibleTimeSlots.length]);

    // Calculate average per hour
    const averagePerHour = useMemo(() => {
        return completedSlots > 0 ? Math.round(totalOutput / completedSlots) : 0;
    }, [totalOutput, completedSlots]);

    // Handle opening multi-bag dialog for a time slot
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

    return (
        <Card className="w-full overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle className="text-base">{worker.user?.fullName || worker.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {worker.user?.employeeId || worker.employeeId || 'Không có mã'}
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
                {/* Progress bar */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">Tiến độ nhập liệu</p>
                        <span className="text-sm">{completionStats.percentage}%</span>
                    </div>
                    <Progress value={completionStats.percentage} className="h-2" />
                    <div className="flex justify-between mt-2 text-xs">
                        <span>Đã nhập: {completedSlots}/{visibleTimeSlots.length}</span>
                        <span>Tổng sản lượng: {totalOutput}</span>
                    </div>
                </div>

                {/* Multiple bag summary if more than one bag exists */}
                {bagsList.length > 1 && (
                    <div className="bg-blue-50 rounded-md p-3 mb-4 flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                            <div className="text-sm font-medium text-blue-700">Công nhân làm {bagsList.length} loại túi</div>
                            <div className="text-xs mt-1">
                                Tổng sản lượng: <span className="font-medium">{totalOutput}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                                {bagsList.map(bag => (
                                    <div key={bag.id} className="text-xs flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-blue-400 mr-1"></span>
                                        {bag.bagName}: <span className="font-medium ml-1">{bag.totalOutput}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'hourly' | 'production')}>
                    <TabsList className="grid grid-cols-2 mb-2">
                        <TabsTrigger value="hourly" className="text-xs py-1">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            Theo giờ
                        </TabsTrigger>
                        <TabsTrigger value="production" className="text-xs py-1">
                            <LineChart className="h-3.5 w-3.5 mr-1" />
                            Sản lượng
                        </TabsTrigger>
                    </TabsList>

                    {/* Hourly Tab Content */}
                    <TabsContent value="hourly" className="mt-0">
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[110px] py-2 text-xs">Khung giờ</TableHead>
                                        <TableHead className="py-2 text-xs">Túi</TableHead>
                                        <TableHead className="w-[70px] text-right py-2 text-xs">Sản lượng</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {timeSlotData.map((slot) => {
                                        // Get bags for this time slot
                                        const bagsInSlot = getBagsForTimeSlot(slot.label);
                                        const hasBags = bagsInSlot.some(b => b.output > 0);
                                        const bagCount = bagsInSlot.filter(b => b.output > 0).length;

                                        return (
                                            <TableRow
                                                key={slot.label}
                                                className={slot.status === 'current' ? 'bg-blue-50' : ''}
                                            >
                                                <TableCell className="py-2 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        {slot.status === 'completed' && (
                                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        )}
                                                        {slot.status === 'current' && (
                                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                                        )}
                                                        {slot.status === 'missing' && (
                                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                        )}
                                                        {slot.status === 'pending' && (
                                                            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                                        )}
                                                        {slot.label}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 text-xs">
                                                    {hasBags ? (
                                                        bagCount > 1 ? (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium">{bagCount} túi</span>
                                                                <Badge variant="outline" className="text-xs">Nhiều túi</Badge>
                                                            </div>
                                                        ) : (
                                                            bagsInSlot.find(b => b.output > 0)?.bagName || "—"
                                                        )
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2 text-xs font-medium text-right">
                                                    {slot.output || '—'}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => handleOpenMultiBagDialog(slot.label)}
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    <TableRow className="bg-muted/30">
                                        <TableCell colSpan={2} className="py-2 text-xs font-medium text-right">
                                            Tổng sản lượng:
                                        </TableCell>
                                        <TableCell colSpan={2} className="py-2 text-xs font-medium text-right">
                                            {totalOutput}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Production Tab Content */}
                    <TabsContent value="production" className="mt-0">
                        <div className="border rounded-md overflow-hidden">
                            <div className="bg-muted/50 p-2 text-xs font-medium flex items-center">
                                <LineChart className="h-3.5 w-3.5 mr-1.5" />
                                Chi tiết sản lượng theo giờ
                            </div>
                            <div className="p-4">
                                <div className="h-48 relative">
                                    {timeSlotData.map((slot, index) => {
                                        const maxOutput = Math.max(...timeSlotData.map(s => s.output)) || 1;
                                        const barHeight = (slot.output / maxOutput) * 100;

                                        return (
                                            <div
                                                key={slot.label}
                                                className="flex flex-col items-center absolute bottom-0"
                                                style={{
                                                    left: `${(index / (timeSlotData.length - 1)) * 100}%`,
                                                    transform: 'translateX(-50%)',
                                                }}
                                            >
                                                <div className="text-xs mb-1">{slot.output || 0}</div>
                                                <div
                                                    className={`w-8 ${slot.status === 'current' ? 'bg-blue-500' : 'bg-primary'} rounded-t`}
                                                    style={{
                                                        height: `${barHeight}%`,
                                                        minHeight: slot.output > 0 ? '10%' : '0'
                                                    }}
                                                ></div>
                                                <div className="text-xs mt-1">{slot.label.split('-')[0]}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Summary table for all bags */}
                        <div className="mt-4 border rounded-md overflow-hidden">
                            <div className="bg-muted/50 p-2 text-xs font-medium flex items-center">
                                <Package className="h-3.5 w-3.5 mr-1.5" />
                                Sản lượng theo túi
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs py-2">Loại túi</TableHead>
                                        <TableHead className="text-xs text-right py-2">Sản lượng</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bagsList.map(bag => (
                                        <TableRow key={bag.id} className={bag.id === selectedBagId ? "bg-blue-50" : ""}>
                                            <TableCell className="text-xs py-2">
                                                <div className="font-medium">{bag.bagName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {bag.processName} - {bag.colorName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs py-2 text-right font-medium">
                                                {bag.totalOutput}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/30">
                                        <TableCell className="text-xs py-2 font-medium">
                                            Tổng sản lượng
                                        </TableCell>
                                        <TableCell className="text-xs py-2 text-right font-medium">
                                            {totalOutput}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
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