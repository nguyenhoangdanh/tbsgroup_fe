"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { DialogChildrenProps, DialogType, useDialog } from "@/contexts/DialogProvider";
import { Calendar, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WorkLog, EnhancedWorkLog, enhancedToLegacyWorkLog, legacyToEnhancedWorkLog, groupWorkLogs } from "./workLogTypes";
import EnhancedWorkLogForm, { EnhancedWorkLogFormValues } from "./EnhancedWorkLogForm";
import { useEnhancedWorkLogService } from "./workLogService";
import { usePdfExportHandler } from "./usePdfExportHandler";
import { useExportIntegration } from "./useExportIntegration";

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

    // // Use the PDF export handler
    // const { handleExportPDF } = usePdfExportHandler();

    // // Setup export integration
    // const exportIntegration = useExportIntegration(
    //     exportFormat,
    //     handleExportPDF,
    //     exportToExcel
    // );

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

    // Handle PDF export
    const handleExportPDF = async (workLog: WorkLog) => {
        try {
            const res = await fetch("/api/export-worklog-pdf", {
                method: "POST",
                body: JSON.stringify(workLog),
                headers: {
                    "Content-Type": "application/json",
                },
            });

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
                // return (
                //     <DropdownMenu>
                //         <DropdownMenuTrigger asChild>
                //             <Button variant="outline" size="sm" className="flex items-center gap-1">
                //                 <Download className="h-4 w-4" />
                //                 <span>Xuất</span>
                //             </Button>
                //         </DropdownMenuTrigger>
                //         <DropdownMenuContent align="end">
                //             <DropdownMenuItem
                //                 onClick={() => exportIntegration.exportSingleEntry(workLog)}
                //             >
                //                 PDF (Chỉ công việc này)
                //             </DropdownMenuItem>
                //             <DropdownMenuItem
                //                 onClick={() => exportIntegration.exportFullReport(workLog)}
                //             >
                //                 PDF (Tất cả công việc trong ngày)
                //             </DropdownMenuItem>
                //             <DropdownMenuItem
                //                 onClick={() => {
                //                     setExportFormat("excel");
                //                     exportIntegration.exportExcel(workLog);
                //                 }}
                //             >
                //                 Excel
                //             </DropdownMenuItem>
                //         </DropdownMenuContent>
                //     </DropdownMenu>
                // );

                return (
                    <Button variant="outline" size="sm" className="flex items-center gap-1"
                        onClick={() => {
                            setExportFormat("pdf");
                            handleExport(workLog);
                            handleExportPDF(workLog);
                        }}
                    >
                        <Download className="h-4 w-4" />
                        <span>Xuất</span>
                    </Button>
                );
            },
        },
    ], [formatDate, formatWorkingTime, getStatusColor, getStatusLabel, handleExportPDF]);

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

// import React, { useState, useCallback, useMemo } from "react";
// import { ColumnDef } from "@tanstack/react-table";
// import { DataTable } from "@/components/common/table/data-table";
// import { Badge } from "@/components/ui/badge";
// import { DialogChildrenProps, DialogType, useDialog } from "@/context/DialogProvider";
// import { Calendar, Download, LucideEdit, Eye, Trash2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { toast } from "@/hooks/use-toast";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { WorkLog, useWorkLogService } from "./workLogService";
// import WorkLogForm, { WorkLogFormValues } from "./WorkLogForm";
// import { generateWorkLogPDF } from "@/utils/pdfExporter";

// const WorkLogContainer: React.FC = () => {
//     // Use service to manage worklogs
//     const {
//         workLogs,
//         createWorkLog,
//         updateWorkLog,
//         deleteWorkLog,
//         loading,
//         pagination,
//         updatePagination,
//         fetchWorkLogs,
//         exportToPDF,
//         exportToExcel
//     } = useWorkLogService();

//     // Dialog context
//     const { showDialog, hideDialog } = useDialog();

//     // State for export format
//     const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

//     // Handle pagination change
//     const handlePageChange = useCallback((pageIndex: number, pageSize: number) => {
//         updatePagination(pageIndex + 1, pageSize);
//     }, [updatePagination]);

