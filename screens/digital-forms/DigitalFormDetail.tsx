"use client"
import type React from "react"
import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { RecordStatus, ShiftType, AttendanceStatus, STANDARD_TIME_INTERVALS } from "@/common/types/digital-form"
import { DataTable } from "@/components/common/table/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { useDigitalForms } from "@/hooks/digital-form/useDigitalForms"
import FormEntryModal from "./FormEntryModal"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useDigitalFormContext } from "@/hooks/digital-form/DigitalFormContext"

const STATUS_LABELS: Record<RecordStatus, string> = {
    [RecordStatus.DRAFT]: "Nháp",
    [RecordStatus.PENDING]: "Chờ duyệt",
    [RecordStatus.CONFIRMED]: "Đã duyệt",
    [RecordStatus.REJECTED]: "Bị từ chối",
}

const STATUS_COLORS: Record<RecordStatus, string> = {
    [RecordStatus.DRAFT]: "bg-blue-100 text-blue-800",
    [RecordStatus.PENDING]: "bg-orange-100 text-orange-800",
    [RecordStatus.CONFIRMED]: "bg-green-100 text-green-800",
    [RecordStatus.REJECTED]: "bg-red-100 text-red-800",
}

const SHIFT_LABELS: Record<ShiftType, string> = {
    [ShiftType.REGULAR]: "Ca Chính (7h30-16h30)",
    [ShiftType.EXTENDED]: "Ca Kéo Dài (16h30-18h)",
    [ShiftType.OVERTIME]: "Ca Tăng Ca (18h-20h)",
}

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: "Có mặt",
    [AttendanceStatus.ABSENT]: "Vắng mặt",
    [AttendanceStatus.LATE]: "Đi muộn",
    [AttendanceStatus.EARLY_LEAVE]: "Về sớm",
    [AttendanceStatus.LEAVE_APPROVED]: "Nghỉ phép",
}

