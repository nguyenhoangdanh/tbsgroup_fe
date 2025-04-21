"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { DialogChildrenProps, DialogType, useDialog } from "@/context/DialogProvider";
import { Calendar, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WorkLog, EnhancedWorkLog, enhancedToLegacyWorkLog, legacyToEnhancedWorkLog, groupWorkLogs } from "./workLogTypes";
import { useEnhancedWorkLogService } from "./enhancedWorkLogService";
import EnhancedWorkLogForm, { EnhancedWorkLogFormValues } from "./EnhancedWorkLogForm";

const EnhancedWorkLogContainer: React.FC = () => {
    // Use enhanced service
    const {
        workLogs,
        enhancedWorkLogs,
        createWorkLog,
        updateWorkLog,
        deleteWorkLog,
        loading,
        pagination,
        updatePagination,
        fetchWorkLogs,
        exportToPDF,
        exportToExcel
    } = useEnhancedWorkLogService();

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

    // Handle enhanced form submit
    const handleWorkLogFormSubmit = useCallback(async (data: EnhancedWorkLogFormValues): Promise<boolean> => {
        try {
            // For each entry in the enhanced form, create/update a worklog
            let allSuccessful = true;

            for (const entry of data.entries) {
                const workLogData = {
                    date: data.date,
                    employeeId: data.employeeId,
                    employeeCode: data.employeeCode,
                    employeeName: data.employeeName,
                    department: data.department,
                    cardNumber: data.cardNumber,
                    workingTime: data.workingTime,
                    bagCode: entry.bagCode,
                    operationCode: entry.operationCode,
                    operationName: entry.operationName,
                    hourlyTarget: entry.hourlyTarget,
                    production: entry.production,
                    totalProduction: entry.totalProduction,
                    performanceReason: entry.performanceReason,
                    status: data.status as 'pending' | 'approved' | 'rejected'
                };

                if (data.id) {
                    // Update existing worklog
                    const workLogId = `${data.id}_${entry.id}`;
                    await updateWorkLog(workLogId, workLogData as Partial<WorkLog>);
                } else {
                    // Create new worklog
                    await createWorkLog(workLogData as any);
                }
            }

            if (allSuccessful) {
                toast({
                    title: data.id ? "Cập nhật thành công" : "Tạo mới thành công",
                    description: "Báo cáo sản lượng đã được " + (data.id ? "cập nhật" : "tạo")
                });

                hideDialog();
                // Reload data
                fetchWorkLogs();
                return true;
            } else {
                throw new Error("Có lỗi khi xử lý một số mục");
            }
        } catch (error) {
            console.error("Lỗi khi gửi form:", error);
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi lưu báo cáo",
                variant: "destructive"
            });
            return false;
        }
    }, [createWorkLog, updateWorkLog, fetchWorkLogs, hideDialog]);

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
                // We'll use the updated PDF export in handleExportPDF instead
                // This is kept for compatibility with existing code
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

    // Handle PDF export with options for single entry or full report
    const handleExportPDF = async (workLog: WorkLog, isFullReport: boolean = false) => {
        try {
            // Show loading toast
            toast({
                title: "Đang xuất PDF",
                description: "Vui lòng đợi trong giây lát..."
            });

            let blob: Blob;

            if (isFullReport) {
                // Export all entries for this employee and date
                blob = await exportFullWorkLog(workLog);
            } else {
                // Export just this single entry
                blob = await exportSingleWorkLog(workLog);
            }

            // Generate filename
            const filename = isFullReport
                ? `baocao-sanluong-${workLog.employeeName.replace(/\s+/g, '-')}-${workLog.date}.pdf`
                : `baocao-sanluong-${workLog.employeeName.replace(/\s+/g, '-')}-${workLog.date}-${workLog.bagCode}.pdf`;

            // Display and download the PDF
            displayPdfBlob(blob, filename);

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

    // Get enhanced worklog by ID
    const getEnhancedWorkLogById = useCallback((id: string): EnhancedWorkLog | undefined => {
        const [workLogId] = id.split('_');
        return enhancedWorkLogs.find(log => log.id === workLogId);
    }, [enhancedWorkLogs]);

    // Convert legacy worklog to enhanced form values
    const prepareFormValues = useCallback((workLog: WorkLog): EnhancedWorkLogFormValues => {
        const [workLogId] = workLog.id.split('_');
        const enhancedLog = getEnhancedWorkLogById(workLog.id);

        if (enhancedLog) {
            // We have the enhanced log with multiple entries
            return {
                id: workLogId,
                date: enhancedLog.date,
                employeeId: enhancedLog.employeeId,
                employeeCode: enhancedLog.employeeCode,
                employeeName: enhancedLog.employeeName,
                department: enhancedLog.department,
                cardNumber: enhancedLog.cardNumber,
                workingTime: enhancedLog.workingTime,
                entries: enhancedLog.entries,
                status: enhancedLog.status
            };
        } else {
            // Fallback to creating from a single worklog
            return {
                id: workLogId,
                date: workLog.date,
                employeeId: workLog.employeeId,
                employeeCode: workLog.employeeCode,
                employeeName: workLog.employeeName,
                department: workLog.department,
                cardNumber: workLog.cardNumber,
                workingTime: workLog.workingTime,
                entries: [
                    {
                        id: workLog.id.includes('_') ? workLog.id.split('_')[1] : 'entry1',
                        bagCode: workLog.bagCode,
                        operationCode: workLog.operationCode,
                        operationName: workLog.operationName,
                        hourlyTarget: workLog.hourlyTarget,
                        production: workLog.production,
                        totalProduction: workLog.totalProduction,
                        performanceReason: workLog.performanceReason
                    }
                ],
                status: workLog.status
            };
        }
    }, [getEnhancedWorkLogById]);

    // Define table columns - these show individual entries for compatibility
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
            id: "bagAndOperation",
            header: "Túi/Công đoạn",
            cell: ({ row }) => {
                const workLog = row.original;
                return (
                    <div className="flex flex-col">
                        <div><span className="font-medium">Túi:</span> {workLog.bagCode}</div>
                        <div><span className="font-medium">CD:</span> {workLog.operationName}</div>
                    </div>
                );
            },
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
                                    handleExportPDF(workLog, false); // Export single entry
                                }}
                            >
                                PDF (Chỉ công việc này)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setExportFormat("pdf");
                                    handleExportPDF(workLog, true); // Export all entries for this day
                                }}
                            >
                                PDF (Tất cả công việc trong ngày)
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
    ], [formatDate, formatWorkingTime, getStatusColor, getStatusLabel, handleExport, handleExportPDF]);

    // Create component functions that match the DialogChildrenProps interface
    const createFormComponent = useCallback((props: DialogChildrenProps<any>) => {
        return <EnhancedWorkLogForm onSubmit={handleWorkLogFormSubmit} />;
    }, [handleWorkLogFormSubmit]);

    const editFormComponent = useCallback((props: DialogChildrenProps<any>) => {
        const { data } = props;
        const formValues = prepareFormValues(data);
        return <EnhancedWorkLogForm
            isEdit={true}
            defaultValues={formValues}
            onSubmit={handleWorkLogFormSubmit}
        />;
    }, [handleWorkLogFormSubmit, prepareFormValues]);

    const viewFormComponent = useCallback((props: DialogChildrenProps<any>) => {
        const { data } = props;
        const formValues = prepareFormValues(data);
        return <EnhancedWorkLogForm
            isReadOnly={true}
            defaultValues={formValues}
        />;
    }, [prepareFormValues]);

    // Create new worklog handler
    const handleCreateNew = useCallback(() => {
        showDialog({
            type: DialogType.CREATE,
            title: "Thêm mới báo cáo sản lượng",
            children: <EnhancedWorkLogForm onSubmit={handleWorkLogFormSubmit} />
        });
    }, [showDialog, handleWorkLogFormSubmit]);

    // Edit worklog handler
    const handleEditWorkLog = useCallback((data: WorkLog) => {
        const formValues = prepareFormValues(data);
        showDialog({
            type: DialogType.EDIT,
            title: "Chỉnh sửa báo cáo sản lượng",
            data,
            children: (
                <EnhancedWorkLogForm
                    isEdit={true}
                    defaultValues={formValues}
                    onSubmit={handleWorkLogFormSubmit}
                />
            )
        });
    }, [showDialog, handleWorkLogFormSubmit, prepareFormValues]);

    // View worklog handler
    const handleViewWorkLog = useCallback((data: WorkLog) => {
        const formValues = prepareFormValues(data);
        showDialog({
            type: DialogType.VIEW,
            title: "Xem báo cáo sản lượng",
            data,
            children: (
                <EnhancedWorkLogForm
                    isReadOnly={true}
                    defaultValues={formValues}
                />
            )
        });
    }, [showDialog, prepareFormValues]);


    return (
        <DataTable
            columns={columns}
            data={workLogs}
            title="Quản lý báo cáo sản lượng"
            description="Quản lý và theo dõi sản lượng theo từng khung giờ, cho phép nhiều công việc cho mỗi nhân viên"
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
    );
};