//     // Format date for display
//     const formatDate = useCallback((dateString?: string) => {
//         if (!dateString) return '';
//         const date = new Date(dateString);
//         return date.toLocaleDateString('vi-VN');
//     }, []);

//     // Format working time
//     const formatWorkingTime = useCallback((code: string) => {
//         switch (code) {
//             case "8_hours":
//                 return "8 tiếng";
//             case "9.5_hours":
//                 return "9 tiếng 30 phút";
//             case "11_hours":
//                 return "11 tiếng";
//             default:
//                 return code;
//         }
//     }, []);

//     // Define status label
//     const getStatusLabel = useCallback((status: string) => {
//         switch (status) {
//             case "pending":
//                 return "Chờ duyệt";
//             case "approved":
//                 return "Đã duyệt";
//             case "rejected":
//                 return "Từ chối";
//             default:
//                 return status;
//         }
//     }, []);

//     // Define status color
//     const getStatusColor = useCallback((status: string) => {
//         switch (status) {
//             case "pending":
//                 return { bg: "bg-yellow-100", text: "text-yellow-800" };
//             case "approved":
//                 return { bg: "bg-green-100", text: "text-green-800" };
//             case "rejected":
//                 return { bg: "bg-red-100", text: "text-red-800" };
//             default:
//                 return { bg: "bg-gray-100", text: "text-gray-800" };
//         }
//     }, []);

//     // Handle form submit
//     const handleWorkLogFormSubmit = useCallback(async (data: WorkLogFormValues): Promise<boolean> => {
//         try {
//             if (data.id) {
//                 // Update existing worklog
//                 await updateWorkLog(data.id, data as Partial<WorkLog>);
//                 toast({
//                     title: "Cập nhật thành công",
//                     description: "Báo cáo sản lượng đã được cập nhật"
//                 });
//             } else {
//                 // Create new worklog
//                 await createWorkLog(data as any);
//                 toast({
//                     title: "Tạo mới thành công",
//                     description: "Báo cáo sản lượng đã được tạo"
//                 });
//             }

//             hideDialog();
//             // Reload data
//             fetchWorkLogs();

//             return true;
//         } catch (error) {
//             console.error("Lỗi khi gửi form:", error);
//             toast({
//                 title: "Lỗi",
//                 description: "Có lỗi xảy ra khi lưu báo cáo",
//                 variant: "destructive"
//             });
//             return false;
//         }
//     }, [createWorkLog, updateWorkLog, fetchWorkLogs]);

//     // Handle worklog delete
//     const handleWorkLogDelete = useCallback(async (id: string): Promise<void> => {
//         try {
//             await deleteWorkLog(id);
//             toast({
//                 title: "Xóa thành công",
//                 description: "Báo cáo sản lượng đã được xóa"
//             });
//             fetchWorkLogs();
//         } catch (error) {
//             console.error("Lỗi khi xóa:", error);
//             toast({
//                 title: "Lỗi",
//                 description: "Có lỗi xảy ra khi xóa báo cáo",
//                 variant: "destructive"
//             });
//         }
//     }, [deleteWorkLog, fetchWorkLogs]);

//     // Handle export
//     const handleExport = useCallback((workLog: WorkLog) => {
//         try {
//             if (exportFormat === "pdf") {
//                 exportToPDF(workLog);
//             } else {
//                 exportToExcel(workLog);
//             }

//             toast({
//                 title: "Xuất báo cáo thành công",
//                 description: `Báo cáo đã được xuất dạng ${exportFormat.toUpperCase()}`
//             });
//         } catch (error) {
//             toast({
//                 title: "Lỗi xuất báo cáo",
//                 description: error instanceof Error ? error.message : "Có lỗi xảy ra khi xuất báo cáo",
//                 variant: "destructive"
//             });
//         }
//     }, [exportFormat, exportToPDF, exportToExcel]);





//     const handleExportPDF = async (workLog: WorkLog) => {
//         try {

//             const res = await fetch("/api/export-worklog-pdf", {
//                 method: "POST",
//                 body: JSON.stringify(workLog),
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//             });

//             // Remove loading toast

