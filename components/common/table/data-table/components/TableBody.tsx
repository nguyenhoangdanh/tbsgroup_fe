// file: components/common/table/data-table/components/TableBody.tsx
import React from 'react';
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { BaseData, TActions } from '../types';
import GroupRow from './GroupRow';
import DataRow from './DataRow';

interface DataTableBodyProps<TData extends BaseData> {
    table: any;
    columns: any[];
    actions: TActions[];
    pageIndex: number;
    pageSize: number;
    toggleGroup: (groupValue: string) => void;
    onEdit?: (data: TData) => void;
    onDelete?: (id: string) => Promise<void>;
    refetchData?: () => void;
    editFormComponent?: any;
    viewFormComponent?: any;
    editClickAction?: any;
    className?: string;
}

function DataTableBody<TData extends BaseData>({
    table,
    columns,
    actions,
    pageIndex,
    pageSize,
    toggleGroup,
    onEdit,
    onDelete,
    refetchData,
    editFormComponent,
    viewFormComponent,
    editClickAction,
    className = "",
}: DataTableBodyProps<TData>) {
    const rows = table.getRowModel().rows;

    if (!rows.length) {
        return (
            <TableBody className={className}>
                <TableRow>
                    <TableCell
                        colSpan={columns.length + (actions.includes("edit") || actions.includes("delete") || actions.includes("read-only") ? 2 : 1)}
                        className="h-24 text-center"
                    >
                        Không có dữ liệu.
                    </TableCell>
                </TableRow>
            </TableBody>
        );
    }

    return (
        <TableBody className={className}>
            {rows.map((row: any, rowIndex: number) => {
                // Xác định loại hàng (nhóm hoặc dữ liệu)
                const isGroupRow = Boolean(row.original?.isGroupRow);

                if (isGroupRow) {
                    return (
                        <GroupRow
                            key={`group-${row.original.groupValue}`}
                            row={row}
                            columns={columns}
                            toggleGroup={toggleGroup}
                            actions={actions}
                            pageIndex={pageIndex}
                            pageSize={pageSize}
                        />
                    );
                }

                return (
                    <DataRow
                        key={row.id}
                        row={row}
                        rowIndex={rowIndex}
                        columns={columns}
                        actions={actions}
                        pageIndex={pageIndex}
                        pageSize={pageSize}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        refetchData={refetchData}
                        editFormComponent={editFormComponent}
                        viewFormComponent={viewFormComponent}
                        editClickAction={editClickAction}
                    />
                );
            })}
        </TableBody>
    );
}

// Optimize với memo để tránh re-render không cần thiết
export default React.memo(DataTableBody) as typeof DataTableBody;