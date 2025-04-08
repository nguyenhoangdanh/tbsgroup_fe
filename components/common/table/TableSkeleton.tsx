// TableSkeleton.tsx
"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import useMediaQuery from "@/hooks/useMediaQuery";

interface TableSkeletonProps {
    columns: number;
    rows: number;
    darkMode?: boolean;
}

export function TableSkeleton({ columns = 5, rows = 10, darkMode = false }: TableSkeletonProps) {
    // Create a stable width pattern based on row and column indices
    // This ensures consistent rendering between server and client
    const getWidthClass = (rowIndex: number, colIndex: number) => {
        const options = ["w-16", "w-24", "w-32", "w-40", "w-full"];
        // Use deterministic formula based on indices to select width
        const index = (rowIndex + colIndex) % options.length;
        return options[index];
    };
    const isMobile = useMediaQuery("(max-width: 640px)");
    const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)")

    // Điều chỉnh thông số dựa vào kích thước màn hình
    const adjustedColumns = React.useCallback(() => {
        if (columns) return columns;
        if (isMobile) return 3;
        if (isTablet) return 4;
        return 5;
    }, [isMobile, isTablet, columns]);

    const adjustedRows = React.useCallback(() => {
        if (rows) return rows;
        if (isMobile) return 4;
        if (isTablet) return 5;
        return 6;
    }, [isMobile, isTablet, rows]);


    return (
        <div className="w-full animate-pulse">
            {/* Skeleton for search bar and buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-2 mb-4">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-64"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>

            {/* Skeleton for table */}
            <div className="overflow-x-auto border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {Array.from({ length: adjustedColumns() }).map((_, index) => (
                                <TableHead key={`header-${index}`}>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* {Array.from({ length: adjustedRows() }).map((_, rowIndex) => (
                            <TableRow key={`row-${rowIndex}`}> */}
                        {Array.from({ length: adjustedColumns() }).map((_, colIndex) => (
                            <TableCell key={`cell-${3}-${colIndex}`} className="py-3">
                                <div
                                    className={`h-5 bg-gray-200 dark:bg-gray-700 rounded ${getWidthClass(3, colIndex)}`}>
                                </div>
                            </TableCell>
                        ))}
                        {/* </TableRow> */}
                        {/* ))} */}
                    </TableBody>
                </Table>
            </div>

            {/* Skeleton for pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-4 mt-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
            </div>
        </div>
    );
}