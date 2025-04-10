import React, { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, BaseData } from "@/components/common/table/data-table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeamLeader } from '@/common/interface/team';
import PageLoader from '@/components/common/loading/PageLoader';

// Create a type that extends BaseData for use with DataTable
interface ManagerData extends BaseData {
    userId: string;
    startDate: Date;
    endDate?: Date | null;
    isPrimary: boolean;
    user?: {
        id: string;
        fullName?: string | null;
        email?: string | null;
        avatar?: string | null;
    };
}

interface TeamManagersTableProps {
    teamId: string;
    leaders: TeamLeader[];
    users: Array<{
        id: string;
        fullName?: string | null;
        email?: string | null;
        avatar?: string | null;
    }>;
    canManage: boolean;
    isLoading?: boolean;
    onAddManager?: () => void;
    onEditManager?: (manager: TeamLeader) => void;
    onDeleteManager?: (userId: string) => void;
    onRefresh?: () => Promise<void>;
}

export const TeamManagersTable: React.FC<TeamManagersTableProps> = ({
    teamId,
    leaders,
    users,
    canManage,
    isLoading = false,
    onAddManager,
    onEditManager,
    onDeleteManager,
    onRefresh
}) => {
    const [selectedManager, setSelectedManager] = useState<TeamLeader | null>(null);

    // Transform the leaders data to include an id property (required by DataTable)
    const managersWithId = useMemo(() =>
        leaders.map(leader => ({
            ...leader,
            id: leader.userId // Use userId as the id for DataTable
        })),
        [leaders]);

    // Define columns for DataTable
    const columns = useMemo<ColumnDef<ManagerData>[]>(() => [
        {
            id: "user",
            header: "Người quản lý",
            accessorFn: (row) => row.user?.fullName || row.userId, // Add accessorFn for sorting
            cell: ({ row }) => {
                const manager = row.original;
                return (
                    <div className="flex items-center space-x-4">
                        <Avatar>
                            {manager.user?.avatar ? (
                                <AvatarImage
                                    src={manager.user.avatar}
                                    alt={manager.user?.fullName || 'User'}
                                />
                            ) : null}
                            <AvatarFallback>
                                {manager.user?.fullName
                                    ? manager.user.fullName.charAt(0).toUpperCase()
                                    : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">
                                {manager.user?.fullName || manager.userId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {manager.user?.email || ''}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "duration",
            header: "Thời gian",
            accessorFn: (row) => row.startDate, // Add accessorFn for sorting
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
            id: "isPrimary",
            header: "Vai trò",
            accessorFn: (row) => row.isPrimary.toString(), // Add accessorFn for sorting
            cell: ({ row }) => {
                const manager = row.original;
                return manager.isPrimary ? (
                    <Badge>Trưởng nhóm</Badge>
                ) : (
                    <Badge variant="outline">Thành viên quản lý</Badge>
                );
            },
        }
    ], []);

    // Make onDelete handler return a Promise as required by DataTable
    const handleDelete = async (id: string): Promise<void> => {
        if (onDeleteManager) {
            onDeleteManager(id);
        }
        return Promise.resolve();
    };

    // Make onEdit handler match the expected type
    const handleEditClick = useCallback((data: ManagerData) => {
        if (onEditManager) {
            // Find the original manager object from the leaders array
            const manager = leaders.find(m => m.userId === data.id);
            if (manager) {
                onEditManager(manager);
            }
        }
    }, [leaders, onEditManager]);

    // Custom content for empty state
    const emptyStateContent = (
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
            <p className="text-muted-foreground">Chưa có người quản lý nào cho nhóm này</p>
            {canManage && (
                <Button variant="outline" size="sm" onClick={onAddManager}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm người quản lý
                </Button>
            )}
        </div>
    );

    return (
        <PageLoader isLoading={isLoading}>
            <DataTable
                columns={columns}
                data={managersWithId}
                title="Danh sách quản lý"
                description="Những người quản lý nhóm"
                actions={canManage ? ["create", "edit", "delete"] : []}
                onDelete={handleDelete}
                createClickAction={onAddManager}
                editClickAction={handleEditClick}
                // onEdit is still needed for compatibility with older code
                onEdit={(data) => {
                    const manager = leaders.find(m => m.userId === data.id);
                    if (manager && onEditManager) {
                        onEditManager(manager);
                    }
                }}
                refetchData={onRefresh}
                searchColumn="user"
                searchPlaceholder="Tìm kiếm người quản lý..."
                isLoading={isLoading}
                disablePagination={leaders.length <= 10}
                exportData={false}
            >
                {leaders.length === 0 && emptyStateContent}
            </DataTable>
        </PageLoader>
    );
};