"use client";

import React, { useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { RoleType } from "@/apis/roles/role.api";
import { TRoleSchema } from "@/schemas/role";
import { useRoleContext } from "@/hooks/roles/roleContext";
import RoleForm from "./form";
import PageLoader from "@/components/common/PageLoader";

const RoleManagementScreen = () => {
    // Get role functionality from context
    const {
        // Queries
        listRoles,

        // Mutations
        deleteRoleMutation,

        // State & actions
        selectedRole,
        setSelectedRole,
        loading,
        activeFilters,

        // Handlers
        handleCreateRole,
        handleUpdateRole,
    } = useRoleContext();

    // State for pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSubmittingRef = useRef(false);

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
        // Disable automatic refetching to prevent loops
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false
    });

    // Safe wrapper for refetch that prevents excessive calls
    const safeRefetch = () => {
        // Clear any existing timeout
        if (refetchTimeoutRef.current) {
            clearTimeout(refetchTimeoutRef.current);
        }

        // Set a new timeout to prevent multiple rapid calls
        refetchTimeoutRef.current = setTimeout(() => {
            refetchRoles();
            refetchTimeoutRef.current = null;
        }, 300);
    };

    // Handle form submission for create/edit with controlled refetch
    const handleRoleFormSubmit = async (data: TRoleSchema): Promise<void | boolean> => {
        try {
            // Set flag to prevent unnecessary refetches
            isSubmittingRef.current = true;

            // If it has ID, it's an update operation
            if (data.id) {
                const { id, createdAt, updatedAt, ...updateData } = data;
                await handleUpdateRole(id, updateData);
            } else {
                // Otherwise it's a create operation
                const { id, createdAt, updatedAt, ...createData } = data;
                await handleCreateRole(createData);
            }

            // After successful submission, do exactly ONE controlled refetch
            safeRefetch();

            isSubmittingRef.current = false;
            return true;
        } catch (error) {
            console.error("Error submitting role form:", error);
            isSubmittingRef.current = false;
            return false;
        }
    };

    // Handle role deletion with controlled refetch
    const handleDeleteRole = async (id: string): Promise<void> => {
        try {
            isSubmittingRef.current = true;
            await deleteRoleMutation.mutateAsync(id);

            // After successful deletion, do exactly ONE controlled refetch
            safeRefetch();

            isSubmittingRef.current = false;
        } catch (error) {
            console.error("Error deleting role:", error);
            isSubmittingRef.current = false;
        }
    };

    // Handle role edit selection
    const handleEditRole = (role: RoleType) => {
        setSelectedRole(role);
    };

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

    // if (isLoading && !roles.length) {
    //     return <PageLoader />
    // }

    return (
        <div className="container mx-auto py-6">
            <DataTable
                columns={columns}
                data={roles}
                title="Quản lý vai trò"
                description="Quản lý thông tin vai trò trong hệ thống"
                actions={["create", "edit", "delete", "read-only"]}
                searchColumn="name"
                searchPlaceholder="Tìm theo tên vai trò..."
                exportData={true}
                initialPageSize={limit}
                onDelete={handleDeleteRole}
                onEdit={handleEditRole}
                refetchData={safeRefetch}
                isLoading={isLoading}
                createFormComponent={
                    <RoleForm
                        onSubmit={handleRoleFormSubmit}
                    />
                }
                editFormComponent={
                    selectedRole ? (
                        <RoleForm
                            roleData={selectedRole}
                            onSubmit={handleRoleFormSubmit}
                        />
                    ) : undefined
                }
            />
        </div>
    );
};

export default RoleManagementScreen;