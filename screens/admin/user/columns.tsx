import { TableColumn } from 'react-table-power';
import { UserProfileType } from '@/common/interface/user';
import { UserStatusEnum } from '@/common/enum';
import { Badge } from '@/components/ui/badge';

export const userTableColumns: TableColumn<UserProfileType>[] = [
    {
        accessorKey: 'username',
        header: 'Tên đăng nhập',
        sortable: true,
    },
    {
        accessorKey: 'fullName',
        header: 'Họ và tên',
        sortable: true,
    },
    {
        accessorKey: 'employeeId',
        header: 'Mã nhân viên',
        sortable: true,
    },
    {
        accessorKey: 'email',
        header: 'Email',
        sortable: true,
    },
    {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        cell: ({ row }) => row.phone || '-',
    },
    {
        accessorKey: 'role',
        header: 'Vai trò',
        sortable: true,
        cell: ({ row }) => row.roleEntity?.name || '-',
    },
    {
        accessorKey: 'status',
        header: 'Trạng thái',
        sortable: true,
        // cell: (value: UserStatusEnum) => {
        //     const statusConfig = {
        //         [UserStatusEnum.ACTIVE]: { label: 'Hoạt động', variant: 'success' as const },
        //         [UserStatusEnum.INACTIVE]: { label: 'Không hoạt động', variant: 'secondary' as const },
        //         [UserStatusEnum.PENDING_ACTIVATION]: { label: 'Chờ kích hoạt', variant: 'warning' as const },
        //         [UserStatusEnum.SUSPENDED]: { label: 'Tạm khóa', variant: 'destructive' as const },
        //     };

        //     const config = statusConfig[value] || { label: 'Không xác định', variant: 'secondary' as const };

        //     return <Badge variant={config.variant}>{config.label}</Badge>;
        // },
        cell: ({ row }) => {
            const status = row.status;
            const statusConfig: Record<UserStatusEnum, { label: string; variant: "success" | "secondary" | "warning" | "destructive" }> = {
                [UserStatusEnum.ACTIVE]: { label: 'Hoạt động', variant: 'success' },
                [UserStatusEnum.INACTIVE]: { label: 'Không hoạt động', variant: 'secondary' },
                [UserStatusEnum.PENDING_ACTIVATION]: { label: 'Chờ kích hoạt', variant: 'warning' },
                [UserStatusEnum.SUSPENDED]: { label: 'Tạm khóa', variant: 'destructive' },
            };

            const config = statusConfig[status as UserStatusEnum] || { label: 'Không xác định', variant: 'secondary' };

            return <Badge variant={config.variant}>{config.label}</Badge>;
        },
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
