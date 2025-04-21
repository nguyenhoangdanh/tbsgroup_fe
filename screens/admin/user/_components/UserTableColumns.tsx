import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { UserType } from "@/common/interface/user";

export const UserTableColumns: ColumnDef<UserType>[] = [
    {
        id: "fullName",
        header: "Tên người dùng",
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex items-center gap-2">
                    <div className="font-medium">{user.fullName}</div>
                </div>
            );
        },
        accessorKey: "fullName",
    },
    {
        id: "username",
        header: "Tên đăng nhập",
        cell: ({ row }) => row.original.username,
        accessorKey: "username",
    },
    {
        id: "role",
        header: "Vai trò",
        cell: ({ row }) => row.original.role,
        accessorKey: "role",
    },
    {
        id: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
            const status = row.original.status;
            return (
                <Badge
                    className={
                        status === "ACTIVE"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : status === "INACTIVE"
                                ? "bg-red-500 text-white dark:text-gray-900 border-red-200"
                                : "bg-gray-100 border-yellow-200 text-gray-900 dark:text-gray-800"
                    }
                >
                    {status === "ACTIVE"
                        ? "Hoạt động"
                        : status === "INACTIVE"
                            ? "Không hoạt động"
                            : "Chờ duyệt"}
                </Badge>
            );
        },
        accessorKey: "status",
    },
    {
        id: "lastLogin",
        header: "Đăng nhập cuối",
        cell: ({ row }) => {
            const lastLogin = row.original.lastLogin;
            if (!lastLogin) return "Chưa đăng nhập";
            return new Date(lastLogin).toLocaleString("vi-VN");
        },
    },
    {
        id: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => {
            return new Date(row.original.createdAt).toLocaleString("vi-VN");
        },
        accessorKey: "createdAt",
    },
];