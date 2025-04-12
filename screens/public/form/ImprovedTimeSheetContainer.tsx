import React, { useState, useCallback, useMemo } from "react";
import { TimeSheetType } from "@/schemas/timesheet";
import { Button } from "@/components/ui/button";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { Plus, FileText, Clock, Filter, Search, Calendar, Download, Check, X, FileCog, FileWarning } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
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
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
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
import { STATUS_OPTIONS, getStatusColor, getStatusLabel } from "@/schemas/timesheet";
import TimeSheetForm from "./_components/TimeSheetForm";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportTimesheetToPDF, exportTimesheetToExcel } from "@/utils/timesheet-utils";
import { useTimesheet } from "./useTimesheet";

const ImprovedTimeSheetContainer: React.FC = () => {
    // Local state
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "all">("pdf");

    // Hooks
    const { toast } = useToast();
    const { showDialog } = useDialog();

    // Use custom hook for timesheet management
    const {
        timesheets,
        selectedTimesheet,
        loading,
        pagination,
        createTimesheet,
        updateTimesheet,
        deleteTimesheet,
        deleteMultipleTimesheets,
        changeTimesheetStatus,
        setSelectedTimesheet,
        updateFilters,
        updatePagination,
        fetchTimesheets,
    } = useTimesheet({
        initialFilters: {
            limit: 8,
            page: 1
        }
    });

    // Filter timesheets based on search term and status
    const filteredTimesheets = useMemo(() => {
        return timesheets.filter(sheet => {
            // Search filter
            const matchesSearch = !searchTerm.trim() ||
                sheet.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sheet.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sheet.department.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchesStatus = !statusFilter || sheet.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [timesheets, searchTerm, statusFilter]);

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
                            await createTimesheet(data);
                            return true; // Close dialog
                        } catch (error) {
                            return false;
                        }
                    }}
                />
            ),
        });
    }, [showDialog, createTimesheet]);

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
                            await updateTimesheet(timeSheet.id!, data);
                            return true; // Close dialog
                        } catch (error) {
                            return false;
                        }
                    }}
                />
            ),
        });
    }, [showDialog, updateTimesheet]);

    // Handle changing timesheet status
    const handleChangeStatus = useCallback(async (id: string, status: "draft" | "pending" | "approved" | "rejected") => {
        try {
            await changeTimesheetStatus(id, status);
            toast({
                title: "Thành công",
                description: `Trạng thái phiếu đã được thay đổi thành: ${getStatusLabel(status)}`,
            });
        } catch (error) {
            // Error is already handled in the hook
        }
    }, [changeTimesheetStatus, toast]);

    // Handle delete timesheet confirmation
    const confirmDeleteTimeSheet = useCallback((id: string) => {
        setItemToDelete(id);
        setShowDeleteAlert(true);
    }, []);

    // Handle actual deletion
    const handleDeleteTimeSheet = useCallback(async () => {
        if (!itemToDelete) return;

        try {
            await deleteTimesheet(itemToDelete);
            setItemToDelete(null);
            setShowDeleteAlert(false);
        } catch (error) {
            // Error is already handled in the hook
        }
    }, [itemToDelete, deleteTimesheet]);

    // Handle bulk deletion
    const handleDeleteSelected = useCallback(async () => {
        if (selectedItems.length === 0) return;

        try {
            await deleteMultipleTimesheets(selectedItems);
            setSelectedItems([]); // Clear selection after deletion
        } catch (error) {
            // Error is already handled in the hook
        }
    }, [selectedItems, deleteMultipleTimesheets]);

    // Handle exporting a timesheet
    const handleExportTimesheet = useCallback((timesheet: TimeSheetType) => {
        try {
            if (exportFormat === "pdf" || exportFormat === "all") {
                exportTimesheetToPDF(timesheet);
            }

            if (exportFormat === "excel" || exportFormat === "all") {
                exportTimesheetToExcel(timesheet);
            }

            toast({
                title: "Xuất phiếu thành công",
                description: "Phiếu công đoạn đã được xuất thành công",
            });
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể xuất phiếu công đoạn",
                variant: "destructive",
            });
        }
    }, [exportFormat, toast]);

    // Handle pagination
    const handlePageChange = useCallback((page: number) => {
        updatePagination(page);
    }, [updatePagination]);

    // Toggle selecting an item
    const toggleSelectItem = useCallback((id: string) => {
        setSelectedItems(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    }, []);

    // Check if all items are selected
    const allSelected = useMemo(() => {
        return filteredTimesheets.length > 0 &&
            filteredTimesheets.every(item => selectedItems.includes(item.id || ''));
    }, [filteredTimesheets, selectedItems]);

    // Toggle selecting all items
    const toggleSelectAll = useCallback(() => {
        if (allSelected) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredTimesheets.map(item => item.id || '').filter(Boolean));
        }
    }, [allSelected, filteredTimesheets]);

    // Format date for display
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    // Render status badge
    const renderStatusBadge = useCallback((status?: string) => {
        const { bg, text } = getStatusColor(status);
        return <Badge className={`${bg} ${text}`}>{getStatusLabel(status)}</Badge>;
    }, []);

    // Calculate pagination information
    const totalPages = Math.ceil((pagination.total || 0) / (pagination.limit || 10));
    const currentPage = pagination.page || 1;

    // Get page number array for rendering pagination
    const getPageNumbers = useCallback(() => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages are less than or equal to max visible pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                // Add ellipsis if current page is far from start
                pages.push(-1); // -1 represents ellipsis
            }

            // Pages around current page
            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                // Add ellipsis if current page is far from end
                pages.push(-2); // -2 represents ellipsis
            }

            // Always show last page if more than one page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    }, [currentPage, totalPages]);

    return (
        <div className="container mx-auto py-8">
            {/* Header */}
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

            {/* Filters and actions */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Tìm kiếm theo tên, mã nhân viên..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Status filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <span>{statusFilter ? getStatusLabel(statusFilter) : "Trạng thái"}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuRadioGroup
                                value={statusFilter}
                                onValueChange={(value) => setStatusFilter(value || undefined)}
                            >
                                <DropdownMenuRadioItem value="">Tất cả</DropdownMenuRadioItem>
                                {STATUS_OPTIONS.map(status => (
                                    <DropdownMenuRadioItem key={status.value} value={status.value}>
                                        {status.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex gap-2 items-center w-full sm:w-auto">
                    {/* Export format selection */}
                    <Select
                        value={exportFormat}
                        onValueChange={(value: "pdf" | "excel" | "all") => setExportFormat(value)}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Định dạng" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="all">Tất cả</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Bulk actions */}
                    {selectedItems.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelected}
                            className="ml-2"
                        >
                            <Trash className="h-4 w-4 mr-1" />
                            Xóa ({selectedItems.length})
                        </Button>
                    )}
                </div>
            </div>

            {/* Select all checkbox */}
            {filteredTimesheets.length > 0 && (
                <div className="flex items-center mb-4">
                    <Checkbox
                        id="select-all"
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                    />
                    <label htmlFor="select-all" className="ml-2 text-sm">
                        Chọn tất cả ({filteredTimesheets.length} phiếu)
                    </label>
                </div>
            )}

            {/* Cards grid */}
            {loading ? (
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
            ) : filteredTimesheets.length === 0 ? (
                // Empty state
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium">Không tìm thấy phiếu nào</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        {searchTerm || statusFilter
                            ? "Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác."
                            : "Bạn có thể tạo phiếu mới bằng cách nhấn nút 'Tạo phiếu mới'."}
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
                        {filteredTimesheets.map((timesheet) => (
                            <motion.div
                                key={timesheet.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="group relative"
                            >
                                {/* Selection checkbox */}
                                <div className="absolute left-2 top-2 z-10">
                                    <Checkbox
                                        id={`select-${timesheet.id}`}
                                        checked={selectedItems.includes(timesheet.id || '')}
                                        onCheckedChange={() => toggleSelectItem(timesheet.id || '')}
                                    />
                                </div>

                                <Card className="h-full flex flex-col group-hover:border-primary/50 transition-all">
                                    <CardHeader className="p-4 pb-2 pl-10">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">{timesheet.employeeName}</CardTitle>
                                            {renderStatusBadge(timesheet.status)}
                                        </div>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatDate(timesheet.date)}
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
                                                    <FileCog className="h-4 w-4 mr-2" />
                                                    Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleExportTimesheet(timesheet)}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Xuất phiếu
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                {/* Status change options */}
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                        <Clock className="h-4 w-4 mr-2" />
                                                        Thay đổi trạng thái
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        {STATUS_OPTIONS.map(status => (
                                                            <DropdownMenuItem
                                                                key={status.value}
                                                                disabled={timesheet.status === status.value}
                                                                onClick={() => handleChangeStatus(
                                                                    timesheet.id!,
                                                                    status.value as "draft" | "pending" | "approved" | "rejected"
                                                                )}
                                                            >
                                                                {status.value === "approved" && <Check className="h-4 w-4 mr-2 text-green-500" />}
                                                                {status.value === "rejected" && <X className="h-4 w-4 mr-2 text-red-500" />}
                                                                {status.value === "pending" && <FileWarning className="h-4 w-4 mr-2 text-yellow-500" />}
                                                                {status.value === "draft" && <FileText className="h-4 w-4 mr-2 text-gray-500" />}
                                                                {status.label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>

                                                <DropdownMenuSeparator />

                                                {/* Delete option */}
                                                <DropdownMenuItem
                                                    onClick={() => confirmDeleteTimeSheet(timesheet.id!)}
                                                    className="text-red-600 dark:text-red-400"
                                                >
                                                    <Trash className="h-4 w-4 mr-2" />
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
                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>

                                    {getPageNumbers().map((pageNum, index) => {
                                        if (pageNum < 0) {
                                            // Render ellipsis
                                            return (
                                                <PaginationItem key={`ellipsis-${index}`}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            );
                                        }

                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    isActive={pageNum === currentPage}
                                                    onClick={() => handlePageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            )}

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa phiếu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa phiếu này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTimeSheet} className="bg-red-500 hover:bg-red-600">
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

// Add missing components
function Checkbox({ id, checked, onCheckedChange }: {
    id: string,
    checked?: boolean,
    onCheckedChange?: (checked: boolean) => void
}) {
    return (
        <div className="flex items-center space-x-2">
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
        </div>
    );
}

function Trash({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>;
}

// Dropdown submenu components
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => {
    return <div className="relative">{children}</div>;
};

const DropdownMenuSubTrigger = ({ children }: { children: React.ReactNode }) => {
    return (
        <button className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent">
            {children}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto h-4 w-4">
                <path d="m9 18 6-6-6-6" />
            </svg>
        </button>
    );
};

const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="absolute left-full top-0 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 shadow-md animate-in slide-in-from-left-1">
            {children}
        </div>
    );
};

export default ImprovedTimeSheetContainer;