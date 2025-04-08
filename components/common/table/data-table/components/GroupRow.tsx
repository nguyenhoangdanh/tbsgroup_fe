// Completely fixed GroupRow.tsx with proper typing and ReactNode error fix

import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Row } from "@tanstack/react-table";
import { BaseData, TActions, GroupRowProps } from '../types';

function GroupRow<TData extends BaseData>({
    row,
    columns,
    toggleGroup,
    actions,
    pageIndex,
    pageSize
}: GroupRowProps<TData>) {
    // Handle event safely
    const safeToggleGroup = (e: React.MouseEvent, groupValue: string | undefined) => {
        e.preventDefault();
        e.stopPropagation();

        if (!groupValue) {
            console.error("Attempted to toggle group with no value");
            return;
        }

        console.log("Toggling group:", groupValue); // Add this for debugging
        toggleGroup(groupValue);
    };

    // Make the entire row clickable to toggle the group
    const handleRowClick = (e: React.MouseEvent) => {
        if (row.original?.groupValue) {
            safeToggleGroup(e, row.original.groupValue);
        }
    };

    // If row.original is undefined or doesn't have the required properties, render nothing
    if (!row.original || !row.original.groupValue) {
        return null;
    }

    const groupValue = row.original.groupValue || '';
    const isExpanded = Boolean(row.original.isExpanded);

    // Fix the ReactNode type error by ensuring groupName is a string
    const groupNameValue = row.original.groupName;
    const groupName = typeof groupNameValue === 'string'
        ? groupNameValue
        : typeof groupValue === 'string'
            ? groupValue
            : '';

    const groupCount = typeof row.original.groupCount === 'number' ? row.original.groupCount : 0;

    return (
        <TableRow
            key={`group-${groupValue}`}
            data-state={row.getIsSelected() && "selected"}
            className="group-row cursor-pointer"
            onClick={handleRowClick}
        >
            <TableCell key="select" className="py-2">
                <span className="text-xs text-muted-foreground">Nhóm</span>
            </TableCell>

            {row.getVisibleCells().map((cell) => {
                const column = cell.column;

                // For the first column, show the group header with expand/collapse button
                if (column.id === columns[0].id) {
                    return (
                        <TableCell key={cell.id} className="py-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => safeToggleGroup(e, groupValue)}
                                    className="h-6 w-6 p-0 flex-shrink-0 expand-button"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </Button>
                                <span className="font-medium truncate">
                                    {groupName}
                                </span>
                                <span className="px-2 py-0.5 ml-auto bg-gray-100 dark:bg-gray-800 text-xs rounded-full group-count">
                                    {groupCount}
                                </span>
                            </div>
                        </TableCell>
                    );
                }

                // Other cells in group row should be empty
                return <TableCell key={cell.id} className="py-2"></TableCell>;
            })}

            {/* Empty actions cell for group row */}
            {(actions.includes("edit") || actions.includes("delete") || actions.includes("read-only")) && (
                <TableCell key={`${row.id}-actions`} className="py-2"></TableCell>
            )}
        </TableRow>
    );
}

// Use memo for performance optimization
export default React.memo(GroupRow) as typeof GroupRow;