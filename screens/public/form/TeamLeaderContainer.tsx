"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { format } from "date-fns";
import {
    Calendar,
    User,
    Search,
    Plus,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Edit,
    FileText,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DialogType, useDialog } from "@/contexts/DialogProvider";

// Type imports
import {
    Employee,
    EnhancedWorkLog,
    WorkLog,
    enhancedToLegacyWorkLog,
    legacyToEnhancedWorkLog
} from "./workLogTypes";

import { useEnhancedWorkLogService } from "./workLogService";
import { usePdfExportHandler } from "./usePdfExportHandler";
import EnhancedWorkLogForm, { EnhancedWorkLogFormValues } from "./WorkLogFormTest";

// Compact employee info display
const EmployeeInfoCard: React.FC<{
    employee: Employee;
    hasReportToday: boolean;
    onClick: () => void
}> = ({ employee, hasReportToday, onClick }) => {
    return (
        <Card
            className="cursor-pointer hover:border-blue-500 transition-all mb-4"
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">{employee.name}</h3>
                            <p className="text-sm text-gray-500">{employee.code}</p>
                        </div>
                    </div>
                    {hasReportToday ? (
                        <Badge className="bg-green-100 text-green-800 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Đã báo cáo
                        </Badge>
                    ) : (
                        <Badge className="bg-red-100 text-red-800 flex items-center">
                            <XCircle className="h-3 w-3 mr-1" />
                            Chưa báo cáo
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Compact report card component
const ReportCard: React.FC<{
    report: WorkLog;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ report, onView, onEdit, onDelete }) => {
    // Get status styles
    const getStatusStyles = () => {
        switch (report.status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "approved":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Get status label
    const getStatusLabel = () => {
        switch (report.status) {
            case "pending":
                return "Chờ duyệt";
            case "approved":
                return "Đã duyệt";
            case "rejected":
                return "Từ chối";
            default:
                return report.status;
        }
    };

    // Format working time
    const formatWorkingTime = (code: string) => {
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
    };

    return (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{report.bagCode}</Badge>
                        <span className="text-sm text-gray-500">{report.operationName}</span>
                    </div>
                    <Badge className={getStatusStyles()}>{getStatusLabel()}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="text-sm">
                        <span className="text-gray-500">Thời gian: </span>
                        <span>{formatWorkingTime(report.workingTime)}</span>
                    </div>
                    <div className="text-sm font-medium text-right">
                        <span className="text-gray-500">Sản lượng: </span>
                        <span>{report.totalProduction}</span>
                    </div>
                </div>

                <div className="flex justify-end space-x-2 mt-2">
                    <Button size="sm" variant="ghost" onClick={onView}>
                        <FileText className="h-4 w-4 mr-1" />
                        Xem
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-1" />
                        Sửa
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Xóa
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const TeamLeaderContainer: React.FC = () => {
    // Use enhanced service
    const {
        employees,
        enhancedWorkLogs,
        createWorkLog,
        updateWorkLog,
        deleteWorkLog,
        loading,
        fetchWorkLogs
    } = useEnhancedWorkLogService();

    // Dialog context
    const { showDialog, hideDialog } = useDialog();

    // PDF export handler
    const { handleExportPDF } = usePdfExportHandler();

    // Team leader state
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

    // Filter employees by search query
    const filteredEmployees = useMemo(() => {
        if (!searchQuery.trim()) return employees;

        const query = searchQuery.toLowerCase();
        return employees.filter(emp =>
            emp.name.toLowerCase().includes(query) ||
            emp.code.toLowerCase().includes(query) ||
            emp.department.toLowerCase().includes(query)
        );
    }, [employees, searchQuery]);

    // Check if employee has reports today
    const hasReportToday = useCallback((employeeId: string): boolean => {
        return enhancedWorkLogs.some(log =>
            log.employeeId === employeeId &&
            log.date === selectedDate
        );
    }, [enhancedWorkLogs, selectedDate]);

    // Get employee reports for today
    const getTodayReports = useCallback((employeeId: string): WorkLog[] => {
        const employeeLogs = enhancedWorkLogs
            .filter(log =>
                log.employeeId === employeeId &&
                log.date === selectedDate
            )
            .flatMap(enhancedToLegacyWorkLog);

        return employeeLogs;
    }, [enhancedWorkLogs, selectedDate]);

    // Handle employee selection
    const handleSelectEmployee = useCallback((employee: Employee) => {
        setSelectedEmployee(employee);
        setViewMode('detail');
    }, []);

    // Handle back to list view
    const handleBackToList = useCallback(() => {
        setSelectedEmployee(null);
        setViewMode('list');
    }, []);

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

    // Handle worklog form submit
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
    }, [createWorkLog, updateWorkLog, fetchWorkLogs, hideDialog, toast]);

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
    }, [deleteWorkLog, fetchWorkLogs, toast]);

    // Create new worklog handler for selected employee
    const handleCreateReport = useCallback(() => {
        if (!selectedEmployee) return;

        showDialog({
            type: DialogType.CREATE,
            title: "Thêm mới báo cáo sản lượng",
            children: (
                <EnhancedWorkLogForm
                    onSubmit={handleWorkLogFormSubmit}
                    defaultValues={{
                        employeeId: selectedEmployee.id,
                        employeeCode: selectedEmployee.code,
                        employeeName: selectedEmployee.name,
                        department: selectedEmployee.department,
                        cardNumber: selectedEmployee.cardNumber || '',
                        date: selectedDate
                    }}
                />
            )
        });
    }, [showDialog, handleWorkLogFormSubmit, selectedEmployee, selectedDate]);

    // Edit worklog handler
    const handleEditWorkLog = useCallback((data: WorkLog) => {
        showDialog({
            type: DialogType.EDIT,
            title: "Chỉnh sửa báo cáo sản lượng",
            data,
            children: (
                <EnhancedWorkLogForm
                    isEdit={true}
                    defaultValues={prepareFormValues(data)}
                    onSubmit={handleWorkLogFormSubmit}
                />
            )
        });
    }, [showDialog, handleWorkLogFormSubmit, prepareFormValues]);

    // View worklog handler
    const handleViewWorkLog = useCallback((data: WorkLog) => {
        showDialog({
            type: DialogType.VIEW,
            title: "Xem báo cáo sản lượng",
            data,
            children: (
                <EnhancedWorkLogForm
                    isReadOnly={true}
                    defaultValues={prepareFormValues(data)}
                />
            )
        });
    }, [showDialog, prepareFormValues]);

    // Render employee list view
    const renderEmployeeListView = () => {
        return (
            <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <h1 className="text-xl font-bold tracking-tight">Quản lý báo cáo sản lượng</h1>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm công nhân..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredEmployees.map(employee => (
                        <EmployeeInfoCard
                            key={employee.id}
                            employee={employee}
                            hasReportToday={hasReportToday(employee.id)}
                            onClick={() => handleSelectEmployee(employee)}
                        />
                    ))}
                </div>
            </div>
        );
    };

    // Render employee detail view
    const renderEmployeeDetailView = () => {
        if (!selectedEmployee) return null;

        const todayReports = getTodayReports(selectedEmployee.id);
        const hasReports = todayReports.length > 0;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToList}
                        className="flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                    <Button onClick={handleCreateReport}>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm báo cáo mới
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-medium">{selectedEmployee.name}</h2>
                                <div className="flex flex-col sm:flex-row sm:gap-3 text-sm text-gray-500">
                                    <span>Mã: {selectedEmployee.code}</span>
                                    <span>Đơn vị: {selectedEmployee.department}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-md font-medium">
                                    Báo cáo ngày {format(new Date(selectedDate), 'dd/MM/yyyy')}
                                </h3>
                                <Badge>
                                    {todayReports.length} báo cáo
                                </Badge>
                            </div>

                            {!hasReports && (
                                <div className="text-center py-6 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">Công nhân chưa có báo cáo cho ngày hôm nay</p>
                                    <Button
                                        variant="outline"
                                        className="mt-2"
                                        onClick={handleCreateReport}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tạo báo cáo mới
                                    </Button>
                                </div>
                            )}

                            {hasReports && (
                                <div className="space-y-2">
                                    {todayReports.map((report) => (
                                        <ReportCard
                                            key={report.id}
                                            report={report}
                                            onView={() => handleViewWorkLog(report)}
                                            onEdit={() => handleEditWorkLog(report)}
                                            onDelete={() => handleWorkLogDelete(report.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="container mx-auto py-4 px-4">
            {viewMode === 'list' ? renderEmployeeListView() : renderEmployeeDetailView()}
        </div>
    );
};

export default TeamLeaderContainer;