"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, CheckCircle, Download, FileText, Printer, Send, XCircle } from "lucide-react";
import { RecordStatus, ShiftType, AttendanceStatus } from "@/common/types/digital-form";
import { useDigitalForms } from "@/hooks/digital-form/useDigitalForms";
import FormEntryModal from "./FormEntryModal";
import { toast } from "@/hooks/use-toast";
import { useDigitalFormContext } from "@/hooks/digital-form/DigitalFormContext";

// FormEntryCard component to display entries in a card format
const FormEntryCard: React.FC<{
    entry: any;
    onEdit: () => void;
    onDelete: () => void;
    isReadOnly: boolean;
}> = ({ entry, onEdit, onDelete, isReadOnly }) => {
    const getAttendanceStatusLabel = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT:
                return "Có mặt";
            case AttendanceStatus.ABSENT:
                return "Vắng mặt";
            case AttendanceStatus.LATE:
                return "Đi muộn";
            case AttendanceStatus.EARLY_LEAVE:
                return "Về sớm";
            case AttendanceStatus.LEAVE_APPROVED:
                return "Nghỉ phép";
            default:
                return status;
        }
    };

    const getAttendanceStatusColor = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT:
                return "bg-green-100 text-green-800";
            case AttendanceStatus.ABSENT:
                return "bg-red-100 text-red-800";
            case AttendanceStatus.LATE:
                return "bg-yellow-100 text-yellow-800";
            case AttendanceStatus.EARLY_LEAVE:
                return "bg-orange-100 text-orange-800";
            case AttendanceStatus.LEAVE_APPROVED:
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Calculate efficiency as a percentage 
    const efficiency = entry.hourlyData && Object.keys(entry.hourlyData).length > 0
        ? Math.round((entry.totalOutput / (Object.keys(entry.hourlyData).length * entry.process?.hourlyTarget || 1)) * 100)
        : 0;

    // Get efficiency color
    const getEfficiencyColor = (value: number) => {
        if (value >= 100) return "text-green-600";
        if (value >= 80) return "text-blue-600";
        if (value >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                        <h4 className="font-medium">{entry.worker?.fullName || 'N/A'}</h4>
                        <div className="text-sm text-gray-500">{entry.worker?.employeeId || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                        <Badge className={getAttendanceStatusColor(entry.attendanceStatus)}>
                            {getAttendanceStatusLabel(entry.attendanceStatus)}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                    <div>
                        <span className="font-medium">Túi:</span> {entry.handBag?.name || 'N/A'}
                    </div>
                    <div>
                        <span className="font-medium">Màu:</span> {entry.bagColor?.colorName || 'N/A'}
                    </div>
                    <div>
                        <span className="font-medium">Công đoạn:</span> {entry.process?.name || 'N/A'}
                    </div>
                    <div className="text-right md:text-left">
                        <span className="font-medium">Sản lượng:</span> {entry.totalOutput}
                    </div>
                </div>

                {/* Display efficiency if we have process with hourlyTarget */}
                {entry.process?.hourlyTarget && (
                    <div className="mb-3">
                        <span className="font-medium mr-2">Hiệu suất:</span>
                        <span className={`font-medium ${getEfficiencyColor(efficiency)}`}>
                            {efficiency}%
                        </span>
                    </div>
                )}

                {/* Action buttons */}
                {!isReadOnly && (
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onEdit}
                        >
                            Sửa
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-800"
                            onClick={onDelete}
                        >
                            Xóa
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export const DigitalFormDetail: React.FC<{ id?: string }> = ({ id: propId }) => {
    const router = useRouter();
    const { id: pathId } = (typeof window !== 'undefined') ?
        new URLSearchParams(window.location.search) : { id: null };

    // Use prop id if provided, otherwise try to get from URL
    const id = propId || pathId;

    const [activeTab, setActiveTab] = useState("entries");
    const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    // Context hooks
    const {
        fetchFormData,
        addFormEntry,
        deleteFormEntry,
        submitForm,
        approveForm,
        rejectForm,
        isLoadingAny,
        getStatusLabel,
        getStatusColor,
        getShiftLabel,
    } = useDigitalFormContext();

    // Get form data
    const { getFormWithEntries } = useDigitalForms();
    const { data, isLoading, error, refetch } = getFormWithEntries(id as string);

    // Extract form and entries from data
    const form = useMemo(() => data?.data?.form, [data]);
    const entries = useMemo(() => data?.data?.entries || [], [data]);

    // Handle adding a new entry
    const handleAddEntry = useCallback(() => {
        setSelectedEntry(null);
        setIsEntryModalVisible(true);
    }, []);

    // Handle editing an entry
    const handleEditEntry = useCallback((entry: any) => {
        setSelectedEntry(entry);
        setIsEntryModalVisible(true);
    }, []);

    // Handle saving an entry
    const handleSaveEntry = useCallback(
        async (formData: any) => {
            try {
                await addFormEntry(id as string, formData);
                setIsEntryModalVisible(false);
                await refetch();
                toast({ title: "Thành công", description: "Đã lưu dữ liệu công nhân." });
                return true;
            } catch (err) {
                toast({ title: "Lỗi", description: "Không thể lưu dữ liệu.", variant: "destructive" });
                return false;
            }
        },
        [addFormEntry, id, refetch, toast]
    );

    // Handle deleting an entry
    const handleDeleteEntry = useCallback(
        async (entryId: string) => {
            try {
                await deleteFormEntry(id as string, entryId);
                await refetch();
                toast({ title: "Thành công", description: "Đã xóa dữ liệu công nhân." });
                return true;
            } catch (err) {
                toast({ title: "Lỗi", description: "Không thể xóa dữ liệu.", variant: "destructive" });
                return false;
            }
        },
        [deleteFormEntry, id, refetch, toast]
    );

    // Handle submitting the form
    const handleSubmitForm = useCallback(async () => {
        try {
            await submitForm(id as string);
            await refetch();
            setIsSubmitDialogOpen(false);
            toast({ title: "Thành công", description: "Đã gửi phiếu để phê duyệt." });
        } catch (err) {
            toast({ title: "Lỗi", description: "Không thể gửi phiếu.", variant: "destructive" });
        }
    }, [submitForm, id, refetch, toast]);

    // Handle approving the form
    const handleApproveForm = useCallback(async () => {
        try {
            await approveForm(id as string);
            await refetch();
            setIsApproveDialogOpen(false);
            toast({ title: "Thành công", description: "Đã phê duyệt phiếu." });
        } catch (err) {
            toast({ title: "Lỗi", description: "Không thể phê duyệt.", variant: "destructive" });
        }
    }, [approveForm, id, refetch, toast]);

    // Handle rejecting the form
    const handleRejectForm = useCallback(async () => {
        try {
            await rejectForm(id as string);
            await refetch();
            setIsRejectDialogOpen(false);
            toast({ title: "Thành công", description: "Đã từ chối phiếu." });
        } catch (err) {
            toast({ title: "Lỗi", description: "Không thể từ chối.", variant: "destructive" });
        }
    }, [rejectForm, id, refetch, toast]);

    // Handle printing the form
    const handlePrintForm = useCallback(() => {
        window.open(`/digital-forms/${id}/print`, "_blank");
    }, [id]);

    // Return to list view
    const handleBackToList = useCallback(() => {
        router.push("/digital-forms");
    }, [router]);

    // Determine allowed actions based on form status
    const canEdit = form?.status === RecordStatus.DRAFT;
    const canSubmit = canEdit && entries.length > 0;
    const canApproveOrReject = form?.status === RecordStatus.PENDING;

    // Get status badge color based on form status
    const getStatusBadgeColor = (status?: RecordStatus) => {
        if (!status) return "";

        switch (status) {
            case RecordStatus.DRAFT:
                return "bg-blue-100 text-blue-800";
            case RecordStatus.PENDING:
                return "bg-yellow-100 text-yellow-800";
            case RecordStatus.CONFIRMED:
                return "bg-green-100 text-green-800";
            case RecordStatus.REJECTED:
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (isLoading || isLoadingAny)
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full"></div>
            </div>
        );

    if (error) return <div className="py-8 text-center">Lỗi: {error.message}</div>;
    if (!form) return <div className="py-8 text-center">Không tìm thấy phiếu công đoạn</div>;

    return (
        <div className="container mx-auto py-6">
            {/* Header with back button and title */}
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToList}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{form.formName}</h1>
                    <div className="flex items-center gap-2">
                        <Badge>{form.formCode}</Badge>
                        <Badge className={getStatusBadgeColor(form.status)}>
                            {getStatusLabel(form.status)}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Form details card */}
            <Card className="mb-6">
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <h3 className="text-sm text-gray-500">Ngày</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <p>{format(new Date(form.date), "dd/MM/yyyy")}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm text-gray-500">Ca làm việc</h3>
                        <p className="mt-1">{getShiftLabel(form.shiftType)}</p>
                    </div>
                    <div>
                        <h3 className="text-sm text-gray-500">Ngày tạo</h3>
                        <p className="mt-1">{format(new Date(form.createdAt), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                    <div>
                        <h3 className="text-sm text-gray-500">Người tạo</h3>
                        <p className="mt-1">{form.createdById}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                {canEdit && (
                    <Button
                        onClick={handleAddEntry}
                    >
                        Thêm dữ liệu
                    </Button>
                )}

                {canSubmit && (
                    <Button
                        variant="default"
                        onClick={() => setIsSubmitDialogOpen(true)}
                        disabled={isLoadingAny}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {isLoadingAny ? "Đang gửi..." : "Gửi phê duyệt"}
                    </Button>
                )}

                {canApproveOrReject && (
                    <>
                        <Button
                            variant="default"
                            onClick={() => setIsApproveDialogOpen(true)}
                            disabled={isLoadingAny}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Phê duyệt
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => setIsRejectDialogOpen(true)}
                            disabled={isLoadingAny}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Từ chối
                        </Button>
                    </>
                )}

                <Button
                    variant="outline"
                    onClick={handlePrintForm}
                >
                    <Printer className="h-4 w-4 mr-2" />
                    In phiếu
                </Button>

                <Button
                    variant="outline"
                    onClick={handleBackToList}
                >
                    Quay lại
                </Button>
            </div>

            {/* Main content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="entries">Dữ liệu công nhân</TabsTrigger>
                </TabsList>
                <TabsContent value="entries">
                    {entries.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 mb-4">Chưa có dữ liệu công nhân nào cho phiếu này</p>
                            {canEdit && (
                                <Button onClick={handleAddEntry}>
                                    Thêm dữ liệu công nhân
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {entries.map((entry) => (
                                <FormEntryCard
                                    key={entry.id}
                                    entry={entry}
                                    onEdit={() => handleEditEntry(entry)}
                                    onDelete={() => handleDeleteEntry(entry.id)}
                                    isReadOnly={!canEdit}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Entry modal */}
            {isEntryModalVisible && (
                <FormEntryModal
                    visible={isEntryModalVisible}
                    onCancel={() => setIsEntryModalVisible(false)}
                    onSave={handleSaveEntry}
                    entry={selectedEntry}
                    formId={id as string}
                    shiftType={form.shiftType}
                />
            )}

            {/* Submit dialog */}
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gửi phiếu công đoạn</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn gửi phiếu công đoạn này để phê duyệt? Sau khi gửi, bạn sẽ không thể chỉnh sửa phiếu nữa.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSubmitForm}>Gửi phê duyệt</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Phê duyệt phiếu công đoạn</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn phê duyệt phiếu công đoạn này? Dữ liệu sẽ được sử dụng để tính sản lượng và tiền lương.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleApproveForm}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Phê duyệt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối phiếu công đoạn</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn từ chối phiếu công đoạn này? Phiếu sẽ được chuyển về trạng thái từ chối và người tạo sẽ cần phải chỉnh sửa và gửi lại.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectForm}
                        >
                            Từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};