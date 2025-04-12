"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { TimeSheetType } from "@/schemas/timesheet";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { getStatusColor, getStatusLabel } from "@/schemas/timesheet";
import { useTimeSheetContext } from "./TimeSheetContext";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportTimesheetToPDF, exportTimesheetToExcel } from "@/utils/timesheet-utils";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import TimeSheetForm from "./_components/TimeSheetForm";

const TimeSheetList = () => {
    // Use context for timesheet management
    const {
        timesheets,
        loading,
        pagination,
        createTimesheet,
        updateTimesheet,
        deleteTimesheet,
        setSelectedTimesheet,
        updatePagination,
        fetchTimesheets,
    } = useTimeSheetContext();

    const { toast } = useToast();

    // Dialog context
    const { showDialog } = useDialog();

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

    // Handle timesheet form submission
    const handleTimeSheetFormSubmit = useCallback(async (data: TimeSheetType): Promise<boolean> => {
        try {
            if (data.id) {
                // Update existing timesheet
                await updateTimesheet(data.id, data);
            } else {
                // Create new timesheet
                await createTimesheet(data);
            }

            return true; // Close dialog
        } catch (error) {
            console.error("Error submitting timesheet form:", error);
            return false;
        }
    }, [createTimesheet, updateTimesheet]);

    // Handle timesheet deletion
    const handleTimeSheetDelete = useCallback(async (id: string): Promise<void> => {
        try {
            await deleteTimesheet(id);
        } catch (error) {
            console.error("Error deleting timesheet:", error);
        }
    }, [deleteTimesheet]);

    // Handle timesheet export
    const handleExportTimesheet = useCallback((timesheet: TimeSheetType) => {
        try {
            if (exportFormat === "pdf") {
                exportTimesheetToPDF(timesheet);
            } else {
                exportTimesheetToExcel(timesheet);
            }

            toast({
                title: "Xuất phiếu thành công",
                description: `Phiếu công đoạn đã được xuất thành công dưới dạng ${exportFormat.toUpperCase()}`,
            });
        } catch (error) {
            toast({
                title: "Lỗi xuất phiếu",
                description: error instanceof Error ? error.message : "Có lỗi xảy ra khi xuất phiếu",
                variant: "destructive",
            });
        }
    }, [exportFormat, toast]);

    // Define table columns
    const columns: ColumnDef<TimeSheetType>[] = useMemo(() => [
        {
            id: "employeeName",
            header: "Tên nhân viên",
            cell: ({ row }) => {
                const timesheet = row.original;
                return (
                    <div className="flex flex-col">
                        <div className="font-medium">{timesheet.employeeName}</div>
                        <div className="text-sm text-muted-foreground">{timesheet.employeeId}</div>
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
            id: "totalHours",
            header: "Tổng giờ",
            cell: ({ row }) => (
                <div className="text-center font-medium">{row.original.totalHours} giờ</div>
            ),
            accessorKey: "totalHours",
        },
        {
            id: "entries",
            header: "Số công đoạn",
            cell: ({ row }) => (
                <div className="text-center">{row.original.entries.length}</div>
            ),
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
            header: "Xuất phiếu",
            cell: ({ row }) => {
                const timesheet = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Download className="h-4 w-4" />
                                <span>Xuất</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                                setExportFormat("pdf");
                                handleExportTimesheet(timesheet);
                            }}>
                                PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                setExportFormat("excel");
                                handleExportTimesheet(timesheet);
                            }}>
                                Excel
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [formatDate, handleExportTimesheet]);

    // Correctly define the form components using proper React syntax
    const createFormComponent = (props) => (
        <TimeSheetForm
            {...props}
            onSubmit={handleTimeSheetFormSubmit}
        />
    );

    const editFormComponent = (props) => (
        <TimeSheetForm
            {...props}
            initialData={props.data}
            onSubmit={handleTimeSheetFormSubmit}
        />
    );

    const viewFormComponent = (props) => (
        <TimeSheetForm
            {...props}
            initialData={props.data}
            isReadOnly={true}
        />
    );

    return (
        <div className="container mx-auto py-6">
            <DataTable
                columns={columns}
                data={timesheets}
                title="Quản lý phiếu theo dõi công đoạn"
                description="Quản lý và theo dõi các phiếu giao chỉ tiêu cá nhân"
                actions={["create", "edit", "delete", "read-only"]}
                searchColumn="employeeName"
                searchPlaceholder="Tìm kiếm theo tên, mã nhân viên..."
                exportData={true}
                onDelete={handleTimeSheetDelete}
                refetchData={fetchTimesheets}
                isLoading={loading}
                createFormComponent={createFormComponent}
                editFormComponent={editFormComponent}
                viewFormComponent={viewFormComponent}
                serverSidePagination={true}
                totalItems={pagination.total}
                initialPageIndex={Math.max(0, (pagination.page || 1) - 1)}
                initialPageSize={pagination.limit || 10}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default TimeSheetList;