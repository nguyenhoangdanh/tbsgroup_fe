// components/digital-forms/DigitalFormDetail.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCustomDigitalForm } from "@/hooks/digital-form-hooks/useCustomDigitalForm-fixed";
import { TIME_SLOTS } from "@/common/constants/time-slots";
import { AttendanceStatus, RecordStatus } from "@/common/types/digital-form";
import { formatDate } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Loader2,
    RefreshCw,
    Save,
    FileCheck,
    FileX,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Edit,
    AlertCircle,
    CheckCircle,
    Clock,
    UserCircle,
    Calendar,
    Factory,
    Users,
    Briefcase,
    Search
} from "lucide-react";
import { UpdateProductionForm } from "./UpdateProductionForm";
import { WorkerStatusBadge } from "./WorkerStatusBadge";
import { TimeSlotStatus } from "./TimeSlotStatus";

interface DigitalFormDetailProps {
    formId: string;
}

/**
 * Component to display and interact with a single digital form
 * Uses optimized hooks for performance with 5000+ users
 */
export function DigitalFormDetail({ formId }: DigitalFormDetailProps) {
    const router = useRouter();

    // Use our custom digital form hook
    const {
        formData,
        loading,
        error,
        stats,
        currentTimeSlot,
        refreshData,
        submitFormData,
        updateHourlyData,
        updateAttendanceStatus,
        addIssue,
        removeIssue,
        approveForm,
        rejectForm
    } = useCustomDigitalForm(formId);

    // Local state
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    const [expandedWorkers, setExpandedWorkers] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState("all");
    const [searchValue, setSearchValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);

    // Get selected worker
    const selectedWorker = useMemo(() =>
        formData?.workers.find(worker => worker.id === selectedWorkerId) || null
        , [formData, selectedWorkerId]);

    // Toggle worker expansion
    const toggleWorkerExpand = useCallback((workerId: string) => {
        setExpandedWorkers(prev => ({
            ...prev,
            [workerId]: !prev[workerId]
        }));
    }, []);

    // Filter workers by tab and search
    const filteredWorkers = useMemo(() => {
        if (!formData || !formData.workers) return [];

        let workers = [...formData.workers];

        // Filter by tab
        if (activeTab !== "all") {
            workers = workers.filter(worker => worker.attendanceStatus === activeTab);
        }

        // Filter by search
        if (searchValue) {
            const searchLower = searchValue.toLowerCase();
            workers = workers.filter(
                worker =>
                    worker.name.toLowerCase().includes(searchLower) ||
                    worker.employeeId.toLowerCase().includes(searchLower)
            );
        }

        return workers;
    }, [formData, activeTab, searchValue]);

    // Get status for a time slot
    const getTimeSlotStatus = useCallback((worker, slot) => {
        if (worker.hourlyData[slot.label]) {
            return "completed";
        }

        if (slot.label === currentTimeSlot) {
            return "current";
        }

        // Check if this time slot is in the past but has no data
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

        if (currentTime > slot.end && !worker.hourlyData[slot.label]) {
            return "missing";
        }

        return "pending";
    }, [currentTimeSlot]);

    // Get status badge styling
    const getFormStatusBadge = (status: RecordStatus) => {
        switch (status) {
            case RecordStatus.DRAFT:
                return <Badge variant="outline" className="bg-gray-100">Nháp</Badge>;
            case RecordStatus.PENDING:
                return <Badge variant="outline" className="bg-amber-100 text-amber-700">Chờ duyệt</Badge>;
            case RecordStatus.CONFIRMED:
                return <Badge variant="outline" className="bg-green-100 text-green-700">Đã duyệt</Badge>;
            case RecordStatus.REJECTED:
                return <Badge variant="outline" className="bg-red-100 text-red-700">Từ chối</Badge>;
            default:
                return null;
        }
    };

    // Handle refresh data
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        setIsRefreshing(false);
    };

    // Handle form submission
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const success = await submitFormData();
            if (success) {
                setShowSubmitDialog(false);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle form approval
    const handleApprove = async () => {
        setIsApproving(true);
        try {
            await approveForm();
        } finally {
            setIsApproving(false);
        }
    };

    // Handle form rejection
    const handleReject = async () => {
        setIsRejecting(true);
        try {
            await rejectForm();
        } finally {
            setIsRejecting(false);
        }
    };

    // Handle navigation back to list
    const navigateToList = () => {
        router.push('/digital-forms');
    };

    // Show loading state
    if (loading && !formData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
                <p className="text-red-500 mb-2">Lỗi tải dữ liệu biểu mẫu</p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={navigateToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    // No data state
    if (!formData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <AlertCircle className="h-8 w-8 text-amber-500 mb-4" />
                <p className="mb-4">Không tìm thấy biểu mẫu</p>
                <Button onClick={navigateToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4">
                <Button variant="ghost" onClick={navigateToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại danh sách
                </Button>
            </div>

            {/* Form header */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl font-bold mb-1">{formData.formName}</CardTitle>
                            <div className="text-sm text-muted-foreground">Mã biểu mẫu: {formData.formCode}</div>
                        </div>
                        {getFormStatusBadge(formData.status)}
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-xs text-muted-foreground">Ngày</div>
                                <div className="font-medium">{formatDate(new Date(formData.date))}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Factory className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-xs text-muted-foreground">Xưởng/Dây chuyền</div>
                                <div className="font-medium">{formData.factoryName} / {formData.lineName}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-xs text-muted-foreground">Tổ/Nhóm</div>
                                <div className="font-medium">{formData.teamName} / {formData.groupName}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-xs text-muted-foreground">Tổng sản lượng</div>