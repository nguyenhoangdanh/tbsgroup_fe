// screens/digital-form/ViewForm.tsx
"use client"

import { useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import {
    Loader2,
    ArrowLeft,
    Edit,
    Trash2,
    File,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Users,
    Calendar,
    BarChart4
} from "lucide-react"
import { RecordStatus, AttendanceStatus } from "@/common/types/digital-form"
import { useDigitalFormQueries, useDigitalFormStats } from "@/hooks/digital-form"
import useDigitalFormManager from "@/hooks/digital-form/useDigitalFormManager"
import { useToast } from "@/hooks/use-toast"

export default function ViewDigitalForm() {
    const router = useRouter()
    const params = useParams()
    const formId = typeof params?.formId === 'string' ? params.formId : ''

    const { toast } = useToast()
    const formManager = useDigitalFormManager()
    const { getFormWithEntries } = useDigitalFormQueries()

    const [activeTab, setActiveTab] = useState("details")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [approveDialogOpen, setApproveDialogOpen] = useState(false)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isApproving, setIsApproving] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)

    // Get form data with entries
    const {
        data: formWithEntries,
        isLoading,
        isError,
        refetch
    } = getFormWithEntries(formId, { enabled: !!formId })

    // Calculate stats if form data is available
    const { stats } = useDigitalFormStats(
        formWithEntries?.form,
        formWithEntries?.entries
    )

    // Check permissions for actions
    const canEdit = formWithEntries?.form.status === RecordStatus.DRAFT
    const canDelete = formWithEntries?.form.status === RecordStatus.DRAFT ||
        formWithEntries?.form.status === RecordStatus.REJECTED
    const canApprove = formWithEntries?.form.status === RecordStatus.PENDING
    const canReject = formWithEntries?.form.status === RecordStatus.PENDING

    // Handle navigation back to list
    const handleBackToList = () => {
        router.push('/digital-forms')
    }

    // Handle navigation to edit page
    const handleEdit = () => {
        router.push(`/digital-forms/${formId}/edit`)
    }

    // Handle delete form
    const handleDelete = async () => {
        if (!formId) return

        setIsDeleting(true)
        try {
            const success = await formManager.deleteForm(formId)

            if (success) {
                toast({
                    title: "Thành công",
                    description: "Đã xóa biểu mẫu thành công",
                })
                // Navigate back to the list
                router.push('/digital-forms')
            } else {
                throw new Error("Không thể xóa biểu mẫu")
            }
        } catch (error) {
            console.error("Error deleting form:", error)
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa biểu mẫu",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
        }
    }

    // Handle approve form
    const handleApprove = async () => {
        if (!formId) return

        setIsApproving(true)
        try {
            // Using the approve functionality from the form manager
            const success = await formManager.crudHandlers.handleApproveForm(formId)

            if (success) {
                toast({
                    title: "Thành công",
                    description: "Đã phê duyệt biểu mẫu thành công",
                })
                // Refresh the form data
                refetch()
            } else {
                throw new Error("Không thể phê duyệt biểu mẫu")
            }
        } catch (error) {
            console.error("Error approving form:", error)
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi phê duyệt biểu mẫu",
                variant: "destructive",
            })
        } finally {
            setIsApproving(false)
            setApproveDialogOpen(false)
        }
    }

    // Handle reject form
    const handleReject = async () => {
        if (!formId) return

        setIsRejecting(true)
        try {
            // Using the reject functionality from the form manager
            const success = await formManager.crudHandlers.handleRejectForm(formId)

            if (success) {
                toast({
                    title: "Thành công",
                    description: "Đã từ chối biểu mẫu thành công",
                })
                // Refresh the form data
                refetch()
            } else {
                throw new Error("Không thể từ chối biểu mẫu")
            }
        } catch (error) {
            console.error("Error rejecting form:", error)
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi từ chối biểu mẫu",
                variant: "destructive",
            })
        } finally {
            setIsRejecting(false)
            setRejectDialogOpen(false)
        }
    }

    // Handle export form
    const handleExport = () => {
        // Implement export functionality
        toast({
            title: "Chức năng xuất báo cáo",
            description: "Chức năng xuất báo cáo sẽ được triển khai trong phiên bản tới",
        })
    }

    // Helper function to format date
    const formatDisplayDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'dd MMMM yyyy', { locale: vi })
        } catch (error) {
            return 'Không hợp lệ'
        }
    }

    // Get status badge
    const getStatusBadge = (status: RecordStatus) => {
        switch (status) {
            case RecordStatus.DRAFT:
                return <Badge variant="outline" className="bg-gray-100">Nháp</Badge>
            case RecordStatus.PENDING:
                return <Badge variant="outline" className="bg-amber-100 text-amber-700">Chờ duyệt</Badge>
            case RecordStatus.CONFIRMED:
                return <Badge variant="outline" className="bg-green-100 text-green-700">Đã duyệt</Badge>
            case RecordStatus.REJECTED:
                return <Badge variant="outline" className="bg-red-100 text-red-700">Từ chối</Badge>
            default:
                return null
        }
    }

    // Get attendance status badge
    const getAttendanceStatusBadge = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT:
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Có mặt</Badge>
            case AttendanceStatus.ABSENT:
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Vắng mặt</Badge>
            case AttendanceStatus.LATE:
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Đi muộn</Badge>
            case AttendanceStatus.EARLY_LEAVE:
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Về sớm</Badge>
            case AttendanceStatus.LEAVE_APPROVED:
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Nghỉ phép</Badge>
            default:
                return null
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Đang tải dữ liệu...</p>
            </div>
        )
    }

    if (isError || !formWithEntries) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <p className="text-red-500 mb-4">Không thể tải dữ liệu biểu mẫu</p>
                <Button onClick={handleBackToList}>Quay lại danh sách</Button>
            </div>
        )
    }

    const { form, entries } = formWithEntries

    return (
        <main className="container max-w-6xl mx-auto p-4 pb-24">
            <div className="mb-4 flex items-center justify-between">
                <Button variant="ghost" onClick={handleBackToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại danh sách
                </Button>

                <div className="flex space-x-2">
                    {canEdit && (
                        <Button variant="outline" onClick={handleEdit}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                        </Button>
                    )}

                    {canDelete && (
                        <Button variant="outline" className="text-red-500" onClick={() => setDeleteDialogOpen(true)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                        </Button>
                    )}

                    <Button variant="outline" onClick={handleExport}>
                        <FileText className="h-4 w-4 mr-2" />
                        Xuất báo cáo
                    </Button>

                    {canApprove && (
                        <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => setApproveDialogOpen(true)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Phê duyệt
                        </Button>
                    )}

                    {canReject && (
                        <Button variant="default" className="bg-red-600 hover:bg-red-700" onClick={() => setRejectDialogOpen(true)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Từ chối
                        </Button>
                    )}
                </div>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{form.formName || 'Biểu mẫu số'}</CardTitle>
                            <p className="text-sm text-muted-foreground">Mã: {form.formCode}</p>
                        </div>
                        <div>{getStatusBadge(form.status)}</div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-4 w-4" /> Ngày
                            </p>
                            <p className="font-medium">{formatDisplayDate(form.date)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-4 w-4" /> Trạng thái
                            </p>
                            <p className="font-medium">
                                {form.status === RecordStatus.DRAFT ? 'Nháp' :
                                    form.status === RecordStatus.PENDING ? 'Chờ duyệt' :
                                        form.status === RecordStatus.CONFIRMED ? 'Đã duyệt' :
                                            form.status === RecordStatus.REJECTED ? 'Từ chối' : ''}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-4 w-4" /> Người tạo
                            </p>
                            <p className="font-medium">{form.createdByName || "—"}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Users className="h-4 w-4" /> Số lượng công nhân
                            </p>
                            <p className="font-medium">{entries.length}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Nhà máy</p>
                            <p className="font-medium">{form.factoryName || "—"}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Dây chuyền</p>
                            <p className="font-medium">{form.lineName || "—"}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Tổ</p>
                            <p className="font-medium">{form.teamName || "—"}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Nhóm</p>
                            <p className="font-medium">{form.groupName || "—"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="mb-4">
                    <TabsTrigger value="details">Chi tiết</TabsTrigger>
                    <TabsTrigger value="workers">Danh sách công nhân</TabsTrigger>
                    <TabsTrigger value="stats">Thống kê</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium">Mô tả</h3>
                                    <p className="text-muted-foreground">{form.description || "Không có mô tả"}</p>
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="font-medium mb-2">Lịch sử thay đổi</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Thời gian tạo</p>
                                                <p>{format(parseISO(form.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Thời gian cập nhật</p>
                                                <p>{format(parseISO(form.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                                            </div>
                                            {form.submitTime && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Thời gian gửi</p>
                                                    <p>{format(parseISO(form.submitTime), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                                                </div>
                                            )}
                                            {form.approvedAt && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Thời gian phê duyệt</p>
                                                    <p>{format(parseISO(form.approvedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="workers">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Danh sách công nhân ({entries.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {entries.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tên công nhân</TableHead>
                                                <TableHead>Mã số</TableHead>
                                                <TableHead>Trạng thái</TableHead>
                                                <TableHead>Quy trình</TableHead>
                                                <TableHead>Màu sắc</TableHead>
                                                <TableHead className="text-right">Sản lượng</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {entries.map((entry) => (
                                                <TableRow key={entry.id}>
                                                    <TableCell className="font-medium">{entry.userName || "—"}</TableCell>
                                                    <TableCell>{entry.userCode || "—"}</TableCell>
                                                    <TableCell>{getAttendanceStatusBadge(entry.attendanceStatus)}</TableCell>
                                                    <TableCell>{entry.processName || "—"}</TableCell>
                                                    <TableCell>{entry.bagColorName || "—"}</TableCell>
                                                    <TableCell className="text-right">{entry.totalOutput}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Chưa có dữ liệu công nhân trong biểu mẫu này
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart4 className="h-5 w-5" /> Thống kê
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Tổng sản lượng</p>
                                    <p className="text-2xl font-bold">{stats.totalOutput}</p>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Sản lượng trung bình</p>
                                    <p className="text-2xl font-bold">{Math.round(stats.averageOutput * 100) / 100}</p>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Tỷ lệ có mặt</p>
                                    <p className="text-2xl font-bold">{Math.round(stats.presentPercentage)}%</p>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Chất lượng trung bình</p>
                                    <p className="text-2xl font-bold">{Math.round(stats.averageQuality)}%</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium mb-2">Thống kê chuyên cần</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="h-4 w-4 text-green-500" /> Có mặt
                                            </span>
                                            <span className="font-medium">{stats.present}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-1">
                                                <XCircle className="h-4 w-4 text-red-500" /> Vắng mặt
                                            </span>
                                            <span className="font-medium">{stats.absent}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-4 w-4 text-amber-500" /> Đi muộn
                                            </span>
                                            <span className="font-medium">{stats.late}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-4 w-4 text-amber-500" /> Về sớm
                                            </span>
                                            <span className="font-medium">{stats.earlyLeave}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-4 w-4 text-blue-500" /> Nghỉ phép
                                            </span>
                                            <span className="font-medium">{stats.leaveApproved}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-2">Thống kê theo giờ</h3>
                                    <div className="space-y-2">
                                        {stats.hourlyStats && stats.hourlyStats.map((hourStat) => (
                                            <div key={hourStat.hour} className="flex justify-between items-center">
                                                <span>{hourStat.hour}</span>
                                                <span className="font-medium">{hourStat.totalOutput}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa biểu mẫu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa biểu mẫu này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Xác nhận xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Approve Confirmation Dialog */}
            <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận phê duyệt biểu mẫu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn phê duyệt biểu mẫu này? Sau khi phê duyệt, biểu mẫu sẽ chuyển sang trạng thái Đã duyệt.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                            {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Xác nhận phê duyệt
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reject Confirmation Dialog */}
            <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận từ chối biểu mẫu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn từ chối biểu mẫu này? Sau khi từ chối, biểu mẫu sẽ chuyển sang trạng thái Từ chối.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                            {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Xác nhận từ chối
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    )
}