const DigitalFormDetail: React.FC = () => {
    const router = useRouter()
    const { id } = router.query || {}
    const [activeTab, setActiveTab] = useState("entries")
    const [isEntryModalVisible, setIsEntryModalVisible] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<any>(null)
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
    } = useDigitalFormContext()

    const { data, isLoading, error, refetch } = useDigitalForms().getFormWithEntries(id as string)
    const form = useMemo(() => data?.data?.form, [data])
    const entries = useMemo(() => data?.data?.entries || [], [data])

    const handleAddEntry = useCallback(() => {
        setSelectedEntry(null)
        setIsEntryModalVisible(true)
    }, [])

    const handleEditEntry = useCallback((entry: any) => {
        setSelectedEntry(entry)
        setIsEntryModalVisible(true)
    }, [])

    const handleSaveEntry = useCallback(
        async (formData: any) => {
            try {
                await addFormEntry(id as string, formData)
                setIsEntryModalVisible(false)
                await refetch()
                toast({ title: "Thành công", description: "Đã lưu dữ liệu công nhân." })
                return true
            } catch (err) {
                toast({ title: "Lỗi", description: "Không thể lưu dữ liệu.", variant: "destructive" })
                return false
            }
        },
        [addFormEntry, id, refetch],
    )

    const handleDeleteEntry = useCallback(
        async (entryId: string) => {
            try {
                await deleteFormEntry(id as string, entryId)
                await refetch()
                toast({ title: "Thành công", description: "Đã xóa dữ liệu công nhân." })
                return true
            } catch (err) {
                toast({ title: "Lỗi", description: "Không thể xóa dữ liệu.", variant: "destructive" })
                return false
            }
        },
        [deleteFormEntry, id, refetch],
    )

    const handleSubmitForm = useCallback(async () => {
        try {
            await submitForm(id as string)
            await refetch()
            toast({ title: "Thành công", description: "Đã gửi phiếu để phê duyệt." })
        } catch (err) {
            toast({ title: "Lỗi", description: "Không thể gửi phiếu.", variant: "destructive" })
        }
    }, [submitForm, id, refetch])

    const handleApproveForm = useCallback(async () => {
        try {
            await approveForm(id as string)
            await refetch()
            toast({ title: "Thành công", description: "Đã phê duyệt phiếu." })
        } catch (err) {
            toast({ title: "Lỗi", description: "Không thể phê duyệt.", variant: "destructive" })
        }
    }, [approveForm, id, refetch])

    const handleRejectForm = useCallback(async () => {
        try {
            await rejectForm(id as string)
            await refetch()
            toast({ title: "Thành công", description: "Đã từ chối phiếu." })
        } catch (err) {
            toast({ title: "Lỗi", description: "Không thể từ chối.", variant: "destructive" })
        }
    }, [rejectForm, id, refetch])

    const handlePrintForm = useCallback(() => {
        window.open(`/digital-forms/${id}/print`, "_blank")
    }, [id])

    const timeIntervals = useMemo(() => {
        if (!form?.shiftType) return []
        return form.shiftType === ShiftType.REGULAR
            ? STANDARD_TIME_INTERVALS.slice(0, 9)
            : form.shiftType === ShiftType.EXTENDED
                ? STANDARD_TIME_INTERVALS.slice(8, 11)
                : STANDARD_TIME_INTERVALS.slice(10, 13)
    }, [form?.shiftType])

    const columns: ColumnDef<any>[] = useMemo(
        () => [
            { accessorKey: "worker", header: "Công nhân", cell: ({ row }) => row.original.worker?.fullName || "N/A" },
            { accessorKey: "handBag", header: "Túi xách", cell: ({ row }) => row.original.handBag?.name || "N/A" },
            { accessorKey: "bagColor", header: "Màu", cell: ({ row }) => row.original.bagColor?.colorName || "N/A" },
            { accessorKey: "process", header: "Công đoạn", cell: ({ row }) => row.original.process?.name || "N/A" },
            ...timeIntervals.map((interval) => ({
                accessorKey: `hourlyData.${interval.label}`,
                header: interval.label,
                cell: ({ row }) => row.original.hourlyData?.[interval.label] ?? 0,
            })),
            { accessorKey: "totalOutput", header: "Tổng", cell: ({ row }) => row.original.totalOutput },
            {
                accessorKey: "attendanceStatus",
                header: "Trạng thái",
                cell: ({ row }) => ATTENDANCE_LABELS[row.original.attendanceStatus] || "N/A",
            },
        ],
        [timeIntervals],
    )

    const entriesData = useMemo(
        () =>
            entries.map((entry) => ({
                ...entry,
                worker: { fullName: `Công nhân ${entry.userId.substring(0, 4)}` },
                handBag: { name: `Túi ${entry.handBagId.substring(0, 4)}` },
                bagColor: { colorName: `Màu ${entry.bagColorId.substring(0, 4)}` },
                process: { name: `Công đoạn ${entry.processId.substring(0, 4)}` },
            })),
        [entries],
    )

    const renderStatusBadge = useCallback(
        (status: RecordStatus) => {
            const color = getStatusColor(status)
            const label = getStatusLabel(status)
            return <span className={`text-sm px-3 py-1 rounded-full bg-${color}-100 text-${color}-800`}>{label}</span>
        },
        [getStatusColor, getStatusLabel],
    )

    if (isLoading || isLoadingAny)
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        )
    if (error) return <div className="py-8 text-center">Lỗi: {error.message}</div>
    if (!form) return <div className="py-8 text-center">Không tìm thấy phiếu công đoạn</div>

    const canEdit = form.status === RecordStatus.DRAFT
    const canSubmit = canEdit && entries.length > 0
    const canApproveOrReject = form.status === RecordStatus.PENDING

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold">
                    {form.formName} {renderStatusBadge(form.status)}
                </h1>
                <div className="flex flex-wrap gap-2">
                    {canEdit && <Button onClick={handleAddEntry}>Thêm dữ liệu</Button>}
                    {canSubmit && (
                        <Button onClick={handleSubmitForm} disabled={isLoadingAny}>
                            {isLoadingAny ? "Đang gửi..." : "Gửi phê duyệt"}
                        </Button>
                    )}
                    {canApproveOrReject && (
                        <>
                            <Button onClick={handleApproveForm} disabled={isLoadingAny}>
                                Phê duyệt
                            </Button>
                            <Button variant="destructive" onClick={handleRejectForm} disabled={isLoadingAny}>
                                Từ chối
                            </Button>
                        </>
                    )}
                    <Button variant="outline" onClick={handlePrintForm}>
                        In phiếu
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/digital-forms")}>
                        Quay lại
                    </Button>
                </div>
            </div>
            <Card>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <h3 className="text-sm text-gray-500">Mã phiếu</h3>
                        <p>{form.formCode}</p>
                    </div>
                    <div>
                        <h3 className="text-sm text-gray-500">Ngày</h3>
                        <p>{format(new Date(form.date), "dd/MM/yyyy")}</p>
                    </div>
                    <div>
                        <h3 className="text-sm text-gray-500">Ca làm việc</h3>
                        <p>{getShiftLabel(form.shiftType)}</p>
                    </div>
                    <div>
                        <h3 className="text-sm text-gray-500">Người tạo</h3>
                        <p>{form.createdById}</p>
                    </div>
                </CardContent>
            </Card>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList>
                    <TabsTrigger value="entries">Dữ liệu công nhân</TabsTrigger>
                </TabsList>
                <TabsContent value="entries">
                    <DataTable
                        columns={columns}
                        data={entriesData}
                        actions={canEdit ? ["edit", "delete"] : []}
                        onEdit={handleEditEntry}
                        onDelete={handleDeleteEntry}
                    />
                </TabsContent>
            </Tabs>
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
        </div>
    )
}

export default DigitalFormDetail
