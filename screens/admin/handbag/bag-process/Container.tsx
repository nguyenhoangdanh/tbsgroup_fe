'use client';
import { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, CheckCircle2, List, Settings } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useMemo } from 'react';

import BagProcessForm from './form';

import { BagProcess } from '@/common/interface/handbag';
import { DashboardCardComponent } from '@/components/common/layouts/admin/DashboardCard';
import { DataTable } from '@/components/common/table/data-table';
import { Checkbox } from '@/components/ui/checkbox';
import { useBagProcess } from '@/hooks/handbag/bag-process/BagProcessContext';

const BagProcessManagementScreen: React.FC = React.memo(() => {
  // Get dialog context
  const {
    bagProcesses,
    isLoading,
    stats,
    calculatedPaginationMeta,
    initialPageIndex,
    handleDeleteBagProcess,
    handleEditBagProcess,
    handleBagProcessFormSubmit,
    handleBatchDelete,
    handlePageChange,
    safeRefetch,
  } = useBagProcess();

  const { theme } = useTheme();

  // Table columns definition
  const columns: ColumnDef<BagProcess>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => {
          //Stabilize the selection state to prevent infinite updates
          const isAllSelected = table.getIsAllPageRowsSelected();
          const isSomeSelected = table.getIsSomePageRowsSelected();
          const checkboxState = isAllSelected ? true : isSomeSelected ? 'indeterminate' : false;

          return (
            <Checkbox
              checked={checkboxState}
              onCheckedChange={value => {
                // Use a stable callback that won't recreate on each render
                table.toggleAllPageRowsSelected(!!value);
              }}
              aria-label="Select all"
            />
          );
        },
        cell: ({ row }) => {
          // Stabilize the row selection state
          const isSelected = row.getIsSelected();

          return (
            <Checkbox
              checked={isSelected}
              onCheckedChange={value => {
                //   Use a stable callback that won't recreate on each render
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
        id: 'code',
        header: 'Mã công đoạn',
        cell: ({ row }) => row.original.code,
        accessorKey: 'code',
      },
      {
        id: 'name',
        header: 'Tên công đoạn',
        cell: ({ row }) => row.original.name,
        accessorKey: 'name',
      },
      {
        id: 'processType',
        header: 'Loại công đoạn',
        cell: ({ row }) => row.original.processType || '-',
        accessorKey: 'processType',
      },
      {
        id: 'standardOutput',
        header: 'Sản lượng tiêu chuẩn',
        cell: ({ row }) => row.original.standardOutput || '-',
        accessorKey: 'standardOutput',
      },
      {
        id: 'description',
        header: 'Mô tả',
        cell: ({ row }) => row.original.description || '-',
        accessorKey: 'description',
      },
    ],
    [],
  );

  // Memoized form components to prevent unnecessary re-renders
  const createFormComponent = useMemo(
    () => <BagProcessForm onSubmit={handleBagProcessFormSubmit} />,
    [handleBagProcessFormSubmit],
  );

  const editFormComponent = useMemo(
    () => <BagProcessForm onSubmit={handleBagProcessFormSubmit} />,
    [handleBagProcessFormSubmit],
  );

  const viewFormComponent = useMemo(() => <BagProcessForm />, []);

  // Define dashboard cards
  const dashboardCards = useMemo(
    () => [
      {
        title: 'Tổng số công đoạn',
        description: 'Tổng số công đoạn trong hệ thống',
        data: stats.totalProcesses.toString(),
        icon: List,
        color: 'bg-blue-200',
        bgdark: 'bg-blue-900',
      },
      {
        title: 'Công đoạn hoạt động',
        description: 'Số lượng công đoạn đang hoạt động',
        data: stats.activeProcesses.toString(),
        icon: CheckCircle2,
        color: 'bg-green-200',
        bgdark: 'bg-green-900',
      },
      {
        title: 'Công đoạn không hoạt động',
        description: 'Số lượng công đoạn không hoạt động',
        data: stats.inactiveProcesses.toString(),
        icon: AlertCircle,
        color: 'bg-red-200',
        bgdark: 'bg-red-900',
      },
      {
        title: 'Nhóm công đoạn',
        description: 'Số nhóm công đoạn khác nhau',
        data: stats.uniqueCategories.toString(),
        icon: Settings,
        color: 'bg-purple-200',
        bgdark: 'bg-purple-900',
      },
    ],
    [stats],
  );

  return (
    <div className="container mx-auto py-6 gap-4 flex flex-col">
      {/* Dashboard Cards */}
      <div className="flex flex-wrap gap-4">
        {dashboardCards.map((card, index) => (
          <div key={`bagprocess-card-${index}`} className="flex-grow basis-60 max-w-xs min-w-60">
            <DashboardCardComponent {...card} theme={theme} />
          </div>
        ))}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={bagProcesses}
        title="Quản lý công đoạn"
        description="Danh sách các công đoạn sản xuất túi xách"
        actions={['create', 'edit', 'delete', 'read-only']}
        searchColumn="name"
        searchPlaceholder="Tìm kiếm theo tên công đoạn..."
        exportData={true}
        onDelete={handleDeleteBagProcess}
        onEdit={handleEditBagProcess}
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
  );
});

BagProcessManagementScreen.displayName = 'BagProcessManagementScreen';

export default BagProcessManagementScreen;
