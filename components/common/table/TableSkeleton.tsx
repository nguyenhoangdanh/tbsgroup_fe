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

interface TableSkeletonProps {
    columns: number;
    rows: number;
}

export function TableSkeleton({ columns = 5, rows = 10 }: TableSkeletonProps) {
    return (
        <div className="w-full animate-pulse">
            {/* Skeleton cho thanh tìm kiếm và nút */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-2 mb-4">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-64"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>

            {/* Skeleton cho bảng */}
            <div className="overflow-x-auto border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {Array.from({ length: columns }).map((_, index) => (
                                <TableHead key={`header-${index}`}>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <TableRow key={`row-${rowIndex}`}>
                                {Array.from({ length: columns }).map((_, cellIndex) => (
                                    <TableCell key={`cell-${rowIndex}-${cellIndex}`} className="py-3">
                                        <div className={`h-5 bg-gray-200 dark:bg-gray-700 rounded w-${getRandomWidth()}`}></div>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Skeleton cho phần phân trang */}
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

// Hàm trợ giúp để tạo độ rộng ngẫu nhiên cho các ô skeleton
function getRandomWidth() {
    const widths = ["16", "20", "24", "32", "40", "full"];
    return widths[Math.floor(Math.random() * widths.length)];
}