import React, { useState, useCallback, useEffect } from "react";
import { TimeSheetType } from "@/schemas/timesheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { Plus, FileText, Clock, Filter, Search, Calendar, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { FieldDateTimePicker } from "@/components/common/Form/FieldDateTimePicker";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import TimeSheetForm from "./_components/TimeSheetForm";

// Mock API functions (replace with actual API calls)
const mockSaveTimeSheet = async (data: TimeSheetType): Promise<{ success: boolean, message: string }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Saving timesheet:", data);
    return { success: true, message: "Lưu phiếu thành công" };
};

const mockUpdateTimeSheet = async (id: string, data: TimeSheetType): Promise<{ success: boolean, message: string }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Updating timesheet:", id, data);
    return { success: true, message: "Cập nhật phiếu thành công" };
};

const mockDeleteTimeSheet = async (id: string): Promise<{ success: boolean, message: string }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log("Deleting timesheet:", id);
    return { success: true, message: "Xóa phiếu thành công" };
};

// Sample data for the list
const sampleTimeSheets: TimeSheetType[] = [
    {
        id: "ts-001",
        employeeName: "Nguyễn Văn A",
        employeeId: "EMP001",
        department: "Sản xuất",
        level: "Nhân viên",
        supervisor: "Trần Văn B",
        teamLeader: "Lê Thị C",
        shiftLeader: "Phạm Văn D",
        date: "2025-04-10",
        entries: [
            {
                id: "entry-001",
                taskCode: "T001",
                taskId: "CD001",
                taskName: "May túi xách mẫu A",
                target: "20",
                note: "100%",
                slots: { "1": true, "2": true, "3": true, "5": true, "6": true },
                reasons: { VT: false, CN: false, CL: true, MM: false },
                total: 5
            }
        ],
        totalHours: 5,
        status: "approved"
    },
    {
        id: "ts-002",
        employeeName: "Trần Thị B",
        employeeId: "EMP002",
        department: "Sản xuất",
        level: "Nhân viên",
        supervisor: "Trần Văn B",
        teamLeader: "Lê Thị C",
        shiftLeader: "Phạm Văn D",
        date: "2025-04-11",
        entries: [
            {
                id: "entry-002",
                taskCode: "T002",
                taskId: "CD002",
                taskName: "May túi xách mẫu B",
                target: "15",
                note: "90%",
                slots: { "1": true, "2": true, "3": true, "4": true, "5": true, "6": true, "7": true },
                reasons: { VT: true, CN: false, CL: false, MM: false },
                total: 7
            }
        ],
        totalHours: 7,
        status: "pending"
    },
    {
        id: "ts-003",
        employeeName: "Lê Văn C",
        employeeId: "EMP003",
        department: "Sản xuất",
        level: "Nhân viên",
        supervisor: "Trần Văn B",
        teamLeader: "Lê Thị C",
        shiftLeader: "Phạm Văn D",
        date: "2025-04-12",
        entries: [
            {
                id: "entry-003",
                taskCode: "T003",
                taskId: "CD003",
                taskName: "May túi xách mẫu C",
                target: "18",
                note: "95%",
                slots: { "1": true, "2": true, "5": true, "6": true },
                reasons: { VT: false, CN: true, CL: false, MM: false },
                total: 4
            }
        ],
        totalHours: 4,
        status: "draft"
    }
];