export default EnhancedWorkLogContainer;





























// "use client";
// import React, { useEffect, useCallback, useMemo, useState, useRef } from "react";
// import { z } from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { FieldCombobox } from "@/components/common/Form/FieldCombobox";
// import { FieldInput } from "@/components/common/Form/FieldInput";
// import { FieldSelect } from "@/components/common/Form/FieldSelect";
// import { FieldTextarea } from "@/components/common/Form/FieldTextarea";
// import FormActions from "@/components/common/Form/FormAction";
// import { useWorkLogService, WorkLog } from "./workLogService";
import { m } from 'framer-motion';

// // Define production record type
// type ProductionRecord = Record<string, number>;

// // Định nghĩa schema bên ngoài component để tránh tạo lại mỗi lần render
// const workLogSchema = z.object({
//     id: z.string().optional(),
//     date: z.string().min(1, "Vui lòng chọn ngày"),
//     employeeId: z.string().min(1, "Vui lòng chọn nhân viên"),
//     employeeCode: z.string(),
//     employeeName: z.string(),
//     department: z.string(),
//     cardNumber: z.string(),
//     workingTime: z.string().min(1, "Vui lòng chọn thời gian làm việc"),
//     bagCode: z.string().min(1, "Vui lòng chọn mã túi"),
//     operationName: z.string().min(1, "Vui lòng chọn công đoạn"),
//     hourlyTarget: z.number().min(0, "Chỉ tiêu giờ không được âm"),
//     production: z.record(z.string(), z.coerce.number().min(0, "Sản lượng không được âm")),
//     totalProduction: z.number().min(0, "Tổng sản lượng không được âm"),
//     performanceReason: z.object({
//         material: z.string().optional().nullable(),
//         technology: z.string().optional().nullable(),
//         quality: z.string().optional().nullable(),
//         machinery: z.string().optional().nullable(),
//     }),
//     status: z.enum(["pending", "approved", "rejected"]).default("pending"),
// });

