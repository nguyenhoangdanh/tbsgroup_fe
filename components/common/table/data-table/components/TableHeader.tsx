// file: components/common/table/data-table/components/TableHeader.tsx
import React from 'react';
import { flexRender } from "@tanstack/react-table";
import {
    Table,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BaseData, TActions } from '../types';

interface DataTableHeaderProps<TData extends BaseData, TValue> {
    table: any;
    columns: any[];
    actions: TActions[];
}

function DataTableHeader<TData extends BaseData, TValue>({
    table,
    columns,
    actions
}: DataTableHeaderProps<TData, TValue>) {
    return (
        <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
                <TableRow key={headerGroup.id}>
                    <TableHead key="select" className="whitespace-nowrap">
                        STT
                    </TableHead>
                    {headerGroup.headers.map((header: any) => (
                        <TableHead key={header.id} className="whitespace-nowrap">
                            {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                )}
                        </TableHead>
                    ))}
                    {(actions.includes("edit") || actions.includes("delete") || actions.includes("read-only")) && (
                        <TableHead key="actions" className="whitespace-nowrap">Thao tác</TableHead>
                    )}
                </TableRow>
            ))}
        </TableHeader>
    );
}

// Optimize with memo to prevent unnecessary re-renders
export default React.memo(DataTableHeader) as typeof DataTableHeader;