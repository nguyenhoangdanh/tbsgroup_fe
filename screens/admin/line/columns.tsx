import { TableColumn } from 'react-table-power';

import { Line } from '@/common/interface/line';
import { Badge } from '@/components/ui/badge';

export const lineTableColumns: TableColumn<Line>[] = [
    {
        accessorKey: 'code',
        header: 'Mã dây chuyền',
        sortable: true,
        width: 120,
    },
    {
        accessorKey: 'name',
        header: 'Tên dây chuyền',
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
        accessorKey: 'factory',
        header: 'Nhà máy',
        sortable: true,
        cell: ({ row }) => row.factory?.name || '-',
        width: 150,
    },
    {
        accessorKey: 'capacity',
        header: 'Công suất',
        sortable: true,
        cell: ({ row }) => {
            const capacity = row.capacity;
            return capacity ? `${capacity} sản phẩm/giờ` : '-';
        },
        width: 120,
    },
    {
        accessorKey: 'status',
        header: 'Trạng thái',
        sortable: true,
        cell: ({ row }) => {
            const status = row.status;
            const statusConfig = {
                'ACTIVE': { label: 'Hoạt động', variant: 'success' as const },
                'INACTIVE': { label: 'Không hoạt động', variant: 'secondary' as const },
                'MAINTENANCE': { label: 'Bảo trì', variant: 'warning' as const },
            };
            
            const config = statusConfig[status] || { label: 'Không xác định', variant: 'secondary' as const };
            
            return <Badge variant={config.variant}>{config.label}</Badge>;
        },
        width: 120,
    },
    {
        accessorKey: 'managers',
        header: 'Người quản lý',
        cell: ({ row }) => {
            const managers = row.managers || [];
            if (managers.length === 0) return '-';
            
            const primaryManager = managers.find(m => m.isPrimary);
            if (primaryManager?.user) {
                return primaryManager.user.fullName;
            }
            
            return managers[0]?.user?.fullName || '-';
        },
        width: 150,
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
