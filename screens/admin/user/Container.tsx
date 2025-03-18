"use client";

import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import UserForm from "./form";
import { DataTable } from "@/components/common/table/data-table";
import { getAllUsersQueryFn, User } from "@/apis/user/user.api";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { TUserSchema } from "@/schemas/user";
import { fetchRoles, RoleType } from "@/apis/roles/role.api";
import { useRoleContext } from "@/hooks/roles/roleContext";

const UserContainer = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<RoleType[]>([]);



    const { mutate: fetchUsers } = useMutation({
        mutationFn: getAllUsersQueryFn,
        onSuccess: (data) => {
            setUsers(data);
            setLoading(false);
            toast({
                title: "Đã tải dữ liệu người dùng thành công",
                variant: "default",
            });
        },
        onError: (error) => {
            console.error("Lỗi khi tải dữ liệu người dùng:", error);
            toast({
                title: "Lỗi khi tải dữ liệu người dùng",
                description: "Vui lòng thử lại sau",
                variant: "destructive",
            });
            setLoading(false);
        }
    })

    const {
        mutate: allRoles,
    } = useMutation({
        mutationFn: fetchRoles,
        onSuccess: (data) => {
            if (roles.length === 0 && data) {
                const formattedRoles = data.map(role => ({
                    value: role.id,
                    label: role.name
                }));
                setRoles(formattedRoles);
            }
        },
        onError: (error) => {
            console.error("Lỗi khi lấy dữ liệu vai trò:", error);
            toast({
                title: "Lỗi khi lấy dữ liệu vai trò",
                description: "Vui lòng thử lại sau",
                variant: "destructive",
            });
        }
    });

    useEffect(() => {
        fetchUsers();
        allRoles();
    }, []);


    // Xử lý xóa người dùng
    const handleDeleteUser = async (id: string) => {
        try {
            // Trong thực tế, bạn sẽ gọi API xóa ở đây
            // await fetch(`/api/users/${id}`, { method: 'DELETE' });

            // Cập nhật state
            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
            toast({
                title: "Đã xóa người dùng thành công",
                variant: "default",
            });
        } catch (error) {
            console.error("Lỗi khi xóa người dùng:", error);
            toast({
                title: "Lỗi khi xóa người dùng",
                description: "Vui lòng thử lại sau",
                variant: "destructive",
            });
        }
    };

    // Xử lý chỉnh sửa người dùng
    const handleEditUser = (userData: User) => {
        setSelectedUser(userData);
    };

    // Xử lý submission từ form
    const handleUserFormSubmit = async (formData: TUserSchema): Promise<void | boolean> => {
        try {
            console.log("Form data submitted:", formData);

            // Nếu có ID thì đang edit, ngược lại là create
            if (formData.id) {
                // Cập nhật user trong state
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.id === formData.id
                            ? { ...user, ...formData as any }
                            : user
                    )
                );

                setSelectedUser(null); // Reset selected user

                toast({
                    title: "Đã cập nhật người dùng thành công",
                    variant: "default",
                });
            } else {
                // Thêm user mới vào state (giả định ID được tạo từ API)
                const newUser: User = {
                    id: `temp-${Date.now()}`,
                    ...formData as any,
                    createdAt: new Date().toISOString(),
                };

                console.log("New user data:", newUser);

                setUsers(prevUsers => [...prevUsers, newUser]);

                toast({
                    title: "Đã tạo người dùng thành công",
                    variant: "default",
                });
            }

            return true;
        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu người dùng:", error);
            toast({
                title: "Lỗi khi lưu dữ liệu người dùng",
                description: "Vui lòng thử lại sau",
                variant: "destructive",
            });
            throw error; // Ném lỗi để DialogProvider không đóng dialog
        }
    };

    // Định nghĩa các cột cho bảng
    const columns: ColumnDef<User>[] = [
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
        },
        {
            id: "role",
            header: "Vai trò",
            cell: ({ row }) => row.original.role,
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
                                    ? "bg-gray-100 text-gray-800 border-gray-200"
                                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }
                    >
                        {status === "ACTIVE"
                            ? "Hoạt động"
                            : status === "INACTIVE"
                                ? "Không hoạt động"
                                : "Chờ duyệt"}
                    </Badge>
                )
            },
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
        },
    ];

    return (
        <div className="container mx-auto py-6">
            {/* DataTable với các action đã được định nghĩa */}
            <DataTable
                columns={columns}
                data={users}
                title="Danh sách người dùng"
                description="Quản lý thông tin tất cả người dùng trong hệ thống"
                actions={["create", "edit", "delete", "read-only"]}
                searchColumn="fullName"
                searchPlaceholder="Tìm theo tên người dùng..."
                exportData={true}
                initialPageSize={10}
                onEdit={handleEditUser}
                isLoading={loading}
                onDelete={(id) => handleDeleteUser(id)}
                createFormComponent={<UserForm
                    userData={null}
                    onSubmit={handleUserFormSubmit}
                    refetchData={fetchUsers}
                    roles={roles}
                />
                }
                // editFormComponent={selectedUser ?
                //     <UserForm
                //         roles={roles}
                //         userData={selectedUser}
                //         onSubmit={handleUserFormSubmit}
                //         refetchData={fetchUsers}
                //     />
                //     : undefined
                // }
                refetchData={fetchUsers}
            />
        </div>
    );
};

export default UserContainer;