// // Định nghĩa sẵn các time slots để tránh tính toán lại
// const TIME_SLOTS = {
//     "8_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30"],
//     "9.5_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00"],
//     "11_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00", "18:00-19:00"],
// };

// const BREAK_TIME_TEXT = {
//     "8_hours": "Thời gian nghỉ: 11:30-12:30",
//     "9.5_hours": "Thời gian nghỉ: 11:30-12:30",
//     "11_hours": "Thời gian nghỉ: 11:30-12:30, 16:30-17:00",
// };

// export type WorkLogFormValues = z.infer<typeof workLogSchema>;

// interface WorkLogFormProps {
//     isEdit?: boolean;
//     isReadOnly?: boolean;
//     defaultValues?: Partial<WorkLogFormValues>;
//     onSubmit?: (data: WorkLogFormValues) => Promise<boolean>;
// }

// // Tạo initialProduction một lần duy nhất
// const initialProduction: ProductionRecord = {
//     "7:30-8:30": 0,
//     "8:30-9:30": 0,
//     "9:30-10:30": 0,
//     "10:30-11:30": 0,
//     "12:30-13:30": 0,
//     "13:30-14:30": 0,
//     "14:30-15:30": 0,
//     "15:30-16:30": 0,
//     "17:00-18:00": 0,
//     "18:00-19:00": 0,
// };

// const WorkLogForm: React.FC<WorkLogFormProps> = ({
//     isEdit = false,
//     defaultValues,
//     isReadOnly = false,
//     onSubmit
// }) => {
//     // Dùng useRef để lưu trữ tổng production, tránh re-render
//     const totalProductionRef = useRef<number>(0);

//     // Sử dụng useRef để lưu trữ timeout ID cho debounce
//     const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