const TimeSheetContainer: React.FC = () => {
    const [timeSheets, setTimeSheets] = useState<TimeSheetType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const { toast } = useToast();
    const { showDialog } = useDialog();

    // Load sample data
    useEffect(() => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setTimeSheets(sampleTimeSheets);
            setIsLoading(false);
        }, 500);
    }, []);

    // Filter timesheets based on search term
    const filteredTimeSheets = timeSheets.filter(
        (sheet) =>
            sheet.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sheet.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sheet.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get current items for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTimeSheets.slice(indexOfFirstItem, indexOfLastItem);

    // Change page
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Create a new timesheet
    const handleCreateTimeSheet = useCallback(() => {
        showDialog({
            type: DialogType.CREATE,
            title: "Tạo phiếu theo dõi công đoạn mới",
            maxWidth: "xl",
            children: (props) => (
                <TimeSheetForm
                    onSubmit={async (data) => {
                        try {
                            const result = await mockSaveTimeSheet(data);
                            if (result.success) {
                                // Add ID and status to the new timesheet
                                const newTimeSheet = {
                                    ...data,
                                    id: `ts-${Date.now()}`,
                                    status: "draft",
                                    totalHours: data.entries.reduce((sum, entry) => sum + (entry.total || 0), 0)
                                };

                                setTimeSheets(prev => [newTimeSheet, ...prev]);
                                toast({
                                    title: "Thành công",
                                    description: result.message,
                                });
                                return true; // Close dialog
                            }
                            return false;
                        } catch (error) {
                            console.error("Error creating timesheet:", error);
                            toast({
                                title: "Lỗi",
                                description: "Không thể tạo phiếu. Vui lòng thử lại sau.",
                                variant: "destructive",
                            });
                            return false;
                        }
                    }}
                />
            ),
        });
    }, [showDialog, toast]);

    // View a timesheet
    const handleViewTimeSheet = useCallback((timeSheet: TimeSheetType) => {
        showDialog({
            type: DialogType.VIEW,
            title: `Xem phiếu - ${timeSheet.employeeName}`,
            maxWidth: "xl",
            children: (props) => (
                <TimeSheetForm
                    initialData={timeSheet}
                    isReadOnly={true}
                />
            ),
        });
    }, [showDialog]);

    // Edit a timesheet
    const handleEditTimeSheet = useCallback((timeSheet: TimeSheetType) => {
        showDialog({
            type: DialogType.EDIT,
            title: `Chỉnh sửa phiếu - ${timeSheet.employeeName}`,
            maxWidth: "xl",
            children: (props) => (
                <TimeSheetForm
                    initialData={timeSheet}
                    onSubmit={async (data) => {
                        try {
                            const result = await mockUpdateTimeSheet(timeSheet.id!, data);
                            if (result.success) {
                                // Update the timesheet in the list
                                const updatedTimeSheet = {
                                    ...data,
                                    id: timeSheet.id,
                                    status: timeSheet.status,
                                    totalHours: data.entries.reduce((sum, entry) => sum + (entry.total || 0), 0)
                                };

                                setTimeSheets(prev =>
                                    prev.map(ts => ts.id === timeSheet.id ? updatedTimeSheet : ts)
                                );

                                toast({
                                    title: "Thành công",
                                    description: result.message,
                                });
                                return true; // Close dialog
                            }
                            return false;
                        } catch (error) {
                            console.error("Error updating timesheet:", error);
                            toast({
                                title: "Lỗi",
                                description: "Không thể cập nhật phiếu. Vui lòng thử lại sau.",
                                variant: "destructive",
                            });
                            return false;
                        }
                    }}
                />
            ),
        });
    }, [showDialog, toast]);

    // Delete a timesheet
    const handleDeleteTimeSheet = useCallback((id: string) => {
        showDialog({
            type: DialogType.DELETE,
            title: "Xóa phiếu",
            description: "Bạn có chắc chắn muốn xóa phiếu này? Hành động này không thể hoàn tác.",
            onSubmit: async () => {
                try {
                    const result = await mockDeleteTimeSheet(id);
                    if (result.success) {
                        setTimeSheets(prev => prev.filter(ts => ts.id !== id));
                        toast({
                            title: "Thành công",
                            description: result.message,
                        });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error("Error deleting timesheet:", error);
                    toast({
                        title: "Lỗi",
                        description: "Không thể xóa phiếu. Vui lòng thử lại sau.",
                        variant: "destructive",
                    });
                    return false;
                }
            }
        });
    }, [showDialog, toast]);

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">Đã duyệt</Badge>;
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">Chờ duyệt</Badge>;
            case "draft":
                return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">Bản nháp</Badge>;
            default:
                return <Badge variant="outline">Không xác định</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý phiếu theo dõi công đoạn</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Quản lý và theo dõi các phiếu giao chỉ tiêu cá nhân
                    </p>
                </div>
                <Button
                    onClick={handleCreateTimeSheet}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Tạo phiếu mới
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Tìm kiếm theo tên, mã nhân viên..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Cards grid */}
            {isLoading ? (
                // Loading skeleton
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="p-4">
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                            </CardContent>
                            <CardFooter className="p-4 flex justify-between">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : filteredTimeSheets.length === 0 ? (
                // Empty state
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium">Không tìm thấy phiếu nào</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Bạn có thể tạo phiếu mới hoặc thử tìm kiếm với từ khóa khác.
                    </p>
                    <Button
                        onClick={handleCreateTimeSheet}
                        className="mt-4"
                    >
                        Tạo phiếu mới
                    </Button>
                </div>
            ) : (
                // Timesheet cards
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {currentItems.map((timesheet) => (
                            <motion.div
                                key={timesheet.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="h-full flex flex-col">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">{timesheet.employeeName}</CardTitle>
                                            {getStatusBadge(timesheet.status!)}
                                        </div>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(timesheet.date!).toLocaleDateString('vi-VN')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 py-2 flex-grow">
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">Mã NV:</span>
                                                <span className="font-medium">{timesheet.employeeId}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">Đơn vị:</span>
                                                <span>{timesheet.department}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">Tổng giờ:</span>
                                                <span className="font-medium">{timesheet.totalHours} giờ</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">Số công đoạn:</span>
                                                <span>{timesheet.entries.length}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-2 border-t flex justify-between">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">Thao tác</Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewTimeSheet(timesheet)}>
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditTimeSheet(timesheet)}>
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteTimeSheet(timesheet.id!)}
                                                    className="text-red-600 dark:text-red-400"
                                                >
                                                    <Filter className="h-4 w-4 mr-2" />
                                                    Xóa phiếu
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Button variant="default" size="sm" onClick={() => handleViewTimeSheet(timesheet)}>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Chi tiết
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {filteredTimeSheets.length > itemsPerPage && (
                        <div className="mt-6 flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: Math.ceil(filteredTimeSheets.length / itemsPerPage) }).map((_, index) => {
                                        const pageNumber = index + 1;

                                        // Display first page, last page, and pages around current page
                                        if (
                                            pageNumber === 1 ||
                                            pageNumber === Math.ceil(filteredTimeSheets.length / itemsPerPage) ||
                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                        ) {
                                            return (
                                                <PaginationItem key={pageNumber}>
                                                    <PaginationLink
                                                        isActive={pageNumber === currentPage}
                                                        onClick={() => paginate(pageNumber)}
                                                    >
                                                        {pageNumber}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }

                                        // Add ellipsis
                                        if (
                                            pageNumber === 2 ||
                                            pageNumber === Math.ceil(filteredTimeSheets.length / itemsPerPage) - 1
                                        ) {
                                            return (
                                                <PaginationItem key={pageNumber}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            );
                                        }

                                        return null;
                                    })}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => paginate(Math.min(Math.ceil(filteredTimeSheets.length / itemsPerPage), currentPage + 1))}
                                            className={currentPage === Math.ceil(filteredTimeSheets.length / itemsPerPage) ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TimeSheetContainer;