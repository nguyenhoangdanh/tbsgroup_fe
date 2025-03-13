"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { RoleType } from "@/apis/roles/role.api";
import { TRoleSchema } from "@/schemas/role";
import { useRoleContext } from "@/hooks/roles/roleContext";
import RoleForm from "./form";
import { DialogType, useDialog } from "@/context/DialogProvider";

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
    } = useRoleContext();

    // State for pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Sử dụng useRef để tránh re-render không cần thiết
    const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSubmittingRef = useRef(false);

    // Theo dõi các request đang thực hiện
    const pendingRequestsRef = useRef(new Set<string>());

    // Dialog context
    const { hideDialog, updateDialogData, showDialog } = useDialog();

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
        page,
        limit,
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

    // Sử dụng useCallback để tránh re-render không cần thiết
    // const handleEditRole = useCallback(async (role: RoleType): Promise<boolean> => {
    //     setSelectedRole(role);
    //     return true;
    // }, [setSelectedRole]);
    const handleEditRole = useCallback(async (role: RoleType): Promise<boolean> => {
        setSelectedRole(role);
        showDialog({
            type: DialogType.EDIT,
            title: `Chỉnh sửa vai trò`,
            data: role,
            children: <RoleForm onSubmit={handleRoleFormSubmit} setRoleData={resetRoleData} />
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
        };
    }, [setSelectedRole]);

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
        {
            id: "level",
            header: "Cấp độ",
            cell: ({ row }) => row.original.level,
            accessorKey: "level",
        },
        {
            id: "isSystem",
            header: "Loại vai trò",
            cell: ({ row }) => (
                <Badge variant={row.original.isSystem ? "secondary" : "default"}>
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
            console.log("Updating dialog with selectedRole:", selectedRole.id);
            updateDialogData(selectedRole);
        }
    }, [selectedRole, updateDialogData]);

    console.log("Rendering RoleManagementScreen with roles:", selectedRole);

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
                initialPageSize={limit}
                onDelete={handleDeleteRole}
                onEdit={async (rowData) => {
                    return await handleEditRole(rowData);
                }}
                refetchData={safeRefetch}
                isLoading={isLoading}
                createFormComponent={
                    <RoleForm
                        onSubmit={handleRoleFormSubmit}
                    />
                }
                editFormComponent={
                    <RoleForm
                        onSubmit={handleRoleFormSubmit}
                        setRoleData={resetRoleData}
                    />
                }
            />
        </div>
    );
};

export default RoleManagementScreen;