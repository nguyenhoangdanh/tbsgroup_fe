// components/digital-forms/DigitalFormTable.tsx (modified)
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DigitalForm, RecordStatus, ShiftType } from '@/common/types/digital-form';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    Search,
    PlusCircle,
    Filter,
    X,
    Eye,
    Edit,
    Trash2,
    FileText,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    useDigitalFormFilters,
    useDigitalFormPagination,
    useDigitalFormQueries,
} from '@/hooks/digital-form';
import useDigitalFormManager from '@/hooks/digital-form/useDigitalFormManager';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { ReportsPanel } from './ReportsPanel';

/**
 * Component to display a list of digital forms with filtering, sorting, and pagination
 * Uses optimized hooks for performance with 5000+ users
 */
export function DigitalFormTable() {
    const router = useRouter();
    const formManager = useDigitalFormManager();

    // Use our custom filter hook
    const {
        filters,
        dateRangeType,
        updateFilter,
        resetFilters,
        setDateRange,
        statusOptions,
        shiftTypeOptions,
        dateRangeOptions,
        DATE_RANGES,
    } = useDigitalFormFilters();

    // Use our pagination hook
    const {
        pagination,
        totalItems,
        totalPages,
        pageNumbers,
        canPrevPage,
        canNextPage,
        setTotalItems,
        goToPage,
        nextPage,
        prevPage,
        setItemsPerPage,
        updateSort,
    } = useDigitalFormPagination();

    // Track expanded filter state
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    // Form to delete (for confirmation dialog)
    const [formToDelete, setFormToDelete] = useState<string | null>(null);

    // Get list query hook
    const {
        data: formsData,
        isLoading,
        isError,
        refetch,
    } = useDigitalFormQueries().listForms(
        {
            ...filters,
            ...pagination,
        },
        {
            // When this query succeeds, update our pagination state
            onSuccess: (data: any) => {
                if (data.total !== totalItems) {
                    setTotalItems(data.total);
                }
            },
        },
    );

    // Callback to handle form navigation
    const handleViewForm = useCallback(
        (form: DigitalForm) => {
            router.push(`/digital-forms/${form.id}`);
        },
        [router],
    );

    // Callback to handle form edit
    const handleEditForm = useCallback(
        (form: DigitalForm) => {
            router.push(`/digital-forms/${form.id}`);
        },
        [router],
    );

    // Callback to handle form deletion
    const handleDeleteClick = useCallback((formId: string) => {
        setFormToDelete(formId);
    }, []);

    // Confirm deletion
    const confirmDelete = useCallback(async () => {
        if (!formToDelete) return;

        try {
            await formManager.deleteForm(formToDelete);
            setFormToDelete(null);
            refetch();
        } catch (error) {
            console.error('Error deleting form:', error);
        }
    }, [formToDelete, formManager, refetch]);

    // Callback to create a new form
    const handleCreateNew = useCallback(() => {
        router.push('/digital-forms/new');
    }, [router]);

    // Handle status badge styling
    const getStatusBadge = (status: RecordStatus) => {
        switch (status) {
            case RecordStatus.DRAFT:
                return (
                    <Badge variant="outline" className="bg-gray-100">
                        Nháp
                    </Badge>
                );
            case RecordStatus.PENDING:
                return (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700">
                        Chờ duyệt
                    </Badge>
                );
            case RecordStatus.CONFIRMED:
                return (
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                        Đã duyệt
                    </Badge>
                );
            case RecordStatus.REJECTED:
                return (
                    <Badge variant="outline" className="bg-red-100 text-red-700">
                        Từ chối
                    </Badge>
                );
            default:
                return null;
        }
    };

    // Format date for display
    const formatDisplayDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
        } catch (error) {
            return 'Không hợp lệ';
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Add the Reports Panel at the top */}
            <ReportsPanel />

            <Card className="w-full">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle>Danh sách biểu mẫu số</CardTitle>
                        <Button onClick={handleCreateNew}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Tạo mới
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Search and filter */}
                    <div className="space-y-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm biểu mẫu..."
                                value={filters.search || ''}
                                onChange={e => updateFilter('search', e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className="text-xs"
                            >
                                <Filter className="h-3 w-3 mr-1" />
                                Bộ lọc {isFilterExpanded ? '▲' : '▼'}
                            </Button>

                            {/* Show clear button only if any filters are applied */}
                            {(filters.search ||
                                filters.status ||
                                filters.shiftType ||
                                filters.dateFrom ||
                                filters.dateTo) && (
                                    <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                                        <X className="h-3 w-3 mr-1" />
                                        Xóa bộ lọc
                                    </Button>
                                )}
                        </div>

                        {/* Expanded filter options */}
                        {isFilterExpanded && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Trạng thái</label>
                                    <Select
                                        value={filters.status || ''}
                                        onValueChange={value =>
                                            value
                                                ? updateFilter('status', value as RecordStatus)
                                                : updateFilter('status', undefined)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tất cả" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Tất cả</SelectItem>
                                            {statusOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Loại ca</label>
                                    <Select
                                        value={filters.shiftType || ''}
                                        onValueChange={value =>
                                            value
                                                ? updateFilter('shiftType', value as ShiftType)
                                                : updateFilter('shiftType', undefined)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tất cả" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Tất cả</SelectItem>
                                            {shiftTypeOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Khoảng thời gian</label>
                                    <Select value={dateRangeType} onValueChange={value => setDateRange(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn khoảng thời gian" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dateRangeOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Custom date picker for CUSTOM date range */}
                                    {dateRangeType === DATE_RANGES.CUSTOM && (
                                        <div className="mt-2">
                                            <DatePickerWithRange
                                                dateFrom={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                                                dateTo={filters.dateTo ? new Date(filters.dateTo) : undefined}
                                                onDateChange={(dateFrom, dateTo) => {
                                                    if (dateFrom) updateFilter('dateFrom', format(dateFrom, 'yyyy-MM-dd'));
                                                    if (dateTo) updateFilter('dateTo', format(dateTo, 'yyyy-MM-dd'));
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table of forms */}
                    {isLoading ? (
                        <div className="flex justify-center my-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : isError ? (
                        <div className="text-center my-8 text-red-500">
                            Lỗi tải dữ liệu. Vui lòng thử lại sau.
                        </div>
                    ) : formsData?.data?.length === 0 ? (
                        <div className="text-center my-8 text-muted-foreground">Không tìm thấy biểu mẫu nào.</div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Mã</TableHead>
                                            <TableHead className="w-[250px]">Tên biểu mẫu</TableHead>
                                            <TableHead className="w-[120px]">Ngày</TableHead>
                                            <TableHead className="w-[120px]">Trạng thái</TableHead>
                                            <TableHead className="w-[150px]">Người tạo</TableHead>
                                            <TableHead className="w-[120px]" align="center">
                                                Thao tác
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formsData?.data?.map(form => (
                                            <TableRow key={form.id}>
                                                <TableCell className="font-medium">{form.formCode}</TableCell>
                                                <TableCell>{form.formName || '—'}</TableCell>
                                                <TableCell>{formatDisplayDate(form.date)}</TableCell>
                                                <TableCell>{getStatusBadge(form.status)}</TableCell>
                                                <TableCell>{form.createdByName || '—'}</TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <FileText className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleViewForm(form)}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    Xem chi tiết
                                                                </DropdownMenuItem>

                                                                {/* Show edit only for DRAFT status */}
                                                                {form.status === RecordStatus.DRAFT && (
                                                                    <DropdownMenuItem onClick={() => handleEditForm(form)}>
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        Chỉnh sửa
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {/* Show delete only for DRAFT or REJECTED status */}
                                                                {(form.status === RecordStatus.DRAFT ||
                                                                    form.status === RecordStatus.REJECTED) && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDeleteClick(form.id)}
                                                                            className="text-red-600"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Xóa
                                                                        </DropdownMenuItem>
                                                                    )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 0 && (
                                <div className="flex justify-between items-center mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Hiển thị {formsData?.data?.length || 0} / {totalItems} biểu mẫu
                                    </div>

                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={prevPage}
                                                    className={
                                                        !canPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                                                    }
                                                />
                                            </PaginationItem>

                                            {pageNumbers.map((page, i) => (
                                                <PaginationItem key={i}>
                                                    {typeof page === 'string' ? (
                                                        <span className="px-4 py-2">...</span>
                                                    ) : (
                                                        <PaginationLink
                                                            onClick={() => goToPage(page)}
                                                            isActive={page === pagination.page}
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    )}
                                                </PaginationItem>
                                            ))}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={nextPage}
                                                    className={
                                                        !canNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                                                    }
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Hiển thị</span>
                                        <Select
                                            value={pagination.limit.toString()}
                                            onValueChange={value => setItemsPerPage(parseInt(value))}
                                        >
                                            <SelectTrigger className="h-8 w-[70px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="25">25</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                                <SelectItem value="100">100</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <span className="text-sm text-muted-foreground">biểu mẫu</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete confirmation dialog */}
            <AlertDialog open={!!formToDelete} onOpenChange={open => !open && setFormToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa biểu mẫu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa biểu mẫu này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


// // components/digital-forms/DigitalFormTable.tsx
// 'use client';

// import { useState, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { DigitalForm, RecordStatus, ShiftType } from '@/common/types/digital-form';
// import { format } from 'date-fns';
// import { vi } from 'date-fns/locale';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import {
//     Pagination,
//     PaginationContent,
//     PaginationItem,
//     PaginationLink,
//     PaginationNext,
//     PaginationPrevious,
// } from '@/components/ui/pagination';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
// import {
//     Loader2,
//     Search,
//     PlusCircle,
//     Filter,
//     X,
//     Eye,
//     Edit,
//     Trash2,
//     FileText,
// } from 'lucide-react';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from '@/components/ui/alert-dialog';
// import {
//     useDigitalFormFilters,
//     useDigitalFormPagination,
//     useDigitalFormQueries,
// } from '@/hooks/digital-form';
// import useDigitalFormManager from '@/hooks/digital-form/useDigitalFormManager';
// import { DatePickerWithRange } from '@/components/ui/date-range-picker';

// /**
//  * Component to display a list of digital forms with filtering, sorting, and pagination
//  * Uses optimized hooks for performance with 5000+ users
//  */
// export function DigitalFormTable() {
//     const router = useRouter();
//     const formManager = useDigitalFormManager();

//     // Use our custom filter hook
//     const {
//         filters,
//         dateRangeType,
//         updateFilter,
//         resetFilters,
//         setDateRange,
//         statusOptions,
//         shiftTypeOptions,
//         dateRangeOptions,
//         DATE_RANGES,
//     } = useDigitalFormFilters();

//     // Use our pagination hook
//     const {
//         pagination,
//         totalItems,
//         totalPages,
//         pageNumbers,
//         canPrevPage,
//         canNextPage,
//         setTotalItems,
//         goToPage,
//         nextPage,
//         prevPage,
//         setItemsPerPage,
//         updateSort,
//     } = useDigitalFormPagination();

//     // Track expanded filter state
//     const [isFilterExpanded, setIsFilterExpanded] = useState(false);

//     // Form to delete (for confirmation dialog)
//     const [formToDelete, setFormToDelete] = useState<string | null>(null);

//     // Get list query hook
//     const {
//         data: formsData,
//         isLoading,
//         isError,
//         refetch,
//     } = useDigitalFormQueries().listForms(
//         {
//             ...filters,
//             ...pagination,
//         },
//         {
//             // When this query succeeds, update our pagination state
//             onSuccess: (data: any) => {
//                 if (data.total !== totalItems) {
//                     setTotalItems(data.total);
//                 }
//             },
//         },
//     );

//     // Callback to handle form navigation
//     const handleViewForm = useCallback(
//         (form: DigitalForm) => {
//             router.push(`/digital-forms/${form.id}`);
//         },
//         [router],
//     );

//     // Callback to handle form edit
//     const handleEditForm = useCallback(
//         (form: DigitalForm) => {
//             router.push(`/digital-forms/${form.id}`);
//         },
//         [router],
//     );

//     // Callback to handle form deletion
//     const handleDeleteClick = useCallback((formId: string) => {
//         setFormToDelete(formId);
//     }, []);

//     // Confirm deletion
//     const confirmDelete = useCallback(async () => {
//         if (!formToDelete) return;

//         try {
//             await formManager.deleteForm(formToDelete);
//             setFormToDelete(null);
//             refetch();
//         } catch (error) {
//             console.error('Error deleting form:', error);
//         }
//     }, [formToDelete, formManager, refetch]);

//     // Callback to create a new form
//     const handleCreateNew = useCallback(() => {
//         router.push('/digital-forms/new');
//     }, [router]);

//     // Handle status badge styling
//     const getStatusBadge = (status: RecordStatus) => {
//         switch (status) {
//             case RecordStatus.DRAFT:
//                 return (
//                     <Badge variant="outline" className="bg-gray-100">
//                         Nháp
//                     </Badge>
//                 );
//             case RecordStatus.PENDING:
//                 return (
//                     <Badge variant="outline" className="bg-amber-100 text-amber-700">
//                         Chờ duyệt
//                     </Badge>
//                 );
//             case RecordStatus.CONFIRMED:
//                 return (
//                     <Badge variant="outline" className="bg-green-100 text-green-700">
//                         Đã duyệt
//                     </Badge>
//                 );
//             case RecordStatus.REJECTED:
//                 return (
//                     <Badge variant="outline" className="bg-red-100 text-red-700">
//                         Từ chối
//                     </Badge>
//                 );
//             default:
//                 return null;
//         }
//     };

//     // Format date for display
//     const formatDisplayDate = (dateString: string) => {
//         try {
//             return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
//         } catch (error) {
//             return 'Không hợp lệ';
//         }
//     };

//     return (
//         <Card className="w-full">
//             <CardHeader className="pb-2">
//                 <div className="flex justify-between items-center">
//                     <CardTitle>Danh sách biểu mẫu số</CardTitle>
//                     <Button onClick={handleCreateNew}>
//                         <PlusCircle className="h-4 w-4 mr-2" />
//                         Tạo mới
//                     </Button>
//                 </div>
//             </CardHeader>

//             <CardContent>
//                 {/* Search and filter */}
//                 <div className="space-y-4 mb-6">
//                     <div className="relative">
//                         <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//                         <Input
//                             placeholder="Tìm kiếm biểu mẫu..."
//                             value={filters.search || ''}
//                             onChange={e => updateFilter('search', e.target.value)}
//                             className="pl-8"
//                         />
//                     </div>

//                     <div className="flex items-center justify-between">
//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => setIsFilterExpanded(!isFilterExpanded)}
//                             className="text-xs"
//                         >
//                             <Filter className="h-3 w-3 mr-1" />
//                             Bộ lọc {isFilterExpanded ? '▲' : '▼'}
//                         </Button>

//                         {/* Show clear button only if any filters are applied */}
//                         {(filters.search ||
//                             filters.status ||
//                             filters.shiftType ||
//                             filters.dateFrom ||
//                             filters.dateTo) && (
//                                 <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
//                                     <X className="h-3 w-3 mr-1" />
//                                     Xóa bộ lọc
//                                 </Button>
//                             )}
//                     </div>

//                     {/* Expanded filter options */}
//                     {isFilterExpanded && (
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                             <div className="space-y-1">
//                                 <label className="text-xs font-medium">Trạng thái</label>
//                                 <Select
//                                     value={filters.status || ''}
//                                     onValueChange={value =>
//                                         value
//                                             ? updateFilter('status', value as RecordStatus)
//                                             : updateFilter('status', undefined)
//                                     }
//                                 >
//                                     <SelectTrigger>
//                                         <SelectValue placeholder="Tất cả" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         <SelectItem value="">Tất cả</SelectItem>
//                                         {statusOptions.map(option => (
//                                             <SelectItem key={option.value} value={option.value}>
//                                                 {option.label}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>

//                             <div className="space-y-1">
//                                 <label className="text-xs font-medium">Loại ca</label>
//                                 <Select
//                                     value={filters.shiftType || ''}
//                                     onValueChange={value =>
//                                         value
//                                             ? updateFilter('shiftType', value as ShiftType)
//                                             : updateFilter('shiftType', undefined)
//                                     }
//                                 >
//                                     <SelectTrigger>
//                                         <SelectValue placeholder="Tất cả" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         <SelectItem value="">Tất cả</SelectItem>
//                                         {shiftTypeOptions.map(option => (
//                                             <SelectItem key={option.value} value={option.value}>
//                                                 {option.label}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>

//                             <div className="space-y-1">
//                                 <label className="text-xs font-medium">Khoảng thời gian</label>
//                                 <Select value={dateRangeType} onValueChange={value => setDateRange(value)}>
//                                     <SelectTrigger>
//                                         <SelectValue placeholder="Chọn khoảng thời gian" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         {dateRangeOptions.map(option => (
//                                             <SelectItem key={option.value} value={option.value}>
//                                                 {option.label}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>

//                                 {/* Custom date picker for CUSTOM date range */}
//                                 {dateRangeType === DATE_RANGES.CUSTOM && (
//                                     <div className="mt-2">
//                                         <DatePickerWithRange
//                                             dateFrom={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
//                                             dateTo={filters.dateTo ? new Date(filters.dateTo) : undefined}
//                                             onDateChange={(dateFrom, dateTo) => {
//                                                 if (dateFrom) updateFilter('dateFrom', format(dateFrom, 'yyyy-MM-dd'));
//                                                 if (dateTo) updateFilter('dateTo', format(dateTo, 'yyyy-MM-dd'));
//                                             }}
//                                         />
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {/* Table of forms */}
//                 {isLoading ? (
//                     <div className="flex justify-center my-8">
//                         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//                     </div>
//                 ) : isError ? (
//                     <div className="text-center my-8 text-red-500">
//                         Lỗi tải dữ liệu. Vui lòng thử lại sau.
//                     </div>
//                 ) : formsData?.data?.length === 0 ? (
//                     <div className="text-center my-8 text-muted-foreground">Không tìm thấy biểu mẫu nào.</div>
//                 ) : (
//                     <>
//                         <div className="rounded-md border">
//                             <Table>
//                                 <TableHeader>
//                                     <TableRow>
//                                         <TableHead className="w-[100px]">Mã</TableHead>
//                                         <TableHead className="w-[250px]">Tên biểu mẫu</TableHead>
//                                         <TableHead className="w-[120px]">Ngày</TableHead>
//                                         <TableHead className="w-[120px]">Trạng thái</TableHead>
//                                         <TableHead className="w-[150px]">Người tạo</TableHead>
//                                         <TableHead className="w-[120px]" align="center">
//                                             Thao tác
//                                         </TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {formsData?.data?.map(form => (
//                                         <TableRow key={form.id}>
//                                             <TableCell className="font-medium">{form.formCode}</TableCell>
//                                             <TableCell>{form.formName || '—'}</TableCell>
//                                             <TableCell>{formatDisplayDate(form.date)}</TableCell>
//                                             <TableCell>{getStatusBadge(form.status)}</TableCell>
//                                             <TableCell>{form.createdByName || '—'}</TableCell>
//                                             <TableCell>
//                                                 <div className="flex justify-center">
//                                                     <DropdownMenu>
//                                                         <DropdownMenuTrigger asChild>
//                                                             <Button variant="ghost" size="icon">
//                                                                 <FileText className="h-4 w-4" />
//                                                             </Button>
//                                                         </DropdownMenuTrigger>
//                                                         <DropdownMenuContent align="end">
//                                                             <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
//                                                             <DropdownMenuSeparator />
//                                                             <DropdownMenuItem onClick={() => handleViewForm(form)}>
//                                                                 <Eye className="h-4 w-4 mr-2" />
//                                                                 Xem chi tiết
//                                                             </DropdownMenuItem>

//                                                             {/* Show edit only for DRAFT status */}
//                                                             {form.status === RecordStatus.DRAFT && (
//                                                                 <DropdownMenuItem onClick={() => handleEditForm(form)}>
//                                                                     <Edit className="h-4 w-4 mr-2" />
//                                                                     Chỉnh sửa
//                                                                 </DropdownMenuItem>
//                                                             )}

//                                                             {/* Show delete only for DRAFT or REJECTED status */}
//                                                             {(form.status === RecordStatus.DRAFT ||
//                                                                 form.status === RecordStatus.REJECTED) && (
//                                                                     <DropdownMenuItem
//                                                                         onClick={() => handleDeleteClick(form.id)}
//                                                                         className="text-red-600"
//                                                                     >
//                                                                         <Trash2 className="h-4 w-4 mr-2" />
//                                                                         Xóa
//                                                                     </DropdownMenuItem>
//                                                                 )}
//                                                         </DropdownMenuContent>
//                                                     </DropdownMenu>
//                                                 </div>
//                                             </TableCell>
//                                         </TableRow>
//                                     ))}
//                                 </TableBody>
//                             </Table>
//                         </div>

//                         {/* Pagination */}
//                         {totalPages > 0 && (
//                             <div className="flex justify-between items-center mt-4">
//                                 <div className="text-sm text-muted-foreground">
//                                     Hiển thị {formsData?.data?.length || 0} / {totalItems} biểu mẫu
//                                 </div>

//                                 <Pagination>
//                                     <PaginationContent>
//                                         <PaginationItem>
//                                             <PaginationPrevious
//                                                 onClick={prevPage}
//                                                 className={
//                                                     !canPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'
//                                                 }
//                                             />
//                                         </PaginationItem>

//                                         {pageNumbers.map((page, i) => (
//                                             <PaginationItem key={i}>
//                                                 {typeof page === 'string' ? (
//                                                     <span className="px-4 py-2">...</span>
//                                                 ) : (
//                                                     <PaginationLink
//                                                         onClick={() => goToPage(page)}
//                                                         isActive={page === pagination.page}
//                                                     >
//                                                         {page}
//                                                     </PaginationLink>
//                                                 )}
//                                             </PaginationItem>
//                                         ))}

//                                         <PaginationItem>
//                                             <PaginationNext
//                                                 onClick={nextPage}
//                                                 className={
//                                                     !canNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'
//                                                 }
//                                             />
//                                         </PaginationItem>
//                                     </PaginationContent>
//                                 </Pagination>

//                                 <div className="flex items-center gap-2">
//                                     <span className="text-sm text-muted-foreground">Hiển thị</span>
//                                     <Select
//                                         value={pagination.limit.toString()}
//                                         onValueChange={value => setItemsPerPage(parseInt(value))}
//                                     >
//                                         <SelectTrigger className="h-8 w-[70px]">
//                                             <SelectValue />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="10">10</SelectItem>
//                                             <SelectItem value="25">25</SelectItem>
//                                             <SelectItem value="50">50</SelectItem>
//                                             <SelectItem value="100">100</SelectItem>
//                                         </SelectContent>
//                                     </Select>
//                                     <span className="text-sm text-muted-foreground">biểu mẫu</span>
//                                 </div>
//                             </div>
//                         )}
//                     </>
//                 )}
//             </CardContent>

//             {/* Delete confirmation dialog */}
//             <AlertDialog open={!!formToDelete} onOpenChange={open => !open && setFormToDelete(null)}>
//                 <AlertDialogContent>
//                     <AlertDialogHeader>
//                         <AlertDialogTitle>Xác nhận xóa biểu mẫu</AlertDialogTitle>
//                         <AlertDialogDescription>
//                             Bạn có chắc chắn muốn xóa biểu mẫu này? Hành động này không thể hoàn tác.
//                         </AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                         <AlertDialogCancel>Hủy</AlertDialogCancel>
//                         <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
//                             Xóa
//                         </AlertDialogAction>
//                     </AlertDialogFooter>
//                 </AlertDialogContent>
//             </AlertDialog>
//         </Card>
//     );
// }
