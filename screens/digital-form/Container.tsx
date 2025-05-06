// components/digital-form-container.tsx
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Worker } from "@/common/types/worker"
import { AttendanceStatus, RecordStatus } from "@/common/types/digital-form"
import { useForm } from "@/contexts/form-context"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Save, CheckCircle, Clock, AlertCircle, Filter, Users, ArrowUp, ArrowDown, ArrowLeft } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { TIME_SLOTS } from "@/common/constants/time-slots"
import { formatDate } from "@/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { WorkerFilter } from "./_components/worker-filter"
import { WorkerCard } from "./_components/woker-card"

interface DigitalFormContainerProps {
    formId?: string;
}

export default function DigitalFormContainer({ formId }: DigitalFormContainerProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { formData, error, currentTimeSlot, stats, submitFormData, refreshData } = useForm();
    const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
    const [filters, setFilters] = useState({
        search: "",
        status: "ALL" as AttendanceStatus | "ALL",
        sortBy: "name" as "name" | "employeeId" | "totalOutput",
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedStats, setExpandedStats] = useState(false);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);

    // Filter and sort workers when formData or filters change
    useEffect(() => {
        if (formData) {
            let workers = [...formData.workers];

            // Apply search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                workers = workers.filter(
                    (worker) =>
                        worker.name.toLowerCase().includes(searchLower) ||
                        worker.employeeId.toLowerCase().includes(searchLower)
                );
            }

            // Apply status filter
            if (filters.status !== "ALL") {
                workers = workers.filter((worker) => worker.attendanceStatus === filters.status);
            }

            // Apply sorting
            workers.sort((a, b) => {
                if (filters.sortBy === "name") {
                    return a.name.localeCompare(b.name);
                } else if (filters.sortBy === "employeeId") {
                    return a.employeeId.localeCompare(b.employeeId);
                } else {
                    return b.totalOutput - a.totalOutput;
                }
            });

            setFilteredWorkers(workers);
        }
    }, [formData, filters]);

    // Handle filter changes from filter component
    const handleFilterChange = useCallback((newFilters: {
        search: string;
        status: AttendanceStatus | "ALL";
        sortBy: "name" | "employeeId" | "totalOutput";
    }) => {
        setFilters(newFilters);
    }, []);

    // Handle refresh action
    const handleRefresh = useCallback(async () => {
        try {
            setIsRefreshing(true);
            await refreshData();
            toast({
                title: "Đã làm mới dữ liệu",
                description: "Dữ liệu biểu mẫu đã được cập nhật thành công",
            });
        } catch (err) {
            toast({
                title: "Lỗi làm mới dữ liệu",
                description: "Không thể làm mới dữ liệu. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [refreshData, toast]);

    // Handle form submission
    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        try {
            const success = await submitFormData();

            if (success) {
                toast({
                    title: "Gửi thành công",
                    description: "Biểu mẫu đã được gửi thành công",
                });
                setShowSubmitDialog(false);
            }
        } catch (err) {
            toast({
                title: "Lỗi gửi biểu mẫu",
                description: "Không thể gửi biểu mẫu. Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [submitFormData, toast]);

    // Navigate back to the list page
    const handleBackToList = useCallback(() => {
        router.push("/digital-forms");
    }, [router]);

    // Calculate attendance statistics
    const attendanceStats = useMemo(() => {
        if (!formData || !formData.workers || formData.workers.length === 0) {
            return {
                present: 0,
                absent: 0,
                late: 0,
                earlyLeave: 0,
                leaveApproved: 0,
                presentPercentage: 0
            };
        }

        const totalWorkers = formData.workers.length;
        const present = formData.workers.filter(w => w.attendanceStatus === AttendanceStatus.PRESENT).length;
        const absent = formData.workers.filter(w => w.attendanceStatus === AttendanceStatus.ABSENT).length;
        const late = formData.workers.filter(w => w.attendanceStatus === AttendanceStatus.LATE).length;
        const earlyLeave = formData.workers.filter(w => w.attendanceStatus === AttendanceStatus.EARLY_LEAVE).length;
        const leaveApproved = formData.workers.filter(w => w.attendanceStatus === AttendanceStatus.LEAVE_APPROVED).length;
        const presentPercentage = totalWorkers > 0 ? Math.round((present / totalWorkers) * 100) : 0;

        return {
            present,
            absent,
            late,
            earlyLeave,
            leaveApproved,
            presentPercentage
        };
    }, [formData]);

    // Calculate overall completion percentage
    const completionStats = useMemo(() => {
        if (!formData || formData.workers.length === 0) return {
            totalSlots: 0,
            filledSlots: 0,
            percentage: 0,
            totalOutput: 0,
            averageOutput: 0
        };

        const totalSlots = formData.workers.length * TIME_SLOTS.length;
        let filledSlots = 0;
        let totalOutput = 0;

        formData.workers.forEach((worker) => {
            filledSlots += Object.keys(worker.hourlyData || {}).length;
            totalOutput += worker.totalOutput || 0;
        });

        const percentage = Math.round((filledSlots / totalSlots) * 100);
        const averageOutput = formData.workers.length > 0 ? Math.round(totalOutput / formData.workers.length) : 0;

        return {
            totalSlots,
            filledSlots,
            percentage,
            totalOutput,
            averageOutput
        };
    }, [formData]);

    // Check if form can be submitted
    const canSubmitForm = useMemo(() => {
        if (!formData) return false;

        // Only DRAFT forms can be submitted
        return formData.status === RecordStatus.DRAFT;
    }, [formData]);


    // Show error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
                <p className="text-red-500 mb-2">Lỗi tải dữ liệu biểu mẫu</p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleBackToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <main className="container max-w-md mx-auto p-4 pb-24">
            {formData && (
                <>
                    {formId && (
                        <div className="mb-4">
                            <Button variant="ghost" onClick={handleBackToList}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Quay lại danh sách
                            </Button>
                        </div>
                    )}

                    <Card className="mb-6">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{formData.formName}</CardTitle>
                                    <CardDescription>Mã: {formData.formCode}</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                                    <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                                    {isRefreshing ? "Đang làm mới..." : "Làm mới"}
                                </Button>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-2">
                                <div>{formatDate(new Date(formData.date))}</div>
                                <Badge
                                    variant="outline"
                                    className={
                                        formData.status === RecordStatus.DRAFT
                                            ? "bg-gray-100"
                                            : formData.status === RecordStatus.PENDING
                                                ? "bg-amber-100 text-amber-700"
                                                : formData.status === RecordStatus.CONFIRMED
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                    }
                                >
                                    {formData.status === RecordStatus.DRAFT
                                        ? "Nháp"
                                        : formData.status === RecordStatus.PENDING
                                            ? "Chờ duyệt"
                                            : formData.status === RecordStatus.CONFIRMED
                                                ? "Đã duyệt"
                                                : "Từ chối"
                                    }
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="pb-3">
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm font-medium">Tiến độ nhập liệu</p>
                                    <span className="text-sm">{completionStats.percentage}%</span>
                                </div>
                                <Progress value={completionStats.percentage} className="h-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Có mặt: {attendanceStats.present}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    <span>Tổng: {formData.workers.length}</span>
                                </div>
                                {expandedStats && (
                                    <>
                                        <div className="flex items-center gap-1">
                                            <Filter className="h-4 w-4 text-amber-500" />
                                            <span>Đi muộn: {attendanceStats.late}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4 text-red-500" />
                                            <span>Vắng mặt: {attendanceStats.absent}</span>
                                        </div>
                                        <div className="col-span-2 text-center font-medium">
                                            Tổng sản lượng: {completionStats.totalOutput}
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 text-xs w-full"
                                onClick={() => setExpandedStats(!expandedStats)}
                            >
                                {expandedStats ? (
                                    <>
                                        <ArrowUp className="h-3 w-3 mr-1" /> Thu gọn thống kê
                                    </>
                                ) : (
                                    <>
                                        <ArrowDown className="h-3 w-3 mr-1" /> Xem thêm thống kê
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="mb-6">
                        <WorkerFilter onFilterChange={handleFilterChange} />
                    </div>

                    <div className="space-y-4 mb-20">
                        {filteredWorkers.length > 0 ? (
                            filteredWorkers.map((worker) => (
                                <WorkerCard
                                    key={worker.id}
                                    worker={worker}
                                    currentTimeSlot={currentTimeSlot}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Không tìm thấy công nhân nào</p>
                            </div>
                        )}
                    </div>

                    {/* Only show submit button for DRAFT forms */}
                    {canSubmitForm && (
                        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-center">
                            <Button
                                onClick={() => setShowSubmitDialog(true)}
                                disabled={isSubmitting || !canSubmitForm}
                                className="w-full max-w-md"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Lưu và gửi báo cáo
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Submit confirmation dialog */}
                    <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận gửi báo cáo</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bạn có chắc chắn muốn gửi biểu mẫu này? Sau khi gửi, biểu mẫu sẽ chuyển sang trạng thái chờ duyệt và không thể chỉnh sửa.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang gửi...
                                        </>
                                    ) : (
                                        "Xác nhận gửi"
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </main>
    );
}
