import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

import { LineManager } from '@/common/interface/line';
import { DataTable, BaseData } from '@/components/common/table/data-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

//Create a type that extends BaseData for use with DataTable
interface ManagerData extends BaseData {
  userId: string;
  startDate: string;
  endDate?: string | null;
  isPrimary: boolean;
  user?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
    avatar?: string | null;
  };
}

interface LineManagersTableProps {
  lineId: string;
  factoryId: string;
  managers: LineManager[];
  users: Array<{
    id: string;
    fullName?: string | null;
    email?: string | null;
    avatar?: string | null;
  }>;
  canManage: boolean;
  isLoading?: boolean;
  onAddManager?: () => void;
  onEditManager?: (manager: LineManager) => void;
  onDeleteManager?: (userId: string) => void;
  onRefresh?: () => Promise<void>;
}

export const LineManagersTable: React.FC<LineManagersTableProps> = ({
  managers,
  canManage,
  isLoading = false,
  onAddManager,
  onEditManager,
  onDeleteManager,
  onRefresh,
}) => {
  //  Transform the managers data to include an id property (required by DataTable)
  const managersWithId = useMemo(
    () =>
      managers.map(manager => ({
        ...manager,
        id: manager.userId, // Use userId as the id for DataTable
      })),
    [managers],
  );

  // Define columns for DataTable
  const columns = useMemo<ColumnDef<ManagerData>[]>(
    () => [
      {
        id: 'user',
        header: 'Quản lý',
        accessorFn: row => row.user?.fullName || row.userId, // Add accessorFn for sorting
        cell: ({ row }) => {
          const manager = row.original;
          return (
            <div className="flex items-center space-x-4">
              <Avatar>
                {manager.user?.avatar ? (
                  <AvatarImage src={manager.user.avatar} alt={manager.user?.fullName || 'User'} />
                ) : null}
                <AvatarFallback>
                  {manager.user?.fullName ? manager.user.fullName.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{manager.user?.fullName || manager.userId}</p>
                <p className="text-xs text-muted-foreground">{manager.user?.email || ''}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'duration',
        header: 'Thời gian',
        accessorFn: row => row.startDate, // Add accessorFn for sorting
        cell: ({ row }) => {
          const manager = row.original;
          return (
            <div className="flex flex-col text-sm text-muted-foreground">
              <span>Từ: {new Date(manager.startDate).toLocaleDateString('vi-VN')}</span>
              {manager.endDate && (
                <span>Đến: {new Date(manager.endDate).toLocaleDateString('vi-VN')}</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'isPrimary',
        header: 'Vai trò',
        accessorFn: row => row.isPrimary.toString(), // Add accessorFn for sorting
        cell: ({ row }) => {
          const manager = row.original;
          return manager.isPrimary ? (
            <Badge>Quản lý chính</Badge>
          ) : (
            <Badge variant="outline">Quản lý</Badge>
          );
        },
      },
    ],
    [],
  );

  // Make onDelete handler return a Promise as required by DataTable
  const handleDelete = async (id: string): Promise<void> => {
    if (onDeleteManager) {
      onDeleteManager(id);
    }
    return Promise.resolve();
  };

  // Make onEdit handler match the expected type
  // const handleEdit = (data: BaseData) => {
  //   if (onEditManager) {
  //     const manager = managers.find(m => m.userId === data.id);
  //     if (manager) {
  //       onEditManager(manager);
  //     }
  //   }
  // };

  //  Custom content for empty state
  const emptyStateContent = (
    <div className="flex flex-col items-center justify-center h-32 space-y-2">
      <p className="text-muted-foreground">Chưa có quản lý nào cho dây chuyền này</p>
      {canManage && (
        <Button variant="outline" size="sm" onClick={onAddManager}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm quản lý
        </Button>
      )}
    </div>
  );
  const handleEditClick = useCallback(
    (data: ManagerData) => {
      if (onEditManager) {
        // Find the original manager object from the managers array
        const manager = managers.find(m => m.userId === data.id);
        if (manager) {
          onEditManager(manager);
        }
      }
    },
    [managers, onEditManager],
  );

  return (
    <DataTable
      columns={columns}
      data={managersWithId as ManagerData[]}
      title="Danh sách quản lý"
      description="Những người quản lý dây chuyền"
      actions={canManage ? ['create', 'edit', 'delete'] : []}
      onDelete={handleDelete}
      createClickAction={onAddManager}
      editClickAction={handleEditClick}
      onEdit={data => {
        const manager = managers.find(m => m.userId === data.id);
        if (manager && onEditManager) {
          onEditManager(manager);
        }
      }}
      refetchData={onRefresh}
      searchColumn="user"
      searchPlaceholder="Tìm kiếm quản lý..."
      isLoading={isLoading}
      disablePagination={managers.length <= 10}
      exportData={false}
    >
      {managers.length === 0 && emptyStateContent}
    </DataTable>
  );
};
