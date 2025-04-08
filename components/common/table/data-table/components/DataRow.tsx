// file: components/common/table/data-table/components/DataRow.tsx
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { flexRender } from "@tanstack/react-table";
import { BaseData, TActions } from '../types';
import ButtonGroupAction from '../../actions/button-group-actions';

interface DataRowProps<TData extends BaseData> {
    row: any;
    rowIndex: number;
    columns: any[];
    actions: TActions[];
    pageIndex: number;
    pageSize: number;
    onEdit?: (data: TData) => void;
    onDelete?: (id: string) => Promise<void>;
    refetchData?: () => void;
    editFormComponent?: any;
    viewFormComponent?: any;
    editClickAction?: any;
}

function DataRow<TData extends BaseData>({
    row,
    rowIndex,
    columns,
    actions,
    pageIndex,
    pageSize,
    onEdit,
    onDelete,
    refetchData,
    editFormComponent,
    viewFormComponent,
    editClickAction
}: DataRowProps<TData>) {
    const isChildRow = Boolean(row.original?.isChildRow);

    return (
        <TableRow
            key={row.id}
            data-state={row.getIsSelected() && "selected"}
            className={isChildRow ? 'child-row' : ''}
        >
            <TableCell key="select" className="py-2">
                {pageIndex * pageSize + rowIndex + 1}
            </TableCell>

            {row.getVisibleCells().map((cell: any) => {
                const column = cell.column;

                // Child row styling for the first column
                if (isChildRow && column.id === columns[0].id) {
                    return (
                        <TableCell key={cell.id} className="py-2 pl-8">
                            {flexRender(column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    );
                }

                // Standard cell rendering
                return (
                    <TableCell key={cell.id} className="py-2">
                        {flexRender(column.columnDef.cell, cell.getContext())}
                    </TableCell>
                );
            })}

            {/* Actions column */}
            {(actions.includes("edit") || actions.includes("delete") || actions.includes("read-only")) && (
                <TableCell key={`${row.id}-actions`} className="py-2">
                    <ButtonGroupAction
                        actions={actions}
                        onEdit={(data) => onEdit && onEdit(data)}
                        onDelete={async (id) => onDelete && await onDelete(id)}
                        onRefetchData={refetchData}
                        rowData={row.original}
                        editComponent={editFormComponent}
                        viewComponent={viewFormComponent}
                        editClick={editClickAction}
                    />
                </TableCell>
            )}
        </TableRow>
    );
}

// Optimize với React.memo để cải thiện hiệu suất
export default React.memo(DataRow) as typeof DataRow;