//             if (!res.ok) {
//                 const errorData = await res.json().catch(() => null);
//                 console.error("PDF export error:", errorData);
//                 throw new Error(errorData?.details || "Xuất PDF thất bại");
//             }

//             const blob = await res.blob();
//             const url = URL.createObjectURL(blob);

//             // Open PDF in new tab instead of downloading
//             window.open(url, '_blank');

//             // Also provide download option
//             const link = document.createElement("a");
//             link.href = url;
//             link.download = `baocao-sanluong-${workLog.employeeName.replace(/\s+/g, '-')}.pdf`;
//             link.click();

//             // Success notification
//             toast({
//                 title: "Xuất PDF thành công",
//                 description: "PDF đã được tạo thành công",
//             });
//         } catch (error) {
//             console.error("Lỗi xuất PDF:", error);
//             toast({
//                 title: "Lỗi xuất PDF",
//                 description: error instanceof Error ? error.message : "Không thể xuất PDF",
//                 variant: "destructive"
//             });
//         }
//     };


//     // const handleExportPDF = async (workLog: WorkLog) => {
//     //     try {
//     //         // Set loading state
//     //         const loadingToastId = toast({
//     //             title: "Đang xuất PDF",
//     //             description: "Đang xử lý...",
//     //         }).id;

//     //         // Generate PDF trên client-side
//     //         const pdfBase64 = await generateWorkLogPDF(workLog);

//     //         // Mở PDF trong tab mới
//     //         window.open(pdfBase64, '_blank');

//     //         // Success notification
//     //         toast({
//     //             title: "Xuất PDF thành công",
//     //             description: "PDF đã được tạo thành công",
//     //         });
//     //     } catch (error) {
//     //         console.error("Lỗi xuất PDF:", error);
//     //         toast({
//     //             title: "Lỗi xuất PDF",
//     //             description: error instanceof Error ? error.message : "Không thể xuất PDF",
//     //             variant: "destructive"
//     //         });
//     //     }
//     // };


//     // Define table columns
//     const columns: ColumnDef<WorkLog>[] = useMemo(() => [
//         {
//             id: "employeeName",
//             header: "Tên nhân viên",
//             cell: ({ row }) => {
//                 const workLog = row.original;
//                 return (
//                     <div className="flex flex-col">
//                         <div className="font-medium">{workLog.employeeName}</div>
//                         <div className="text-sm text-muted-foreground">{workLog.employeeCode}</div>
//                     </div>
//                 );
//             },
//             accessorKey: "employeeName",
//         },
//         {
//             id: "department",
//             header: "Đơn vị",
//             cell: ({ row }) => row.original.department,
//             accessorKey: "department",
//         },
//         {
//             id: "date",
//             header: "Ngày",
//             cell: ({ row }) => {
//                 const date = row.original.date;
//                 return (
//                     <div className="flex items-center gap-2">
//                         <Calendar className="h-4 w-4 text-muted-foreground" />
//                         <span>{formatDate(date)}</span>
//                     </div>
//                 );
//             },
//             accessorKey: "date",
//         },
//         {
//             id: "workingTime",
//             header: "Thời gian làm việc",
//             cell: ({ row }) => formatWorkingTime(row.original.workingTime),
//             accessorKey: "workingTime",
//         },
//         {
//             id: "operationName",
//             header: "Công đoạn",
//             cell: ({ row }) => row.original.operationName,
//             accessorKey: "operationName",
//         },
//         {
//             id: "totalProduction",
//             header: "Sản lượng",
//             cell: ({ row }) => (
//                 <div className="text-center font-medium">{row.original.totalProduction}</div>
//             ),
//             accessorKey: "totalProduction",
//         },
//         {
//             id: "status",
//             header: "Trạng thái",
//             cell: ({ row }) => {
//                 const status = row.original.status;
//                 const { bg, text } = getStatusColor(status);
//                 return (
//                     <Badge className={`${bg} ${text}`}>
//                         {getStatusLabel(status)}
//                     </Badge>
//                 );
//             },
//             accessorKey: "status",
//         },
//         {
//             id: "export",
//             header: "Xuất",
//             cell: ({ row }) => {
//                 const workLog = row.original;
//                 return (
//                     <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                             <Button variant="outline" size="sm" className="flex items-center gap-1">
//                                 <Download className="h-4 w-4" />
//                                 <span>Xuất</span>
//                             </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                             <DropdownMenuItem
//                                 onClick={() => {
//                                     setExportFormat("pdf");
//                                     handleExport(workLog);
//                                     handleExportPDF(workLog);
//                                 }}
//                             >
//                                 PDF
//                             </DropdownMenuItem>
//                             <DropdownMenuItem
//                                 onClick={() => {
//                                     setExportFormat("excel");
//                                     handleExport(workLog);
//                                 }}
//                             >
//                                 Excel
//                             </DropdownMenuItem>
//                         </DropdownMenuContent>
//                     </DropdownMenu>
//                 );
//             },
//         },
//     ], [formatDate, formatWorkingTime, getStatusColor, getStatusLabel, handleExport]);

