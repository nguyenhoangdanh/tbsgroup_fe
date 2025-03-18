"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { TUserSchema } from "@/schemas/user";
import { useUserContext } from "@/hooks/users/userContext";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { useRoleContext } from "@/hooks/roles/roleContext";
import { UserType } from "@/hooks/users/useUserQueries";
import UserForm from "./form";
import { UserStatusEnum } from "@/common/enum";

const UserContainer = () => {
    // Sử dụng context
    const {
        listUsers,
        selectedUser,
        loading,
        activeFilters,
        handleCreateUser,
        handleUpdateUser,
        handleDeleteUser,
        setSelectedUser,
        resetError,
        updatePagination,
    } = useUserContext();

    // Lấy context của role để có thể hiển thị danh sách role trong form
    const { getAllRoles } = useRoleContext();
    const roleQuery = getAllRoles;

    // Sử dụng useRef để tránh re-render không cần thiết
    const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSubmittingRef = useRef(false);

    // Theo dõi các request đang thực hiện
    const pendingRequestsRef = useRef(new Set<string>());

    // Dialog context
    const { updateDialogData, showDialog } = useDialog();

    // State lưu trữ metadata cho phân trang
    const [paginationMeta, setPaginationMeta] = useState({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: activeFilters.limit || 10
    });

    // Thêm effect để cập nhật dialog khi selectedUser thay đổi
    useEffect(() => {
        if (selectedUser) {
            updateDialogData(selectedUser);
        }
    }, [selectedUser, updateDialogData]);

    // Get users data with filters and pagination
    const {
        data: usersData,
        isLoading: isLoadingUsers,
        refetch: refetchUsers,
        isRefetching
    } = listUsers({
        ...activeFilters,
        // Convert string status to UserStatusEnum if it exists
        status: activeFilters.status ? (activeFilters.status as UserStatusEnum) : undefined
    }, {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        // Thêm caching và stale time để tối ưu hiệu suất
        staleTime: 30000, // 30 seconds
        cacheTime: 300000, // 5 minutes
    });

    // Safe wrapper for refetch that prevents excessive calls
    const safeRefetch = useCallback(() => {
        if (refetchTimeoutRef.current) {
            clearTimeout(refetchTimeoutRef.current);
        }

        // Tạo request ID để theo dõi
        const requestId = `refetch-${Date.now()}`;
        pendingRequestsRef.current.add(requestId);

        refetchTimeoutRef.current = setTimeout(() => {
            refetchUsers().finally(() => {
                pendingRequestsRef.current.delete(requestId);
                refetchTimeoutRef.current = null;
            });
        }, 300);
    }, [refetchUsers]);

    // Thêm hàm xử lý thay đổi trang/limit được tối ưu
    const handlePageChange = useCallback((pageIndex: number, pageSize: number) => {
        // pageIndex từ TanStack Table bắt đầu từ 0, API bắt đầu từ 1
        const apiPage = pageIndex + 1;

        // Nếu không thay đổi, không cần trigger API call
        if (paginationMeta.currentPage === apiPage && paginationMeta.pageSize === pageSize) {
            return;
        }

        // Cập nhật trong context
        updatePagination(apiPage, pageSize);

        // Kích hoạt refetch sau khi cập nhật state
        setTimeout(() => {
            safeRefetch();
        }, 0);
    }, [updatePagination, safeRefetch, paginationMeta.currentPage, paginationMeta.pageSize]);

    // Reset user data với useCallback để tránh re-render không cần thiết
    const resetUserData = useCallback(() => {
        setSelectedUser(null);
    }, [setSelectedUser]);

    // Chuẩn bị danh sách roles để truyền vào form
    const roleOptions = React.useMemo(() => {
        if (!roleQuery.data) return [];

        return roleQuery.data.map(role => ({
            value: role.id,
            label: role.name
        }));
    }, [roleQuery.data]);

    // Handle form submission for create/edit with controlled refetch
    const handleUserFormSubmit = useCallback(async (data: TUserSchema): Promise<boolean> => {
        // Ngăn chặn submit trùng lặp
        if (isSubmittingRef.current) return false;

        const requestId = `submit-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            if (data.id) {
                const { id, ...updateData } = data;
                await handleUpdateUser(id, updateData);
            } else {
                const { id, ...createData } = data;
                await handleCreateUser(createData);
            }

            safeRefetch();
            setSelectedUser(null);
            return true;
        } catch (error) {
            console.error("Error submitting user form:", error);
            return false;
        } finally {
            isSubmittingRef.current = false;
            pendingRequestsRef.current.delete(requestId);
        }
    }, [handleCreateUser, handleUpdateUser, safeRefetch, setSelectedUser]);

    // Handle user deletion
    const handleUserDelete = useCallback(async (id: string): Promise<void> => {
        // Ngăn chặn delete trùng lặp
        if (isSubmittingRef.current) return;

        const requestId = `delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            await handleDeleteUser(id);

            // Nếu user đang được chọn bị xóa, reset selection
            if (selectedUser?.id === id) {
                setSelectedUser(null);
            }

            safeRefetch();
        } catch (error) {
            console.error("Error deleting user:", error);
        } finally {
            isSubmittingRef.current = false;
            pendingRequestsRef.current.delete(requestId);
        }
    }, [handleDeleteUser, safeRefetch, selectedUser, setSelectedUser]);

    // Xử lý khi chọn edit user
    const handleEditUser = useCallback(async (user: UserType): Promise<boolean> => {
        setSelectedUser(user);
        showDialog({
            type: DialogType.EDIT,
            data: user,
        });
        return true;
    }, [setSelectedUser, showDialog]);

    // Đảm bảo cleanup khi unmount
    useEffect(() => {
        return () => {
            // Clear tất cả timers và refs
            if (refetchTimeoutRef.current) {
                clearTimeout(refetchTimeoutRef.current);
            }

            pendingRequestsRef.current.clear();
            isSubmittingRef.current = false;

            // Reset selected user khi unmount để tránh memory leaks
            setSelectedUser(null);
            resetError();
        };
    }, [setSelectedUser, resetError]);

    // Define table columns
    const columns: ColumnDef<UserType>[] = [
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
                                    : "bg-gray-100  border-yellow-200 text-gray-900 dark:text-gray-800"
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

    const users = usersData || [];
    const isLoading = loading || isLoadingUsers || isRefetching;

    // Cập nhật metadata phân trang khi dữ liệu thay đổi
    useEffect(() => {
        if (usersData?.meta) {
            setPaginationMeta({
                totalItems: usersData.meta.totalItems,
                totalPages: usersData.meta.totalPages,
                currentPage: usersData.meta.currentPage,
                pageSize: usersData.meta.itemsPerPage
            });
        }
    }, [usersData]);

    const initialPageIndex = Math.max(0, (paginationMeta.currentPage || 1) - 1);

    return (
        <div className="container mx-auto py-6">
            <DataTable
                columns={columns}
                data={users}
                title="Quản lý người dùng"
                description="Quản lý thông tin người dùng trong hệ thống"
                actions={["create", "edit", "delete", "read-only"]}
                searchColumn="fullName"
                searchPlaceholder="Tìm theo tên người dùng..."
                exportData={true}
                onDelete={handleUserDelete}
                onEdit={handleEditUser}
                refetchData={safeRefetch}
                isLoading={isLoading}
                createFormComponent={
                    <UserForm
                        onSubmit={handleUserFormSubmit}
                        roles={roleOptions}
                    />
                }
                editFormComponent={
                    <UserForm
                        onSubmit={handleUserFormSubmit}
                        roles={roleOptions}
                    />
                }
                viewFormComponent={
                    <UserForm
                        roles={roleOptions}
                        isReadOnly={true}
                    />
                }
                serverSidePagination={true}
                totalItems={paginationMeta.totalItems}
                initialPageIndex={initialPageIndex}
                initialPageSize={paginationMeta.pageSize}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default UserContainer;