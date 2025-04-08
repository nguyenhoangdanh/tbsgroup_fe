// Updated GroupControls.tsx with proper typing and fixed typo

import React from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronDownIcon, ChevronRightIcon, EditIcon, FolderIcon } from "lucide-react";
import { DialogType } from "@/context/DialogProvider";
import { BaseData, GroupControlsProps, GroupedData } from '../types';

function GroupControls<TData extends BaseData>({
    enableRowGrouping,
    expandedGroups,
    processedData,
    enableBatchUpdate,
    table,
    showDialog,
    editFormComponent,
    expandAllGroups,
    collapseAllGroups,
    searchActive = false,
}: GroupControlsProps<TData>) {
    if (!enableRowGrouping) return null;

    // Check group states
    const hasExpandedGroups = Object.values(expandedGroups).some(Boolean);
    const hasCollapsedGroups = processedData.some(
        row => Boolean(row.isGroupRow && !row.isExpanded)
    );

    // Safe handlers
    const safeExpandAllGroups = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        expandAllGroups();
    };

    const safeCollapseAllGroups = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        collapseAllGroups();
    };

    return (
        <div className="flex gap-2 mb-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-1">
                        <FolderIcon className="h-4 w-4 mr-1" />
                        Nhóm
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem
                        onClick={safeExpandAllGroups}
                        disabled={!hasCollapsedGroups || searchActive}
                    >
                        <ChevronDownIcon className="h-4 w-4 mr-2" />
                        Mở rộng tất cả
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={safeCollapseAllGroups}
                        disabled={!hasExpandedGroups || searchActive}
                    >
                        <ChevronRightIcon className="h-4 w-4 mr-2" />
                        Thu gọn tất cả
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {enableBatchUpdate && (
                <Button
                    onClick={() => {
                        // Get all selected rows that belong to the same group
                        const selectedRows = table.getFilteredSelectedRowModel().rows;
                        const selectedRowIds = selectedRows
                            .filter(row => !row.original?.isGroupRow)
                            .map(row => row.original?.id)
                            .filter(Boolean) as string[];

                        if (selectedRowIds.length === 0) return;

                        // Show batch edit form
                        showDialog({
                            type: DialogType.EDIT,
                            title: "Chỉnh sửa hàng loạt",
                            data: { selectedIds: selectedRowIds },
                            children: editFormComponent
                        });
                    }}
                    variant="outline"
                    disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                    className="flex items-center gap-1"
                >
                    <EditIcon className="h-4 w-4 mr-1" />
                    Chỉnh sửa hàng loạt
                </Button>
            )}
        </div>
    );
}

// Optimize with memo to prevent unnecessary re-renders
export default React.memo(GroupControls) as typeof GroupControls;