//     // Sử dụng useState cho các giá trị production để tối ưu render
//     const [productionState, setProductionState] = useState<ProductionRecord>(
//         defaultValues?.production || initialProduction
//     );

//     const {
//         employees,
//         bagCodes,
//         operations,
//         workingTimeOptions,
//         getEmployeeDetails,
//         getOperationDetails
//     } = useWorkLogService();

//     const form = useForm<WorkLogFormValues>({
//         resolver: zodResolver(workLogSchema),
//         defaultValues: {
//             id: undefined,
//             date: new Date().toISOString().split('T')[0],
//             employeeId: "",
//             employeeCode: "",
//             employeeName: "",
//             department: "",
//             cardNumber: "",
//             workingTime: "",
//             bagCode: "",
//             operationName: "",
//             hourlyTarget: 0,
//             production: defaultValues?.production || initialProduction,
//             totalProduction: defaultValues?.totalProduction || 0,
//             performanceReason: {
//                 material: "",
//                 technology: "",
//                 quality: "",
//                 machinery: "",
//             },
//             status: "pending",
//             ...defaultValues
//         },
//         mode: "onBlur", // Thay đổi từ onChange sang onBlur để giảm số lần validate
//     });

//     const { control, watch, setValue, handleSubmit, formState: { isSubmitting } } = form;

//     const selectedEmployeeId = watch("employeeId");
//     const selectedWorkingTime = watch("workingTime");
//     const selectedOperationName = watch("operationName");

//     // Fetch employee details khi employee được chọn
//     useEffect(() => {
//         if (selectedEmployeeId) {
//             const employee = getEmployeeDetails(selectedEmployeeId);
//             if (employee) {
//                 setValue("employeeCode", employee.code);
//                 setValue("employeeName", employee.name);
//                 setValue("department", employee.department);
//                 setValue("cardNumber", employee.cardNumber);
//             }
//         }
//     }, [selectedEmployeeId, getEmployeeDetails, setValue]);

//     // Fetch operation details khi operation được chọn
//     useEffect(() => {
//         if (selectedOperationName) {
//             const operation = getOperationDetails(selectedOperationName);
//             if (operation) {
//                 setValue("hourlyTarget", operation.hourlyTarget);
//             }
//         }
//     }, [selectedOperationName, getOperationDetails, setValue]);

//     // Tính tổng production một cách hiệu quả
//     const calculateTotalProduction = useCallback((production: ProductionRecord): number => {
//         return Object.values(production).reduce(
//             (sum, value) => sum + (typeof value === 'string' ? parseInt(value, 10) || 0 : (value || 0)),
//             0
//         );
//     }, []);

//     // Sử dụng useMemo cho time slots để tránh tính toán lại
//     const timeSlots = useMemo(() => {
//         if (!selectedWorkingTime) return [];
//         return TIME_SLOTS[selectedWorkingTime as keyof typeof TIME_SLOTS] || [];
//     }, [selectedWorkingTime]);

//     // Xử lý thay đổi giá trị production với debounce để tránh cập nhật liên tục
//     const handleProductionChange = useCallback((timeSlot: string, value: number) => {
//         // Cập nhật state local trước để UI phản hồi ngay lập tức
//         setProductionState(prev => {
//             const newState = { ...prev, [timeSlot]: value };

//             // Cập nhật ref để luôn có giá trị mới nhất
//             totalProductionRef.current = calculateTotalProduction(newState);

//             return newState;
//         });

//         // Hủy bỏ timeout trước đó nếu có
//         if (debounceTimerRef.current) {
//             clearTimeout(debounceTimerRef.current);
//         }

//         // Đặt timeout mới để debounce việc cập nhật form
//         debounceTimerRef.current = setTimeout(() => {
//             // Cập nhật giá trị vào form
//             setValue(`production.${timeSlot}`, value, { shouldValidate: false });
//             setValue("totalProduction", totalProductionRef.current, { shouldValidate: false });

//             // Chỉ validate một lần sau khi đã cập nhật tất cả
//             form.trigger(["production", "totalProduction"]);

//             debounceTimerRef.current = null;
//         }, 100); // 100ms debounce time
//     }, [setValue, form, calculateTotalProduction]);

