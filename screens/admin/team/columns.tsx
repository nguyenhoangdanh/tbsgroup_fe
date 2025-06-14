import { TableColumn } from 'react-table-power';

import { Team } from '@/common/interface/team';

export const teamTableColumns: TableColumn<Team>[] = [
    {
        accessorKey: 'code',
        header: 'Mã tổ',
        sortable: true,
        width: 120,
    },
    {
        accessorKey: 'name',
        header: 'Tên tổ',
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
        accessorKey: 'line',
        header: 'Dây chuyền',
        sortable: true,
        cell: ({ row }) => row.line?.name || '-',
        width: 180,
    },
    {
        accessorKey: 'leaders',
        header: 'Trưởng tổ',
        cell: ({ row }) => {
            const leaders = row.leaders || [];
            if (leaders.length === 0) return '-';
            
            const primaryLeader = leaders.find(l => l.isPrimary);
            if (primaryLeader?.user) {
                return primaryLeader.user.fullName;
            }
            
            return leaders[0]?.user?.fullName || '-';
        },
        width: 150,
    },
    {
        accessorKey: 'groups',
        header: 'Số nhóm',
        cell: ({ row }) => {
            const groups = row.groups || [];
            return groups.length > 0 ? `${groups.length} nhóm` : '0 nhóm';
        },
        width: 100,
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
