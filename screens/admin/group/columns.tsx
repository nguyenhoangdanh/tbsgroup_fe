import { TableColumn } from 'react-table-power';
import { Group } from '@/common/interface/group';
import { Badge } from '@/components/ui/badge';

export const groupTableColumns: TableColumn<Group>[] = [
    {
        accessorKey: 'code',
        header: 'Mã nhóm',
        sortable: true,
        width: 120,
    },
    {
        accessorKey: 'name',
        header: 'Tên nhóm',
        sortable: true,
        width: 200,
    },
    {
        accessorKey: 'description',
        header: 'Mô tả',
        cell: ({ row }) => row.description || '-',
        width: 250,
    },
    {
        accessorKey: 'team',
        header: 'Tổ',
        sortable: true,
        cell: ({ row }) => row.team?.name || '-',
        width: 150,
    },
    {
        accessorKey: 'leaders',
        header: 'Trưởng nhóm',
        cell: ({ row }) => {
            const leaders = row.leaders || [];
            if (leaders.length === 0) return '-';
            
            const primaryLeader = leaders.find(l => l.isPrimary);
            if (primaryLeader?.user) {
                return (
                    <div className="flex items-center gap-2">
                        <span>{primaryLeader.user.fullName}</span>
                        <Badge variant="secondary" className="text-xs">Chính</Badge>
                    </div>
                );
            }
            
            return leaders[0]?.user?.fullName || '-';
        },
        width: 180,
    },
    {
        accessorKey: 'users',
        header: 'Số thành viên',
        cell: ({ row }) => {
            const users = row.users || [];
            return (
                <Badge variant="outline">
                    {users.length} thành viên
                </Badge>
            );
        },
        width: 120,
    },
    {
        accessorKey: 'createdAt',
        header: 'Ngày tạo',
        sortable: true,
        cell: ({ row }) => {
            const date = row.createdAt;
            return date ? new Date(date).toLocaleDateString('vi-VN') : '-';
        },
        width: 120,
    },
];