//     // Đảm bảo dọn dẹp timeout khi component unmount
//     useEffect(() => {
//         return () => {
//             if (debounceTimerRef.current) {
//                 clearTimeout(debounceTimerRef.current);
//             }
//         };
//     }, []);

//     // Cập nhật tổng production ban đầu khi component mount
//     useEffect(() => {
//         if (defaultValues?.production) {
//             const total = calculateTotalProduction(defaultValues.production);
//             setValue("totalProduction", total);
//             totalProductionRef.current = total;
//         }
//     }, [defaultValues, calculateTotalProduction, setValue]);

//     // Xử lý khi thay đổi workingTime
//     useEffect(() => {
//         if (selectedWorkingTime) {
//             // Reset production values cho các time slots không cần thiết
//             const validTimeSlots = TIME_SLOTS[selectedWorkingTime as keyof typeof TIME_SLOTS] || [];
//             const updatedProduction = { ...productionState };

//             // Chỉ giữ lại các time slots phù hợp với workingTime đã chọn
//             Object.keys(updatedProduction).forEach(slot => {
//                 if (!validTimeSlots.includes(slot)) {
//                     updatedProduction[slot] = 0;
//                 }
//             });

//             setProductionState(updatedProduction);
//             setValue("production", updatedProduction);

//             const total = calculateTotalProduction(updatedProduction);
//             setValue("totalProduction", total);
//             totalProductionRef.current = total;
//         }
//     }, [selectedWorkingTime, setValue, calculateTotalProduction]);

//     // Memo hóa breakTimeText để tránh tính toán lại
//     const breakTimeText = useMemo(() => {
//         if (!selectedWorkingTime) return "";
//         return BREAK_TIME_TEXT[selectedWorkingTime as keyof typeof BREAK_TIME_TEXT] || "";
//     }, [selectedWorkingTime]);

//     // Handle form submission
//     const handleFormSubmit = async (data: WorkLogFormValues) => {
//         if (onSubmit && !isReadOnly) {
//             return await onSubmit(data);
//         }
//         return false;
//     };

//     return (
//         <Card className="w-full" style={{ overflow: 'visible' }}>
//             <CardHeader>
//                 <CardTitle>{isEdit ? "Cập nhật báo cáo sản lượng" : "Báo cáo sản lượng mới"}</CardTitle>
//             </CardHeader>
//             <CardContent style={{ overflow: 'visible' }}>
//                 <form
//                     onSubmit={handleSubmit(handleFormSubmit)}
//                     className="space-y-6"
//                     style={{ paddingBottom: '80px' }}
//                 >
//                     {/* Employee Information Section */}
//                     <div className="space-y-4">
//                         <h3 className="text-lg font-medium">Thông tin nhân viên</h3>
//                         <Separator />
//                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//                             <FieldCombobox
//                                 name="employeeId"
//                                 label="Họ tên nhân viên"
//                                 control={control}
//                                 options={employees.map(emp => ({ value: emp.id, label: emp.name }))}
//                                 placeholder="Chọn nhân viên"
//                                 required
//                                 searchPlaceholder="Tìm kiếm nhân viên..."
//                                 disabled={isReadOnly}
//                             />
//                             <FieldInput
//                                 name="employeeCode"
//                                 label="Mã nhân viên"
//                                 control={control}
//                                 disabled
//                             />
//                             <FieldInput
//                                 name="cardNumber"
//                                 label="Mã số thẻ"
//                                 control={control}
//                                 disabled
//                             />
//                             <FieldInput
//                                 name="department"
//                                 label="Đơn vị"
//                                 control={control}
//                                 disabled
//                             />
//                         </div>
//                     </div>

//                     {/* Work Information Section */}
//                     <div className="space-y-4">
//                         <h3 className="text-lg font-medium">Thông tin công việc</h3>
//                         <Separator />
//                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//                             <FieldSelect
//                                 name="workingTime"
//                                 label="Thời gian làm việc"
//                                 control={control}
//                                 options={workingTimeOptions}
//                                 placeholder="Chọn thời gian làm việc"
//                                 required
//                                 disabled={isReadOnly}
//                             />
//                             <FieldCombobox
//                                 name="bagCode"
//                                 label="Mã túi"
//                                 control={control}
//                                 options={bagCodes}
//                                 placeholder="Chọn mã túi"
//                                 required
//                                 searchPlaceholder="Tìm kiếm mã túi..."
//                                 disabled={isReadOnly}
//                             />
//                             <FieldCombobox
//                                 name="operationName"
//                                 label="Tên công đoạn"
//                                 control={control}
//                                 options={operations.map(op => ({ value: op.name, label: op.name }))}
//                                 placeholder="Chọn công đoạn"
//                                 required
//                                 searchPlaceholder="Tìm kiếm công đoạn..."
//                                 disabled={isReadOnly}
//                             />
//                             <FieldInput
//                                 name="hourlyTarget"
//                                 label="Chỉ tiêu giờ"
//                                 control={control}
//                                 type="number"
//                                 disabled
//                             />
//                         </div>

