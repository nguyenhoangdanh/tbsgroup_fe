"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { RoleType } from "@/apis/roles/role.api";
import { TRoleSchema } from "@/schemas/role";
import { useRoleContext } from "@/hooks/roles/roleContext";
import RoleForm from "./form";
import { DialogType, useDialog } from "@/contexts/DialogProvider";

const RoleManagementScreen = () => {
    // Context và queries - sử dụng useSelector pattern để tránh re-render không cần thiết
    const {
        listRoles,
        deleteRoleMutation,
        setSelectedRole,
        selectedRole,
        loading,
        activeFilters,
        handleCreateRole,
        handleUpdateRole,
        resetError,
        updatePagination,
    } = useRoleContext();


    // Sử dụng useRef để tránh re-render không cần thiết
    const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSubmittingRef = useRef(false);
    const isInitialFetchRef = useRef(true);


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



    // Thêm effect để cập nhật dialog khi selectedRole thay đổi
    // Đảm bảo dependencies array chính xác để tránh re-render không cần thiết
    useEffect(() => {
        if (selectedRole) {
            updateDialogData(selectedRole);
        }
    }, [selectedRole, updateDialogData]);

    // Get roles data with filters and pagination
    const {
        data: rolesData,
        isLoading: isLoadingRoles,
        refetch: refetchRoles,
        isRefetching
    } = listRoles({
        ...activeFilters
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
            refetchRoles().finally(() => {
                pendingRequestsRef.current.delete(requestId);
                refetchTimeoutRef.current = null;
            });
        }, 300);
    }, [refetchRoles]);


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
        // Sử dụng setTimeout để đảm bảo state đã được cập nhật
        setTimeout(() => {
            safeRefetch();
        }, 0);
    }, [updatePagination, safeRefetch, paginationMeta.currentPage, paginationMeta.pageSize]);

    // Reset role data với useCallback để tránh re-render không cần thiết
    const resetRoleData = useCallback(() => {
        setSelectedRole(null);
    }, [setSelectedRole]);

    // Handle form submission for create/edit with controlled refetch
    const handleRoleFormSubmit = useCallback(async (data: TRoleSchema): Promise<boolean> => {
        // Ngăn chặn submit trùng lặp
        if (isSubmittingRef.current) return false;

        const requestId = `submit-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            if (data.id) {
                const { id, createdAt, updatedAt, ...updateData } = data;
                await handleUpdateRole(id, updateData);
            } else {
                const { id, createdAt, updatedAt, ...createData } = data;
                await handleCreateRole(createData);
            }

            safeRefetch();
            setSelectedRole(null);
            return true;
        } catch (error) {
            console.error("Error submitting role form:", error);
            return false;
        } finally {
            isSubmittingRef.current = false;
            pendingRequestsRef.current.delete(requestId);
        }
    }, [handleCreateRole, handleUpdateRole, safeRefetch, setSelectedRole]);

    // Handle role deletion
    const handleDeleteRole = useCallback(async (id: string): Promise<void> => {
        // Ngăn chặn delete trùng lặp
        if (isSubmittingRef.current) return;

        const requestId = `delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            await deleteRoleMutation.mutateAsync(id);

            // Nếu role đang được chọn bị xóa, reset selection
            if (selectedRole?.id === id) {
                setSelectedRole(null);
            }

            safeRefetch();
        } catch (error) {
            console.error("Error deleting role:", error);
        } finally {
            isSubmittingRef.current = false;
            pendingRequestsRef.current.delete(requestId);
        }
    }, [deleteRoleMutation, safeRefetch, selectedRole, setSelectedRole]);

    const handleEditRole = useCallback(async (role: RoleType): Promise<boolean> => {
        setSelectedRole(role);
        showDialog({
            type: DialogType.EDIT,
            // title: `Chỉnh sửa quyền: ${role.name}`,
            data: role,
        });
        return true;
    }, [setSelectedRole, showDialog, handleRoleFormSubmit, resetRoleData]);

    // Đảm bảo cleanup khi unmount
    useEffect(() => {
        return () => {
            // Clear tất cả timers và refs
            if (refetchTimeoutRef.current) {
                clearTimeout(refetchTimeoutRef.current);
            }

            pendingRequestsRef.current.clear();
            isSubmittingRef.current = false;

            // Reset selected role khi unmount để tránh memory leaks
            setSelectedRole(null);
            resetError();
        };
    }, [setSelectedRole, resetError]);

    // Define table columns
    const columns: ColumnDef<RoleType>[] = [
        {
            id: "code",
            header: "Mã vai trò",
            cell: ({ row }) => row.original.code,
            accessorKey: "code",
        },
        {
            id: "name",
            header: "Tên vai trò",
            cell: ({ row }) => row.original.name,
            accessorKey: "name",
        },
        // {
        //     id: "level",
        //     header: "Cấp độ",
        //     cell: ({ row }) => row.original.level,
        //     accessorKey: "level",
        // },
        {
            id: "isSystem",
            header: "Loại vai trò",
            cell: ({ row }) => (
                <Badge
                    className="text-xs text-center"
                    variant={row.original.isSystem ? "secondary" : "default"}>
                    {row.original.isSystem ? "Hệ thống" : "Người dùng"}
                </Badge>
            ),
            accessorKey: "isSystem",
        },
        {
            id: "description",
            header: "Mô tả",
            cell: ({ row }) => row.original.description || "-",
            accessorKey: "description",
        },
    ];

    const roles = rolesData || [];
    const isLoading = loading || isLoadingRoles || isRefetching;

    useEffect(() => {
        if (selectedRole) {
            updateDialogData(selectedRole);
        }
    }, [selectedRole, updateDialogData]);


    const initialPageIndex = Math.max(0, (paginationMeta.currentPage || 1) - 1);

    const createForm = useMemo(() => {
        return (
            <RoleForm
                onSubmit={handleRoleFormSubmit}
            />
        );
    }
        , [handleRoleFormSubmit]);

    const editForm = useMemo(() => {
        return (
            <RoleForm
                onSubmit={handleRoleFormSubmit}
            />
        );
    }
        , [handleRoleFormSubmit]);
    const viewForm = useMemo(() => {
        return <RoleForm />
    }, []);

    return (
        <div className="container mx-auto py-6">
            <DataTable
                columns={columns}
                data={roles}
                title="Quản lý quyền người dùng"
                description="Quản lý thông tin quyền người dùng trong hệ thống"
                actions={["create", "edit", "delete", "read-only"]}
                searchColumn="name"
                searchPlaceholder="Tìm theo tên quyền..."
                exportData={true}
                onDelete={handleDeleteRole}
                refetchData={safeRefetch}
                isLoading={isLoading}
                createFormComponent={createForm}
                editFormComponent={editForm}
                viewFormComponent={viewForm}
                serverSidePagination={true}
                totalItems={paginationMeta.totalItems}
                initialPageIndex={initialPageIndex}
                initialPageSize={paginationMeta.pageSize}
                onPageChange={handlePageChange}
                serverPageSize={20}
            />
        </div>
    );
};

export default RoleManagementScreen;