"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { DialogChildrenProps, DialogType, useDialog } from "@/context/DialogProvider";
import { Calendar, Download, LucideEdit, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WorkLog, useWorkLogService } from "./workLogService";
import WorkLogForm, { WorkLogFormValues } from "./WorkLogForm";

const WorkLogContainer: React.FC = () => {
    // Use service to manage worklogs
    const {
        workLogs,
        createWorkLog,
        updateWorkLog,
        deleteWorkLog,
        loading,
        pagination,
        updatePagination,
        fetchWorkLogs,
        exportToPDF,
        exportToExcel
    } = useWorkLogService();

    // Dialog context
    const { showDialog, hideDialog } = useDialog();

    // State for export format
    const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

    // Handle pagination change
    const handlePageChange = useCallback((pageIndex: number, pageSize: number) => {
        updatePagination(pageIndex + 1, pageSize);
    }, [updatePagination]);

    // Format date for display
    const formatDate = useCallback((dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }, []);

    // Format working time
    const formatWorkingTime = useCallback((code: string) => {
        switch (code) {
            case "8_hours":
                return "8 tiếng";
            case "9.5_hours":
                return "9 tiếng 30 phút";
            case "11_hours":
                return "11 tiếng";
            default:
                return code;
        }
    }, []);

    // Define status label
    const getStatusLabel = useCallback((status: string) => {
        switch (status) {
            case "pending":
                return "Chờ duyệt";
            case "approved":
                return "Đã duyệt";
            case "rejected":
                return "Từ chối";
            default:
                return status;
        }
    }, []);

    // Define status color
    const getStatusColor = useCallback((status: string) => {
        switch (status) {
            case "pending":
                return { bg: "bg-yellow-100", text: "text-yellow-800" };
            case "approved":
                return { bg: "bg-green-100", text: "text-green-800" };
            case "rejected":
                return { bg: "bg-red-100", text: "text-red-800" };
            default:
                return { bg: "bg-gray-100", text: "text-gray-800" };
        }
    }, []);

    // Handle form submit
    const handleWorkLogFormSubmit = useCallback(async (data: WorkLogFormValues): Promise<boolean> => {
        try {
            if (data.id) {
                // Update existing worklog
                await updateWorkLog(data.id, data as Partial<WorkLog>);
                toast({
                    title: "Cập nhật thành công",
                    description: "Báo cáo sản lượng đã được cập nhật"
                });
            } else {
                // Create new worklog
                await createWorkLog(data as any);
                toast({
                    title: "Tạo mới thành công",
                    description: "Báo cáo sản lượng đã được tạo"
                });
            }

            hideDialog();
            // Reload data
            fetchWorkLogs();

            return true;
        } catch (error) {
            console.error("Lỗi khi gửi form:", error);
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi lưu báo cáo",
                variant: "destructive"
            });
            return false;
        }
    }, [createWorkLog, updateWorkLog, fetchWorkLogs]);

    // Handle worklog delete
    const handleWorkLogDelete = useCallback(async (id: string): Promise<void> => {
        try {
            await deleteWorkLog(id);
            toast({
                title: "Xóa thành công",
                description: "Báo cáo sản lượng đã được xóa"
            });
            fetchWorkLogs();
        } catch (error) {
            console.error("Lỗi khi xóa:", error);
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi xóa báo cáo",
                variant: "destructive"
            });
        }
    }, [deleteWorkLog, fetchWorkLogs]);

    // Handle export
    const handleExport = useCallback((workLog: WorkLog) => {
        try {
            if (exportFormat === "pdf") {
                exportToPDF(workLog);
            } else {
                exportToExcel(workLog);
            }

            toast({
                title: "Xuất báo cáo thành công",
                description: `Báo cáo đã được xuất dạng ${exportFormat.toUpperCase()}`
            });
        } catch (error) {
            toast({
                title: "Lỗi xuất báo cáo",
                description: error instanceof Error ? error.message : "Có lỗi xảy ra khi xuất báo cáo",
                variant: "destructive"
            });
        }
    }, [exportFormat, exportToPDF, exportToExcel]);





    const handleExportPDF = async (workLog: WorkLog) => {
        try {
            // Set loading state
            const loadingToast = toast({
                title: "Đang xuất PDF",
                description: "Đang xử lý...",
            });

            const res = await fetch("/api/export-worklog-pdf", {
                method: "POST",
                body: JSON.stringify(workLog),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            // Remove loading toast
            toast.dismiss(loadingToast);

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                console.error("PDF export error:", errorData);
                throw new Error(errorData?.details || "Xuất PDF thất bại");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            // Open PDF in new tab instead of downloading
            window.open(url, '_blank');

            // Also provide download option
            const link = document.createElement("a");
            link.href = url;
            link.download = `baocao-sanluong-${workLog.employeeName.replace(/\s+/g, '-')}.pdf`;
            link.click();

            // Success notification
            toast({
                title: "Xuất PDF thành công",
                description: "PDF đã được tạo thành công",
            });
        } catch (error) {
            console.error("Lỗi xuất PDF:", error);
            toast({
                title: "Lỗi xuất PDF",
                description: error instanceof Error ? error.message : "Không thể xuất PDF",
                variant: "destructive"
            });
        }
    };


    // Define table columns
    const columns: ColumnDef<WorkLog>[] = useMemo(() => [
        {
            id: "employeeName",
            header: "Tên nhân viên",
            cell: ({ row }) => {
                const workLog = row.original;
                return (
                    <div className="flex flex-col">
                        <div className="font-medium">{workLog.employeeName}</div>
                        <div className="text-sm text-muted-foreground">{workLog.employeeCode}</div>
                    </div>
                );
            },
            accessorKey: "employeeName",
        },
        {
            id: "department",
            header: "Đơn vị",
            cell: ({ row }) => row.original.department,
            accessorKey: "department",
        },
        {
            id: "date",
            header: "Ngày",
            cell: ({ row }) => {
                const date = row.original.date;
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(date)}</span>
                    </div>
                );
            },
            accessorKey: "date",
        },
        {
            id: "workingTime",
            header: "Thời gian làm việc",
            cell: ({ row }) => formatWorkingTime(row.original.workingTime),
            accessorKey: "workingTime",
        },
        {
            id: "operationName",
            header: "Công đoạn",
            cell: ({ row }) => row.original.operationName,
            accessorKey: "operationName",
        },
        {
            id: "totalProduction",
            header: "Sản lượng",
            cell: ({ row }) => (
                <div className="text-center font-medium">{row.original.totalProduction}</div>
            ),
            accessorKey: "totalProduction",
        },
        {
            id: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.original.status;
                const { bg, text } = getStatusColor(status);
                return (
                    <Badge className={`${bg} ${text}`}>
                        {getStatusLabel(status)}
                    </Badge>
                );
            },
            accessorKey: "status",
        },
        {
            id: "export",
            header: "Xuất",
            cell: ({ row }) => {
                const workLog = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Download className="h-4 w-4" />
                                <span>Xuất</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    setExportFormat("pdf");
                                    handleExport(workLog);
                                    handleExportPDF(workLog);
                                }}
                            >
                                PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setExportFormat("excel");
                                    handleExport(workLog);
                                }}
                            >
                                Excel
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [formatDate, formatWorkingTime, getStatusColor, getStatusLabel, handleExport]);

    // Create component functions that match the DialogChildrenProps interface
    const createFormComponent = useCallback((props: DialogChildrenProps<any>) => {
        return <WorkLogForm onSubmit={handleWorkLogFormSubmit} />;
    }, [handleWorkLogFormSubmit]);

    const editFormComponent = useCallback((props: DialogChildrenProps<any>) => {
        const { data } = props;
        return <WorkLogForm
            isEdit={true}
            defaultValues={data}
            onSubmit={handleWorkLogFormSubmit}
        />;
    }, [handleWorkLogFormSubmit]);

    const viewFormComponent = useCallback((props: DialogChildrenProps<any>) => {
        const { data } = props;
        return <WorkLogForm
            isReadOnly={true}
            defaultValues={data}
        />;
    }, []);

    // Create new worklog handler - used for direct button handler
    const handleCreateNew = useCallback(() => {
        showDialog({
            type: DialogType.CREATE,
            title: "Thêm mới báo cáo sản lượng",
            children: <WorkLogForm onSubmit={handleWorkLogFormSubmit} />
        });
    }, [showDialog, handleWorkLogFormSubmit]);

    // Edit worklog handler - used for direct access
    const handleEditWorkLog = useCallback((data: WorkLog) => {
        showDialog({
            type: DialogType.EDIT,
            title: "Chỉnh sửa báo cáo sản lượng",
            data,
            children: (
                <WorkLogForm
                    isEdit={true}
                    defaultValues={data}
                    onSubmit={handleWorkLogFormSubmit}
                />
            )
        });
    }, [showDialog, handleWorkLogFormSubmit]);

    // View worklog handler - used for direct access
    const handleViewWorkLog = useCallback((data: WorkLog) => {
        showDialog({
            type: DialogType.VIEW,
            title: "Xem báo cáo sản lượng",
            data,
            children: (
                <WorkLogForm
                    isReadOnly={true}
                    defaultValues={data}
                />
            )
        });
    }, [showDialog]);


    return (
        <div className="container mx-auto py-6">
            <DataTable
                columns={columns}
                data={workLogs}
                title="Quản lý báo cáo sản lượng"
                description="Quản lý và theo dõi sản lượng theo từng khung giờ"
                searchColumn="employeeName"
                searchPlaceholder="Tìm kiếm theo tên, mã nhân viên..."
                isLoading={loading}
                serverSidePagination={true}
                totalItems={pagination.total}
                initialPageIndex={Math.max(0, (pagination.page || 1) - 1)}
                initialPageSize={pagination.limit || 10}
                onPageChange={handlePageChange}
                actions={["create", "edit", "delete", "read-only"]}
                createFormComponent={createFormComponent}
                editFormComponent={editFormComponent}
                viewFormComponent={viewFormComponent}
                createClickAction={handleCreateNew}
                editClickAction={handleEditWorkLog}
                viewClickAction={handleViewWorkLog}
                refetchData={fetchWorkLogs}
                onDelete={handleWorkLogDelete}
                exportData={true}
                exportFormats={["pdf", "excel"]}
            />
        </div>
    );
};

export default WorkLogContainer;