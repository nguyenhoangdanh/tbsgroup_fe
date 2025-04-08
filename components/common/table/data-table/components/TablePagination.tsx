// file: components/common/table/data-table/components/TablePagination.tsx
import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TablePaginationProps {
    disablePagination: boolean;
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    currentPage: number;
    startRow: number;
    endRow: number;
    totalRows: number;
    isDataFetching: boolean;
    serverSidePagination: boolean;
    table: any;
    pageSizeOptions: number[];
    setPageIndex: (index: number) => void;
    setPageSize: (size: number) => void;
    isPaginationChange: React.MutableRefObject<boolean>;
}

function TablePagination({
    disablePagination,
    pageIndex,
    pageSize,
    pageCount,
    currentPage,
    startRow,
    endRow,
    totalRows,
    isDataFetching,
    serverSidePagination,
    table,
    pageSizeOptions,
    setPageIndex,
    setPageSize,
    isPaginationChange
}: TablePaginationProps) {
    if (disablePagination) return null;

    // Generate pagination range with intelligent ellipsis
    const getPageRange = () => {
        const range: (number | 'ellipsis')[] = [];

        if (pageCount <= 7) {
            // If fewer than 7 pages, show all
            for (let i = 1; i <= pageCount; i++) {
                range.push(i);
            }
        } else {
            // Always show first page
            range.push(1);

            // Determine which pages to show based on current page
            if (currentPage <= 3) {
                range.push(2, 3, 4, 'ellipsis');
            } else if (currentPage >= pageCount - 2) {
                range.push('ellipsis', pageCount - 3, pageCount - 2, pageCount - 1);
            } else {
                range.push('ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis');
            }

            // Always show last page
            if (pageCount > 1) {
                range.push(pageCount);
            }
        }

        return range;
    };

    const pageRange = getPageRange();

    const handlePreviousPage = () => {
        if (pageIndex > 0) {
            isPaginationChange.current = true;
            setPageIndex(pageIndex - 1);
        }
    };

    const handleNextPage = () => {
        if (pageIndex < pageCount - 1) {
            isPaginationChange.current = true;
            setPageIndex(pageIndex + 1);
        }
    };

    const handlePageClick = (page: number) => {
        isPaginationChange.current = true;
        setPageIndex(page - 1);
    };

    const handlePageSizeChange = (value: string) => {
        isPaginationChange.current = true;
        const newSize = Number(value);
        setPageSize(newSize);
        setPageIndex(0);
    };

    return (
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center justify-between py-4">
            {/* Page info and page size selector */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span>
                        Hiển thị {totalRows > 0 ? startRow : 0}-
                        {totalRows > 0 ? endRow : 0} trên {totalRows} dòng
                    </span>
                </div>

                <div className="flex items-center whitespace-nowrap">
                    <span className="text-sm mr-2">Hiển thị</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={handlePageSizeChange}
                    >
                        <SelectTrigger className="h-8 w-20">
                            <SelectValue>{pageSize}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={String(size)}>
                                    {size} dòng
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-sm ml-2">mỗi trang</span>
                </div>
            </div>

            {/* Selected rows info */}
            <div className="text-sm text-muted-foreground text-center">
                Đã chọn {table.getFilteredSelectedRowModel().rows.length} / {" "}
                {table.getFilteredRowModel().rows.length} dòng
            </div>

            {/* Pagination */}
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={handlePreviousPage}
                            aria-disabled={pageIndex === 0}
                            className={pageIndex === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                    </PaginationItem>

                    {pageRange.map((page, index) =>
                        page === 'ellipsis' ? (
                            <PaginationItem key={`ellipsis-${index}`}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        ) : (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    isActive={page === currentPage}
                                    onClick={() => handlePageClick(Number(page))}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        )
                    )}

                    <PaginationItem>
                        <PaginationNext
                            onClick={handleNextPage}
                            aria-disabled={pageIndex >= pageCount - 1}
                            className={pageIndex >= pageCount - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>

            {/* Optional loading indicator for server-side pagination */}
            {serverSidePagination && isDataFetching && (
                <div className="flex items-center justify-center py-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-sm text-muted-foreground">Đang tải dữ liệu...</span>
                </div>
            )}
        </div>
    );
}

// Optimize with memo to prevent unnecessary re-renders
export default React.memo(TablePagination) as typeof TablePagination;