//                         {selectedWorkingTime && (
//                             <div className="text-sm text-gray-500 italic mt-2">
//                                 {breakTimeText}
//                             </div>
//                         )}
//                     </div>

//                     {/* Production Details Section */}
//                     {selectedWorkingTime && (
//                         <div className="space-y-4">
//                             <h3 className="text-lg font-medium">Chi tiết sản lượng</h3>
//                             <Separator />
//                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
//                                 {timeSlots.map((timeSlot) => (
//                                     <FieldInput
//                                         key={timeSlot}
//                                         name={`production.${timeSlot}`}
//                                         label={`${timeSlot}`}
//                                         control={control}
//                                         type="number"
//                                         min={0}
//                                         placeholder="Nhập sản lượng"
//                                         disabled={isReadOnly}
//                                         onChange={(e) => {
//                                             const value = parseInt(e.target.value, 10) || 0;
//                                             handleProductionChange(timeSlot, value);
//                                         }}
//                                         // Sử dụng giá trị từ state thay vì từ form để UI phản hồi nhanh hơn
//                                         value={productionState[timeSlot]?.toString() || "0"}
//                                     />
//                                 ))}
//                             </div>
//                             <div className="flex justify-end">
//                                 <FieldInput
//                                     name="totalProduction"
//                                     label="Tổng cộng"
//                                     control={control}
//                                     type="number"
//                                     disabled
//                                     className="w-full sm:w-1/3 md:w-1/4"
//                                     // Sử dụng ref để hiển thị tổng ngay lập tức
//                                     value={totalProductionRef.current.toString()}
//                                 />
//                             </div>
//                         </div>
//                     )}

//                     {/* Reason Section */}
//                     <div className="space-y-4 mb-28">
//                         <h3 className="text-lg font-medium">Nguyên nhân (nếu có)</h3>
//                         <Separator />
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <FieldTextarea
//                                 name="performanceReason.material"
//                                 label="Nguyên liệu"
//                                 control={control}
//                                 placeholder="Nguyên nhân về nguyên liệu..."
//                                 rows={2}
//                                 disabled={isReadOnly}
//                             />
//                             <FieldTextarea
//                                 name="performanceReason.technology"
//                                 label="Kỹ thuật"
//                                 control={control}
//                                 placeholder="Nguyên nhân về kỹ thuật..."
//                                 rows={2}
//                                 disabled={isReadOnly}
//                             />
//                             <FieldTextarea
//                                 name="performanceReason.quality"
//                                 label="Chất lượng"
//                                 control={control}
//                                 placeholder="Nguyên nhân về chất lượng..."
//                                 rows={2}
//                                 disabled={isReadOnly}
//                             />
//                             <FieldTextarea
//                                 name="performanceReason.machinery"
//                                 label="Máy móc"
//                                 control={control}
//                                 placeholder="Nguyên nhân về máy móc thiết bị..."
//                                 rows={2}
//                                 disabled={isReadOnly}
//                             />
//                         </div>
//                     </div>

//                     {/* Fixed action buttons at bottom */}
//                     {!isReadOnly && (
//                         <div className="fixed-submit-button">
//                             <FormActions
//                                 isSubmitting={isSubmitting}
//                                 isEdit={isEdit}
//                                 submitLabel={{
//                                     create: "Tạo mới",
//                                     update: "Cập nhật",
//                                     loading: "Đang xử lý..."
//                                 }}
//                             />
//                         </div>
//                     )}
//                 </form>
//             </CardContent>
//         </Card>
//     );
// };

// // Sử dụng React.memo để tránh re-render không cần thiết
// export default React.memo(WorkLogForm);
