'use client';

import { useMemo } from 'react';
import { usePermissionUI } from '@/hooks/permission/usePermissionUI';
import { DialogType, useDialog } from '@/contexts/DialogProvider';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/table/data-table';
import { PermissionForm } from './PermissionForm';
import { Button } from '@/components/ui/button';
import { PermissionDTO } from '@/common/types/permission';

import { Checkbox } from "@/components/ui/checkbox";
export function PermissionsManagement() {
    const {
        permissionsList,
        isLoading,
        handleDeletePermission,
        refetchPermissions,
        getPermissionTypeLabel,
        handleBatchDeletePermissions,
    } = usePermissionUI();

    const { showDialog } = useDialog();

    const columns = useMemo<ColumnDef<PermissionDTO>[]>(() => [
        {
            id: "select",
            header: ({ table }) => {
                const isAllSelected = table.getIsAllRowsSelected();
                return (
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(value) => {
                            table.toggleAllRowsSelected(!!value);
                        }
                        }
                        aria-label="Select all"
                        className="w-4 h-4"
                    />
                )
            },
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={row.getToggleSelectedHandler()}
                    aria-label="Select row"
                    className="w-4 h-4"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 50,
        },
        {
            accessorKey: 'code',
            header: 'Mã quyền',
            cell: ({ row }) => (
                <Button
                    variant="link"
                    className="text-blue-600 hover:text-blue-800 p-0"
                    onClick={() => openEditDialog(row.original)}
                >
                    {row.original.code}
                </Button>
            ),
            enableSorting: true,
            enableHiding: false,
        },
        { accessorKey: 'name', header: 'Tên quyền', enableSorting: true, enableHiding: false },
        {
            accessorKey: 'type',
            header: 'Loại quyền',
            cell: ({ row }) => getPermissionTypeLabel(row.original.type),
            enableSorting: true,
            enableHiding: false,
        },
        { accessorKey: 'module', header: 'Module', enableSorting: true, enableHiding: false },
        {
            accessorKey: 'isActive',
            header: 'Trạng thái',
            cell: ({ row }) => (row.original.isActive ? 'Kích hoạt' : 'Ngừng kích hoạt'),
            enableSorting: true,
            enableHiding: false,
        },
    ], [getPermissionTypeLabel]);

    const openCreateDialog = () => {
        showDialog({
            type: DialogType.CREATE,
            title: 'Tạo quyền mới',
            children: ({ onClose }) => (
                <PermissionForm
                    isOpen={true}
                    isEditing={false}
                />
            ),
        });
    };

    const openEditDialog = (permission: PermissionDTO) => {
        showDialog({
            type: DialogType.EDIT,
            title: 'Cập nhật quyền',
            children: ({ onClose }) => (
                <PermissionForm
                    isOpen={true}
                    initialData={permission}
                    isEditing={true}
                />
            ),
        });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa quyền này?')) {
            await handleDeletePermission(id);
            refetchPermissions();
        }
    };

    return (
        <DataTable
            columns={columns}
            data={permissionsList}
            title="Quản lý phân quyền"
            isLoading={isLoading}
            actions={['create', 'edit', 'delete']}
            createClickAction={openCreateDialog}
            editClickAction={openEditDialog}
            onDelete={handleDelete}
            onBatchDelete={handleBatchDeletePermissions}
            searchColumn="code"
            exportData={true}
        />
    );
}