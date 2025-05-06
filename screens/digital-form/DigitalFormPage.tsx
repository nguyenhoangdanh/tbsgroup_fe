// pages/digital-form/[formId].tsx
"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FormProvider, useForm } from '@/contexts/form-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { AttendanceStatus } from '@/common/types/digital-form';
import { TIME_SLOTS } from '@/common/constants/time-slots';
import { Worker } from '@/common/types/worker';

// Status colors mapping
const statusColors = {
    [AttendanceStatus.PRESENT]: "bg-green-500",
    [AttendanceStatus.ABSENT]: "bg-red-500",
    [AttendanceStatus.LATE]: "bg-amber-500",
    [AttendanceStatus.EARLY_LEAVE]: "bg-orange-500",
    [AttendanceStatus.LEAVE_APPROVED]: "bg-blue-500",
};

// Status labels mapping
const statusLabels = {
    [AttendanceStatus.PRESENT]: "Có mặt",
    [AttendanceStatus.ABSENT]: "Vắng mặt",
    [AttendanceStatus.LATE]: "Đi muộn",
    [AttendanceStatus.EARLY_LEAVE]: "Về sớm",
    [AttendanceStatus.LEAVE_APPROVED]: "Nghỉ phép",
};

export default function DigitalFormPage() {
    return (
        <FormProvider>
            <DigitalFormContent />
        </FormProvider>
    );
}

function DigitalFormContent() {
    const {
        formData,
        loading,
        error,
        currentTimeSlot,
        stats,
        refreshData,
        submitFormData,
        updateHourlyData,
        updateAttendanceStatus,
    } = useForm();

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
    const [isOutputDialogOpen, setIsOutputDialogOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [outputQuantity, setOutputQuantity] = useState<number>(0);

    // Filter workers when search term or form data changes
    useEffect(() => {
        if (!formData || !formData.workers) {
            setFilteredWorkers([]);
            return;
        }

        if (!searchTerm.trim()) {
            setFilteredWorkers(formData.workers);
            return;
        }

        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = formData.workers.filter(worker =>
            worker.name.toLowerCase().includes(lowerSearchTerm) ||
            worker.employeeId.toLowerCase().includes(lowerSearchTerm) ||
            worker.bagName.toLowerCase().includes(lowerSearchTerm) ||
            worker.processName.toLowerCase().includes(lowerSearchTerm)
        );

        setFilteredWorkers(filtered);
    }, [searchTerm, formData]);

    // Handle opening the output dialog
    const handleOpenOutputDialog = (worker: Worker, timeSlot: string) => {
        setSelectedWorker(worker);
        setSelectedTimeSlot(timeSlot);
        setOutputQuantity(worker.hourlyData[timeSlot] || 0);
        setIsOutputDialogOpen(true);
    };

    // Update output quantity
    const handleUpdateOutput = async () => {
        if (!selectedWorker || !selectedTimeSlot) return;

        await updateHourlyData(selectedWorker.id, selectedTimeSlot, outputQuantity);
        setIsOutputDialogOpen(false);
    };

    // Toggle attendance status
    const handleToggleAttendance = async (worker: Worker) => {
        const currentStatus = worker.attendanceStatus;
        let newStatus: AttendanceStatus;

        // Cycle through statuses
        switch (currentStatus) {
            case AttendanceStatus.PRESENT:
                newStatus = AttendanceStatus.ABSENT;
                break;
            case AttendanceStatus.ABSENT:
                newStatus = AttendanceStatus.LATE;
                break;
            case AttendanceStatus.LATE:
                newStatus = AttendanceStatus.EARLY_LEAVE;
                break;
            case AttendanceStatus.EARLY_LEAVE:
                newStatus = AttendanceStatus.LEAVE_APPROVED;
                break;
            default:
                newStatus = AttendanceStatus.PRESENT;
        }

        await updateAttendanceStatus(worker.id, newStatus);
    };

    if (loading) {
        return (
            <div className="p-4">
                <Skeleton className="h-12 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full mb-4" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center">
                <div className="text-red-500 text-xl mb-4">
                    {error}
                </div>
                <Button onClick={refreshData}>Thử lại</Button>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="p-4 text-center">
                <div className="text-gray-500 text-xl mb-4">
                    Không tìm thấy dữ liệu biểu mẫu
                </div>
                <Button onClick={refreshData}>Làm mới</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">
                    Phiếu theo dõi công đoạn - Giao chỉ tiêu cá nhân
                </h1>
                <Button variant="outline" size="sm" onClick={refreshData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                </Button>
            </div>

            <div className="text-sm text-muted-foreground mb-4 flex items-center justify-between">
                <span>{formData.date ? new Date(formData.date).toLocaleDateString('vi-VN') : "28/04/2025"}</span>
                <span>Tiến độ nhập liệu: {stats?.overallCompletionPercentage || 0}%</span>
            </div>

            {/* Search and Filter */}
            <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Tìm kiếm công nhân..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {/* Worker List */}
            <div className="space-y-4">
                {filteredWorkers.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            Không có công nhân nào được tìm thấy
                        </CardContent>
                    </Card>
                ) : (
                    filteredWorkers.map((worker) => (
                        <Card key={worker.id} className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold flex items-center">
                                                {worker.name}
                                                <Badge
                                                    className="ml-2"
                                                    variant="outline"
                                                >
                                                    <div className={`w-2 h-2 rounded-full mr-1 ${statusColors[worker.attendanceStatus]}`}></div>
                                                    {statusLabels[worker.attendanceStatus]}
                                                </Badge>
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
                                        {TIME_SLOTS.map((slot) => {
                                            const quantity = worker.hourlyData[slot.label] || 0;
                                            const isCurrentSlot = currentTimeSlot === slot.label;

                                            return (
                                                <button
                                                    key={slot.id}
                                                    className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                            ${quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                            ${isCurrentSlot ? 'ring-2 ring-blue-500' : ''}
                            hover:bg-gray-200 transition-colors
                          `}
                                                    onClick={() => handleOpenOutputDialog(worker, slot.label)}
                                                >
                                                    {quantity}
                                                </button>
                                            );
                                        })}

                                        {filteredWorkers.length > 1 && (
                                            <button
                                                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs hover:bg-gray-200"
                                            >
                                                +6
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-2 flex justify-between">
                                    <button
                                        className="text-sm flex items-center text-muted-foreground hover:text-gray-800"
                                        onClick={() => {/* Toggle expanded view */ }}
                                    >
                                        {filteredWorkers.length === 1 ? "Thu gọn" : "Mở rộng"}
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            className="text-sm text-muted-foreground hover:text-gray-800"
                                            onClick={() => handleToggleAttendance(worker)}
                                        >
                                            Chuyên cần
                                        </button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {/* Open edit dialog */ }}
                                        >
                                            Cập nhật
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Output Update Dialog */}
            <Dialog open={isOutputDialogOpen} onOpenChange={setIsOutputDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Cập nhật sản lượng - {selectedWorker?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Khung giờ</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={selectedTimeSlot || ''}
                                disabled
                            >
                                <option>Chọn khung giờ</option>
                                {TIME_SLOTS.map(slot => (
                                    <option key={slot.id} value={slot.label}>
                                        {slot.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Số lượng</label>
                            <Input
                                type="number"
                                value={outputQuantity}
                                onChange={(e) => setOutputQuantity(parseInt(e.target.value) || 0)}
                                min={0}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleUpdateOutput} className="w-full">
                            Cập nhật sản lượng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}