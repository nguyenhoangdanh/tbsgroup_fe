import { TableColumn } from 'react-table-power';

import { Factory } from '@/common/interface/factory';
import { Badge } from '@/components/ui/badge';

export const factoryTableColumns: TableColumn<Factory>[] = [
    {
        accessorKey: 'code',
        header: 'Mã nhà máy',
        sortable: true,
    },
    {
        accessorKey: 'name',
        header: 'Tên nhà máy',
        sortable: true,
    },
    {
        accessorKey: 'description',
        header: 'Mô tả',
        cell: ({ row }) => row.description || '-',
    },
    {
        accessorKey: 'address',
        header: 'Địa chỉ',
        cell: ({ row }) => row.address || '-',
    },
    {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        cell: ({ row }) => row.phone || '-',
    },
    {
        accessorKey: 'department',
        header: 'Phòng ban',
        sortable: true,
        cell: ({ row }) => row.department?.name || '-',
    },
    {
        accessorKey: 'managingDepartment',
        header: 'Phòng ban quản lý',
        sortable: true,
        cell: ({ row }) => row.managingDepartment?.name || '-',
    },
    {
        accessorKey: 'createdAt',
        header: 'Ngày tạo',
        sortable: true,
        cell: ({ row }) => {
            const date = row.createdAt;
            return date ? new Date(date).toLocaleDateString('vi-VN') : '-';
        },
    },
];
