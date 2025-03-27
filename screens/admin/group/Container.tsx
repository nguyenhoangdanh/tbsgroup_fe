"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { useGroup } from "@/hooks/group/GroupProcessContext";
import { Group } from "@/common/interface/group";
import GroupForm from "./form";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "next-themes";
import { DashboardCardComponent } from "@/components/common/layouts/admin/DashboardCard";
import { List, CheckCircle2, AlertCircle, Settings } from "lucide-react";

const GroupManagementScreen: React.FC = React.memo(() => {
    // Get dialog context and group context
    const { theme } = useTheme();
    const {
        groups,
        isLoading,
        stats,
        calculatedPaginationMeta,
        initialPageIndex,
        handleDeleteGroup,
        handleEditGroup,
        handleGroupFormSubmit,
        handleBatchDelete,
        handlePageChange,
        safeRefetch
    } = useGroup();

    // Table columns definition
    const columns: ColumnDef<Group>[] = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => {
                const isAllSelected = table.getIsAllPageRowsSelected();
                const isSomeSelected = table.getIsSomePageRowsSelected();
                const checkboxState = isAllSelected ? true : isSomeSelected ? "indeterminate" : false;

                return (
                    <Checkbox
                        checked={checkboxState}
                        onCheckedChange={(value) => {
                            table.toggleAllPageRowsSelected(!!value);
                        }}
                        aria-label="Select all"
                    />
                );
            },
            cell: ({ row }) => {
                const isSelected = row.getIsSelected();

                return (
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(value) => {
                            row.toggleSelected(!!value);
                        }}
                        aria-label="Select row"
                    />
                );
            },
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: "code",
            header: "Mã nhóm",
            cell: ({ row }) => row.original.code,
            accessorKey: "code",
        },
        {
            id: "name",
            header: "Tên nhóm",
            cell: ({ row }) => row.original.name,
            accessorKey: "name",
        },
        {
            id: "team",
            header: "Tổ",
            cell: ({ row }) => row.original.team?.name || "-",
            accessorKey: "team.name",
        },
        {
            id: "description",
            header: "Mô tả",
            cell: ({ row }) => row.original.description || "-",
            accessorKey: "description",
        },
        {
            id: "leaders",
            header: "Số lượng trưởng nhóm",
            cell: ({ row }) => row.original.leaders?.length || 0,
            accessorKey: "leaders.length",
        },
    ], []);

    // Memoized form component to prevent unnecessary re-renders
    const createFormComponent = useMemo(() => (
        <GroupForm onSubmit={handleGroupFormSubmit} />
    ), [handleGroupFormSubmit]);

    const editFormComponent = useMemo(() => (
        <GroupForm onSubmit={handleGroupFormSubmit} />
    ), [handleGroupFormSubmit]);

    const viewFormComponent = useMemo(() => (
        <GroupForm />
    ), []);

    // Define dashboard cards
    const dashboardCards = useMemo(() => [
        {
            title: "Tổng số nhóm",
            description: "Tổng số nhóm trong hệ thống",
            data: stats.totalGroups.toString(),
            icon: List,
            color: "bg-blue-200",
            bgdark: "bg-blue-900",
        },
        {
            title: "Tổng số tổ",
            description: "Số lượng tổ khác nhau",
            data: stats.totalTeams.toString(),
            icon: CheckCircle2,
            color: "bg-green-200",
            bgdark: "bg-green-900",
        },
        {
            title: "Tổng số trưởng nhóm",
            description: "Số lượng trưởng nhóm",
            data: stats.totalLeaders.toString(),
            icon: AlertCircle,
            color: "bg-red-200",
            bgdark: "bg-red-900",
        },
        {
            title: "Nhóm phân loại",
            description: "Số nhóm phân loại khác nhau",
            data: stats.uniqueCategories.toString(),
            icon: Settings,
            color: "bg-purple-200",
            bgdark: "bg-purple-900",
        },
    ], [stats]);

    return (
        <div className="container mx-auto py-6 gap-4 flex flex-col">
            {/* Dashboard Cards */}
            <div className="flex flex-wrap gap-4">
                {dashboardCards.map((card, index) => (
                    <div key={`group-card-${index}`} className="flex-grow basis-60 max-w-xs min-w-60">
                        <DashboardCardComponent
                            {...card}
                            theme={theme}
                        />
                    </div>
                ))}
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={groups}
                title="Quản lý nhóm"
                description="Danh sách các nhóm trong tổ chức"
                actions={["create", "edit", "delete", "read-only"]}
                searchColumn="name"
                searchPlaceholder="Tìm kiếm theo tên nhóm..."
                exportData={true}
                onDelete={handleDeleteGroup}
                onEdit={handleEditGroup}
                refetchData={safeRefetch}
                isLoading={isLoading}
                createFormComponent={createFormComponent}
                editFormComponent={editFormComponent}
                viewFormComponent={viewFormComponent}
                serverSidePagination={true}
                totalItems={calculatedPaginationMeta.totalItems}
                initialPageIndex={initialPageIndex}
                initialPageSize={calculatedPaginationMeta.pageSize}
                onPageChange={handlePageChange}
                onBatchDelete={handleBatchDelete}
            />
        </div>
    )
});

export default GroupManagementScreen;