//     // Create component functions that match the DialogChildrenProps interface
//     const createFormComponent = useCallback((props: DialogChildrenProps<any>) => {
//         return <WorkLogForm onSubmit={handleWorkLogFormSubmit} />;
//     }, [handleWorkLogFormSubmit]);

//     const editFormComponent = useCallback((props: DialogChildrenProps<any>) => {
//         const { data } = props;
//         return <WorkLogForm
//             isEdit={true}
//             defaultValues={data}
//             onSubmit={handleWorkLogFormSubmit}
//         />;
//     }, [handleWorkLogFormSubmit]);

//     const viewFormComponent = useCallback((props: DialogChildrenProps<any>) => {
//         const { data } = props;
//         return <WorkLogForm
//             isReadOnly={true}
//             defaultValues={data}
//         />;
//     }, []);

//     // Create new worklog handler - used for direct button handler
//     const handleCreateNew = useCallback(() => {
//         showDialog({
//             type: DialogType.CREATE,
//             title: "Thêm mới báo cáo sản lượng",
//             children: <WorkLogForm onSubmit={handleWorkLogFormSubmit} />
//         });
//     }, [showDialog, handleWorkLogFormSubmit]);

//     // Edit worklog handler - used for direct access
//     const handleEditWorkLog = useCallback((data: WorkLog) => {
//         showDialog({
//             type: DialogType.EDIT,
//             title: "Chỉnh sửa báo cáo sản lượng",
//             data,
//             children: (
//                 <WorkLogForm
//                     isEdit={true}
//                     defaultValues={data}
//                     onSubmit={handleWorkLogFormSubmit}
//                 />
//             )
//         });
//     }, [showDialog, handleWorkLogFormSubmit]);

//     // View worklog handler - used for direct access
//     const handleViewWorkLog = useCallback((data: WorkLog) => {
//         showDialog({
//             type: DialogType.VIEW,
//             title: "Xem báo cáo sản lượng",
//             data,
//             children: (
//                 <WorkLogForm
//                     isReadOnly={true}
//                     defaultValues={data}
//                 />
//             )
//         });
//     }, [showDialog]);


//     return (
//         <DataTable
//             columns={columns}
//             data={workLogs}
//             title="Quản lý báo cáo sản lượng"
//             description="Quản lý và theo dõi sản lượng theo từng khung giờ"
//             searchColumn="employeeName"
//             searchPlaceholder="Tìm kiếm theo tên, mã nhân viên..."
//             isLoading={loading}
//             serverSidePagination={true}
//             totalItems={pagination.total}
//             initialPageIndex={Math.max(0, (pagination.page || 1) - 1)}
//             initialPageSize={pagination.limit || 10}
//             onPageChange={handlePageChange}
//             actions={["create", "edit", "delete", "read-only"]}
//             createFormComponent={createFormComponent}
//             editFormComponent={editFormComponent}
//             viewFormComponent={viewFormComponent}
//             createClickAction={handleCreateNew}
//             editClickAction={handleEditWorkLog}
//             viewClickAction={handleViewWorkLog}
//             refetchData={fetchWorkLogs}
//             onDelete={handleWorkLogDelete}
//             exportData={true}
//             exportFormats={["pdf", "excel"]}
//         />
//     );
// };

// export default WorkLogContainer;