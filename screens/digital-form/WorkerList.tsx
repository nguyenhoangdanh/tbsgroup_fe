// components/digital-form/WorkerList.tsx
"use client"

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Worker } from '@/common/types/worker';
import { TIME_SLOTS } from '@/common/constants/time-slots';
import { AttendanceStatus } from '@/common/types/digital-form';
import { ChevronUp, ChevronDown } from 'lucide-react';
import AttendanceBadge from './AttendanceBadge';
import TimeSlotButton from './TimeSlotButton';

interface WorkerListProps {
    workers: Worker[];
    currentTimeSlot: string | null;
    onUpdateOutput: (worker: Worker, timeSlot: string) => void;
    onToggleAttendance: (worker: Worker) => void;
}

export default function WorkerList({
    workers,
    currentTimeSlot,
    onUpdateOutput,
    onToggleAttendance,
}: WorkerListProps) {
    const [expandedWorkers, setExpandedWorkers] = useState<Record<string, boolean>>({});

    // Toggle worker expanded state
    const toggleWorkerExpanded = (workerId: string) => {
        setExpandedWorkers(prev => ({
            ...prev,
            [workerId]: !prev[workerId]
        }));
    };

    if (workers.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                    Không có công nhân nào được tìm thấy
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {workers.map((worker) => {
                const isExpanded = expandedWorkers[worker.id];

                return (
                    <Card key={worker.id} className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold flex items-center">
                                            {worker.name}
                                            <AttendanceBadge
                                                status={worker.attendanceStatus}
                                                className="ml-2"
                                            />
                                        </div>
                                        <div className="text-sm text-muted-foreground">Mã: {worker.employeeId}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">Công đoạn: {worker.processName}</div>
                                        <div className="text-sm text-muted-foreground">Tổng SL: {worker.totalOutput}</div>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <div className="text-sm text-muted-foreground mb-1">Túi: {worker.bagName}</div>
                                    <div className="text-sm text-muted-foreground">Màu: {worker.colorName}</div>
                                </div>

                                {/* Time slots */}
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {isExpanded ? (
                                        // Show all time slots when expanded
                                        TIME_SLOTS.map((slot) => {
                                            const quantity = worker.hourlyData[slot.label] || 0;
                                            const isCurrentSlot = currentTimeSlot === slot.label;

                                            return (
                                                <TimeSlotButton
                                                    key={slot.id}
                                                    label={slot.label}
                                                    quantity={quantity}
                                                    isCurrentSlot={isCurrentSlot}
                                                    onClick={() => onUpdateOutput(worker, slot.label)}
                                                />
                                            );
                                        })
                                    ) : (
                                        // Show limited time slots when collapsed
                                        <>
                                            {TIME_SLOTS.slice(0, 6).map((slot) => {
                                                const quantity = worker.hourlyData[slot.label] || 0;
                                                const isCurrentSlot = currentTimeSlot === slot.label;

                                                return (
                                                    <TimeSlotButton
                                                        key={slot.id}
                                                        label={slot.label}
                                                        quantity={quantity}
                                                        isCurrentSlot={isCurrentSlot}
                                                        onClick={() => onUpdateOutput(worker, slot.label)}
                                                    />
                                                );
                                            })}

                                            {TIME_SLOTS.length > 6 && (
                                                <button
                                                    className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs hover:bg-gray-200"
                                                >
                                                    +{TIME_SLOTS.length - 6}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-2 flex justify-between">
                                <button
                                    className="text-sm flex items-center text-muted-foreground hover:text-gray-800"
                                    onClick={() => toggleWorkerExpanded(worker.id)}
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp className="h-4 w-4 mr-1" />
                                            Thu gọn
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4 mr-1" />
                                            Mở rộng
                                        </>
                                    )}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        className="text-sm text-muted-foreground hover:text-gray-800"
                                        onClick={() => onToggleAttendance(worker)}
                                    >
                                        Chuyên cần
                                    </button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                    >
                                        Cập nhật
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}