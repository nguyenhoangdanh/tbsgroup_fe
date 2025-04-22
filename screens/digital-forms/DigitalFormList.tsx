"use client"
import React, { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/common/table/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { type DigitalForm, RecordStatus } from "@/common/types/digital-form"
import { useDigitalForms } from "@/hooks/digital-form/useDigitalForms"
import { DatePicker } from "@/components/ui/date-picker"
import CreateFormModal from "./CreateFormModal"
import { toast } from "@/hooks/use-toast"
import { useDigitalFormContext } from "@/hooks/digital-form/DigitalFormContext"

const DigitalFormList: React.FC = () => {
    const router = useRouter()
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)

    // Sử dụng context thay vì hook trực tiếp
    const {
        filters,
        updateFilter,
        fetchForms,
        createForm,
        deleteForm,
        viewForm,
        isLoadingAny,
        formatDateString,
        getStatusLabel,
        getStatusColor,
        getShiftLabel,
    } = useDigitalFormContext()

    const { listForms, batchPrefetchForms } = useDigitalForms()
    const { data: formsData, isLoading } = listForms(filters);

    useEffect(() => {
        if (formsData?.data?.length) {
            const formIds = formsData.data.slice(0, 3).map((form) => form.id)
            batchPrefetchForms(formIds)
        }
    }, [formsData, batchPrefetchForms])

    // Xử lý tạo form mới
    const handleCreateForm = useCallback(
        async (formData: any) => {
            try {
                const result = await createForm(formData)
                setIsCreateModalVisible(false)
                if (result?.data?.id) viewForm(result.data.id)
                return true
            } catch (error) {
                toast({ title: "Lỗi", description: "Không thể tạo phiếu.", variant: "destructive" })
                return false
            }
        },
        [createForm, viewForm],
    )

    // Xử lý xóa form
    const handleDeleteForm = useCallback(
        async (id: string) => {
            try {
                await deleteForm(id)
                toast({ title: "Thành công", description: "Đã xóa phiếu." })
                return true
            } catch (error) {
                toast({ title: "Lỗi", description: "Không thể xóa phiếu.", variant: "destructive" })
                return false
            }
        },
        [deleteForm],
    )

    // Cập nhật columns để sử dụng các hàm helper từ context
    const columns: ColumnDef<DigitalForm>[] = useMemo(
        () => [
            {
                accessorKey: "formCode",
                header: "Mã phiếu",
                cell: ({ row }) => (
                    <div onClick={() => viewForm(row.original.id)} className="cursor-pointer text-blue-600">
                        {row.original.formCode}
                    </div>
                ),
            },
            { accessorKey: "formName", header: "Tên phiếu" },
            {
                accessorKey: "date",
                header: "Ngày",
                cell: ({ row }) => format(new Date(row.original.date), "dd/MM/yyyy"),
            },
            {
                accessorKey: "shiftType",
                header: "Ca làm việc",
                cell: ({ row }) => getShiftLabel(row.original.shiftType),
            },
            {
                accessorKey: "status",
                header: "Trạng thái",
                cell: ({ row }) => (
                    <div
                        className={`bg-${getStatusColor(row.original.status)}-500 text-white px-2 py-1 rounded-full text-xs text-center`}
                    >
                        {getStatusLabel(row.original.status)}
                    </div>
                ),
            },
            {
                accessorKey: "createdAt",
                header: "Ngày tạo",
                cell: ({ row }) => format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm"),
            },
        ],
        [viewForm, getShiftLabel, getStatusColor, getStatusLabel],
    )

    // Xử lý thay đổi trang
    const handlePageChange = useCallback(
        (pageIndex: number, pageSize: number) => {
            updateFilter("page", pageIndex + 1)
            updateFilter("limit", pageSize)
        },
        [updateFilter],
    )

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">Phiếu Công Đoạn</h1>
                <Button onClick={() => setIsCreateModalVisible(true)}>Tạo phiếu mới</Button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow mb-4">
                <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        placeholder="Tìm kiếm..."
                        value={filters.search || ""}
                        onChange={(e) => updateFilter("search", e.target.value)}
                    />
                    <DatePicker
                        value={filters.dateFrom}
                        onChange={(date) => updateFilter("dateFrom", date)}
                        placeholder="Từ ngày"
                    />
                    <DatePicker value={filters.dateTo} onChange={(date) => updateFilter("dateTo", date)} placeholder="Đến ngày" />
                    <Select
                        value={filters.status || "all"}
                        onValueChange={(value) => updateFilter("status", value === "all" ? undefined : (value as RecordStatus))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {Object.values(RecordStatus).map((status) => (
                                <SelectItem key={status} value={status}>
                                    {getStatusLabel(status)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DataTable
                columns={columns}
                title="Digital Form"
                data={formsData?.data || []}
                isLoading={isLoading || isLoadingAny}
                actions={["edit", "delete"]}
                onEdit={(data) => viewForm(data.id)}
                onDelete={handleDeleteForm}
                totalItems={formsData?.total || 0}
                onPageChange={handlePageChange}
                serverSidePagination
            />
            <CreateFormModal
                visible={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                onCreate={handleCreateForm}
                defaultFactoryId="b1a2ab78-e5fc-4e44-bb39-db59e0630251"
            />
        </div>
    )
}

export default React.memo(DigitalFormList)
