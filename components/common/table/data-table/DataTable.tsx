import React, { useEffect, useRef, useState } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Table } from "@/components/ui/table";
import { useTheme } from "next-themes";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { useTableGrouping } from './hooks/useTableGrouping';
import { useServerPagination } from './hooks/useServerPagination';
import { DataTableProps, BaseData } from "./types";
import DataTableHeader from "./components/TableHeader";
import DataTableBody from "./components/TableBody";
import TableToolbar from "./components/TableToolbar";
import TablePagination from "./components/TablePagination";
import GroupControls from "./components/GroupControls";
import BatchDeleteButton from "./components/BatchDeleteButton";
import { CreateActionDialog } from "../actions/popup-create";
import { TableSkeleton } from "../TableSkeleton";
import './table.css';

// Default options
const pageSizeOptions = [5, 10, 20, 50, 100];

export function DataTable<TData extends BaseData, TValue>({
    columns,
    data,
    title,
    description,
    createFormComponent,
    editFormComponent,
    viewFormComponent,
    createClickAction,
    editClickAction,
    viewClickAction,
    actions,
    refetchData,
    onDelete,
    onBatchDelete,
    onEdit,
    onSelected,
    searchColumn,
    searchPlaceholder = "Tìm kiếm...",
    exportData = false,
    exportFormats = ["csv", "excel", "pdf"],
    isLoading = false,
    children,
    initialPageIndex = 0,
    initialPageSize = 10,
    totalItems,
    serverSidePagination = false,
    onPageChange,
    disablePagination = false,
    serverPageSize = 20,
    customSearchFunction,

    // Row grouping props
    enableRowGrouping = false,
    groupByField,
    initialExpandedGroups = false,
    enableBatchUpdate = false,
    enableBatchDelete = false,
    forceGrouping = false,
}: DataTableProps<TData, TValue>) {
    const { theme } = useTheme();
    const { showDialog } = useDialog();
    const tableRef = useRef<any>(null);

    // Table state
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [searchValue, setSearchValue] = useState("");

    // Use custom hooks
    const {
        pageIndex,
        pageSize,
        setPageIndex,
        setPageSize,
        isDataFetching,
        isPaginationChange,
        resetDataFetching
    } = useServerPagination({
        initialPageIndex,
        initialPageSize,
        serverSidePagination,
        onPageChange,
        serverPageSize
    });

    const {
        expandedGroups,
        toggleGroup,
        expandAllGroups,
        collapseAllGroups,
        processedData,
        searchActive,
    } = useTableGrouping({
        data,
        enableRowGrouping,
        groupByField,
        initialExpandedGroups,
        forceGrouping,
        searchValue,
        searchColumn,
        customSearchFunction
    });

    // Reset data fetching state when data changes
    useEffect(() => {
        resetDataFetching();
    }, [data, resetDataFetching]);

    // Prepare data for display based on search and grouping
    const displayData = React.useMemo(() => {
        // For server-side pagination, we just show the data as is
        if (serverSidePagination) {
            return processedData;
        }

        // For client-side pagination, we need to handle pagination manually
        if (disablePagination) {
            return processedData;
        }

        const start = pageIndex * pageSize;
        const end = Math.min(start + pageSize, processedData.length);
        return processedData.slice(start, end);
    }, [processedData, pageIndex, pageSize, disablePagination, serverSidePagination]);

    // Initialize table
    const table = useReactTable({
        data: displayData,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex,
                pageSize,
            },
        },
        pageCount: serverSidePagination
            ? totalItems != null
                ? Math.ceil(totalItems / pageSize)
                : undefined
            : Math.ceil(processedData.length / pageSize),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: (updater) => {
            const newState = typeof updater === 'function'
                ? updater({ pageIndex, pageSize })
                : updater;

            setPageIndex(newState.pageIndex);
            setPageSize(newState.pageSize);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: (!serverSidePagination && !disablePagination) ? getPaginationRowModel() : undefined,
        manualPagination: true, // We're manually handling pagination
    });

    // Assign to ref for debugging
    tableRef.current = table;

    // Track selected rows for batch operations
    useEffect(() => {
        if (onSelected) {
            const selectedRows = table.getFilteredSelectedRowModel().rows;
            const selectedIds = selectedRows
                .filter(row => !row.original?.isGroupRow)
                .map(row => row.original?.id)
                .filter(Boolean) as string[];

            onSelected(selectedIds);
        }
    }, [table, rowSelection, onSelected]);

    // Fix table height limits
    useEffect(() => {
        // Function to remove height limits that can cause scroll issues
        const removeHeightLimits = () => {
            const elements = document.querySelectorAll('.table-body, .data-table-container, .table-wrapper');
            elements.forEach(el => {
                if (el instanceof HTMLElement) {
                    el.style.maxHeight = 'none';
                    el.style.height = 'auto';
                    el.style.overflow = 'visible';
                }
            });

            // Ensure body scrolls properly
            const body = document.querySelector('body');
            if (body) {
                body.style.overflow = 'auto';
            }
        };

        // Call function immediately
        removeHeightLimits();

        // Set up an interval to ensure limits are removed after any DOM changes
        const intervalId = setInterval(removeHeightLimits, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    // Calculate metadata for display
    const totalRows = serverSidePagination && totalItems ? totalItems : processedData.length;
    const startRow = Math.min(pageIndex * pageSize + 1, totalRows);
    const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
    const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
    const currentPage = pageIndex + 1;

    // Error handling wrapper
    try {
        return (
            <div className="data-table-container rounded-xl bg-white dark:bg-gray-950 border border-gray-200 shadow-sm p-2 sm:p-4">
                {/* Header with title and create button */}
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-4">
                    <span className="text-lg font-semibold">{title}</span>

                    {actions.includes("create") && !isLoading && (
                        <CreateActionDialog
                            name={title}
                            description={description}
                            children={createFormComponent}
                            onClick={createClickAction}
                        />
                    )}
                </div>

                <div className="w-full">
                    {/* Group controls (if grouping is enabled) */}
                    {enableRowGrouping && (
                        <GroupControls
                            enableRowGrouping={enableRowGrouping}
                            expandedGroups={expandedGroups}
                            processedData={processedData}
                            enableBatchUpdate={enableBatchUpdate}
                            table={table}
                            showDialog={showDialog}
                            editFormComponent={editFormComponent}
                            expandAllGroups={expandAllGroups}
                            collapseAllGroups={collapseAllGroups}
                            searchActive={searchActive}
                        />
                    )}

                    {/* Toolbar with search, export and column visibility */}
                    <TableToolbar
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        searchColumn={searchColumn}
                        searchPlaceholder={searchPlaceholder}
                        table={table}
                        exportData={exportData}
                        exportFormats={exportFormats}
                        data={data}
                        columns={columns}
                        title={title}
                    />

                    {/* Table with data */}
                    {isLoading ? (
                        <div className="w-full">
                            <TableSkeleton
                                columns={columns.length + (actions.includes("edit") || actions.includes("delete") || actions.includes("read-only") ? 1 : 0)}
                                rows={initialPageSize}
                                darkMode={theme === 'dark'}
                            />
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <Table>
                                <DataTableHeader
                                    table={table}
                                    columns={columns}
                                    actions={actions}
                                />
                                <DataTableBody
                                    className="table-body"
                                    table={table}
                                    columns={columns}
                                    actions={actions}
                                    pageIndex={pageIndex}
                                    pageSize={pageSize}
                                    toggleGroup={toggleGroup}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    refetchData={refetchData}
                                    editFormComponent={editFormComponent}
                                    viewFormComponent={viewFormComponent}
                                    editClickAction={editClickAction}
                                />
                            </Table>
                        </div>
                    )}

                    {/* Batch delete button */}
                    {onBatchDelete && (
                        <BatchDeleteButton
                            table={table}
                            onBatchDelete={onBatchDelete}
                            refetchData={refetchData}
                            showDialog={showDialog}
                        />
                    )}

                    {/* Pagination */}
                    {!disablePagination && (
                        <TablePagination
                            disablePagination={disablePagination}
                            pageIndex={pageIndex}
                            pageSize={pageSize}
                            pageCount={pageCount}
                            currentPage={currentPage}
                            startRow={startRow}
                            endRow={endRow}
                            totalRows={totalRows}
                            isDataFetching={isDataFetching}
                            serverSidePagination={serverSidePagination}
                            table={table}
                            pageSizeOptions={pageSizeOptions}
                            setPageIndex={setPageIndex}
                            setPageSize={setPageSize}
                            isPaginationChange={isPaginationChange}
                        />
                    )}

                    {/* Children if any */}
                    {children}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error rendering data table:", error);
        return (
            <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded">
                <h3 className="font-bold">Lỗi khi hiển thị bảng dữ liệu</h3>
                <p>Đã xảy ra lỗi khi hiển thị bảng. Vui lòng tải lại trang.</p>
                <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                    {error instanceof Error ? error.message : String(error)}
                </pre>
            </div>
        );
    }
}