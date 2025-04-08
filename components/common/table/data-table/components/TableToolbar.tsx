// file: components/common/table/data-table/components/TableToolbar.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    ChevronDown,
    Download,
    FileSpreadsheet,
    FileText,
    FileType,
    Search
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { BaseData } from '../types';
import { exportCSV, exportExcel, exportPDF } from '../utils/exportUtils';

interface TableToolbarProps<TData extends BaseData, TValue> {
    searchValue: string;
    setSearchValue: (value: string) => void;
    searchColumn?: string;
    searchPlaceholder?: string;
    table: any;
    exportData?: boolean;
    exportFormats?: Array<"csv" | "excel" | "pdf">;
    data: TData[];
    columns: ColumnDef<TData, TValue>[];
    title: string;
}

function TableToolbar<TData extends BaseData, TValue>({
    searchValue,
    setSearchValue,
    searchColumn,
    searchPlaceholder = "Tìm kiếm...",
    table,
    exportData = false,
    exportFormats = ["csv", "excel", "pdf"],
    data,
    columns,
    title
}: TableToolbarProps<TData, TValue>) {
    // Xử lý xuất dữ liệu
    const handleExportData = (format: "csv" | "excel" | "pdf") => {
        if (!data.length) return;

        switch (format) {
            case "csv":
                exportCSV(data, columns, title);
                break;
            case "excel":
                exportExcel(data, columns, title);
                break;
            case "pdf":
                exportPDF(data, columns, title);
                break;
        }
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-4 gap-2">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                {searchColumn && (
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="pl-8 w-full"
                        />
                    </div>
                )}

                {exportData && data.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 w-full sm:w-auto justify-center"
                            >
                                <Download className="h-4 w-4" />
                                <span className="sm:inline">Xuất dữ liệu</span>
                                <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {(!exportFormats || exportFormats.includes("csv")) && (
                                <DropdownMenuCheckboxItem
                                    className="cursor-pointer"
                                    onClick={() => handleExportData("csv")}
                                >
                                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                    CSV (.csv)
                                </DropdownMenuCheckboxItem>
                            )}
                            {(!exportFormats || exportFormats.includes("excel")) && (
                                <DropdownMenuCheckboxItem
                                    className="cursor-pointer"
                                    onClick={() => handleExportData("excel")}
                                >
                                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
                                    Excel (.xlsx)
                                </DropdownMenuCheckboxItem>
                            )}
                            {(!exportFormats || exportFormats.includes("pdf")) && (
                                <DropdownMenuCheckboxItem
                                    className="cursor-pointer"
                                    onClick={() => handleExportData("pdf")}
                                >
                                    <FileType className="h-4 w-4 mr-2 text-red-500" />
                                    PDF (.pdf)
                                </DropdownMenuCheckboxItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Column visibility dropdown */}
            <div className="flex gap-2 w-full sm:w-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:ml-auto sm:w-auto">
                            <span className="mr-1">Cột</span><ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column: any) => column.getCanHide())
                            .map((column: any) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {typeof column.columnDef.header === "string"
                                            ? column.columnDef.header
                                            : column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

// Optimize with memo to prevent unnecessary re-renders
export default React.memo(TableToolbar) as typeof TableToolbar;