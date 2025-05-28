'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { PermissionFormContent } from './PermissionForm';

import { PermissionDTO } from '@/common/types/permission';
import { DataTable } from '@/components/common/table/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogType, useDialog } from '@/contexts/DialogProvider';
import { usePermissionUI } from '@/hooks/permission/usePermissionUI';

export function PermissionsManagement() {
  const {
    permissionsList,
    isLoading,
    handleDeletePermission,
    refetchPermissions,
    getPermissionTypeLabel,
    handleBatchDeletePermissions,
  } = usePermissionUI();

  const { showDialog } = useDialog<PermissionDTO>();

  const columns = useMemo<ColumnDef<PermissionDTO>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => {
          const isAllSelected = table.getIsAllRowsSelected();
          return (
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={value => {
                table.toggleAllRowsSelected(!!value);
              }}
              aria-label="Select all"
              className="w-4 h-4"
            />
          );
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
      {
        accessorKey: 'name',
        header: 'Tên quyền',
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'type',
        header: 'Loại quyền',
        cell: ({ row }) => getPermissionTypeLabel(row.original.type),
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'module',
        header: 'Module',
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'isActive',
        header: 'Trạng thái',
        cell: ({ row }) => (row.original.isActive ? 'Kích hoạt' : 'Ngừng kích hoạt'),
        enableSorting: true,
        enableHiding: false,
      },
    ],
    [getPermissionTypeLabel],
  );

  const openCreateDialog = () => {
    showDialog({
      type: DialogType.CREATE,
      title: 'Tạo mới Quản lý phân quyền',
      children: (dialogProps) => {
        console.log("Creating PermissionFormContent with props:", dialogProps);
        return <PermissionFormContent {...dialogProps} />;
      },
      onSubmit: async () => {
        refetchPermissions();
        return true;
      }
    });
  };

  const openEditDialog = (permission: PermissionDTO) => {
    showDialog({
      type: DialogType.EDIT,
      title: 'Cập nhật Quản lý phân quyền',
      data: permission,
      children: (dialogProps) => {
        console.log("Editing PermissionFormContent with props:", dialogProps);
        return <PermissionFormContent {...dialogProps} />;
      },
      onSubmit: async () => {
        refetchPermissions();
        return true;
      }
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
