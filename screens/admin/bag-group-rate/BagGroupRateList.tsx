'use client';

import { ColumnDef } from '@tanstack/react-table';
import { BarChart } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

import { BagGroupRateContextBridge } from './BagGroupRateContextBridge';
import MultiGroupBatchWrapper from './MultiGroupBatchWrapper';

import { BagGroupRate } from '@/common/interface/bag-group-rate';
import removeAccents, { DataTable } from '@/components/common/table/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { DialogType, useDialog } from '@/contexts/DialogProvider';
import { useBagGroupRateContext } from '@/hooks/group/bag-group-rate/BagGroupRateContext';
import { formatDate } from '@/lib/utils';

interface GroupedBagRate extends BagGroupRate {
  isGroupRow?: boolean;
  isChildRow?: boolean;
  groupValue?: string;
  groupCount?: number;
  isExpanded?: boolean;
  _children?: BagGroupRate[];
}
interface BagGroupRateListProps {
  onShowAnalysis?: (handBagId: string) => void;
}

const BagGroupRateList: React.FC<BagGroupRateListProps> = props => {
  return (
    <BagGroupRateContextBridge>
      <BagGroupRateListContent {...props} />
    </BagGroupRateContextBridge>
  );
};

const BagGroupRateListContent: React.FC<BagGroupRateListProps> = ({ onShowAnalysis }) => {
  const {
    bagGroupRates,
    calculatedPaginationMeta,
    isLoading,
    handlePageChange,
    handleDeleteBagGroupRate,
    handleUpdateBagGroupRate,
    handleBatchCreateBagGroupRates,
    handleBatchUpdateBagGroupRates,
    handleBatchDeleteBagGroupRates,
  } = useBagGroupRateContext();

  const { showDialog } = useDialog();

  const handleToggleActive = useCallback(
    async (id: string, currentActive: boolean) => {
      try {
        await handleUpdateBagGroupRate(id, { active: !currentActive });
      } catch (error) {
        console.error('Error toggling active status:', error);
      }
    },
    [handleUpdateBagGroupRate],
  );

  const handleShowBatchForm = useCallback(() => {
    showDialog({
      type: DialogType.CREATE,
      title: 'Thêm hàng loạt năng suất theo nhóm',
      children: MultiGroupBatchWrapper,
    });
  }, [showDialog]);

  const columns: ColumnDef<GroupedBagRate>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => {
          const allPageRows = table.getRowModel().rows.filter(row => !row.original?.isGroupRow);
          const selectedPageRows = allPageRows.filter(row => row.getIsSelected());

          const isAllSelected =
            allPageRows.length > 0 && selectedPageRows.length === allPageRows.length;
          const isSomeSelected =
            selectedPageRows.length > 0 && selectedPageRows.length < allPageRows.length;

          return (
            <Checkbox
              checked={isAllSelected}
              className="translate-y-[2px]"
              onCheckedChange={value => {
                table.getRowModel().rows.forEach(row => {
                  if (!row.original?.isGroupRow) {
                    row.toggleSelected(!!value);
                  }
                });
              }}
              aria-label="Select all"
            />
          );
        },
        cell: ({ row }) => {
          if (row.original?.isGroupRow) {
            return null;
          }

          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={value => {
                row.toggleSelected(!!value);
              }}
              aria-label="Select row"
              className="translate-y-[2px]"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'bagCode',
        header: 'Mã túi',
        accessorKey: 'bagCode',
        cell: ({ row }) => {
          const bagCode = row.original?.handBagCode || 'N/A';
          const bagName = row.original?.handBagName || '';
          return (
            <div>
              <div className="font-medium">{bagCode}</div>
              <div className="text-sm text-muted-foreground">{bagName}</div>
            </div>
          );
        },
      },
      {
        id: 'groupCode',
        header: 'Nhóm',
        accessorKey: 'group.code',
        cell: ({ row }) => {
          const groupCode = row.original?.groupCode || 'N/A';
          const groupName = row.original?.groupName || '';
          return (
            <div>
              <div className="font-medium">{groupCode}</div>
              <div className="text-sm text-muted-foreground">{groupName}</div>
            </div>
          );
        },
      },
      {
        id: 'outputRate',
        header: 'Năng suất (SP/giờ)',
        accessorKey: 'outputRate',
        cell: ({ row }) => {
          return <div className="text-center font-medium">{row.original.outputRate}</div>;
        },
      },
      {
        id: 'notes',
        header: 'Ghi chú',
        accessorKey: 'notes',
        cell: ({ row }) => {
          return <div className="max-w-[200px] truncate">{row.original.notes || '-'}</div>;
        },
      },
      {
        id: 'active',
        header: 'Trạng thái',
        accessorKey: 'active',
        cell: ({ row }) => {
          return (
            <div className="text-center">
              <Switch
                checked={row.original.active}
                onCheckedChange={() => handleToggleActive(row.original.id, row.original.active)}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          );
        },
      },
      {
        id: 'updatedAt',
        header: 'Cập nhật',
        accessorKey: 'updatedAt',
        cell: ({ row }) => {
          return (
            <div className="text-center text-sm text-muted-foreground">
              {row.original.updatedAt ? formatDate(row.original.updatedAt) : '-'}
            </div>
          );
        },
      },
      {
        id: 'analysis',
        header: 'Phân tích',
        accessorKey: 'analysis',
        cell: ({ row }) => {
          return (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onShowAnalysis && onShowAnalysis(row.original.handBagId)}
              title="Phân tích năng suất"
            >
              <BarChart className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [handleToggleActive, onShowAnalysis],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await handleDeleteBagGroupRate(id);
    },
    [handleDeleteBagGroupRate],
  );

  const handleCustomPageChange = useCallback(
    (pageIndex: number, pageSize: number) => {
      handlePageChange(pageIndex, pageSize);
    },
    [handlePageChange],
  );

  const initialPageIndex = useMemo(
    () => (calculatedPaginationMeta.currentPage ? calculatedPaginationMeta.currentPage - 1 : 0),
    [calculatedPaginationMeta.currentPage],
  );

  const createMultiGroupComponent = (props: any) => (
    <MultiGroupBatchWrapper
      {...props}
      isSubmitting={false}
      onSubmit={async data => {
        const result = await handleBatchCreateBagGroupRates(data);
        return result && result.length > 0;
      }}
      onClose={props.onClose || (() => {})}
    />
  );

  const editMultiGroupComponent = (props: any) => (
    <MultiGroupBatchWrapper
      {...props}
      isEdit={true}
      isSubmitting={false}
      onSubmit={async data => {
        const result = await handleBatchUpdateBagGroupRates(data);
        return result && result.length > 0;
      }}
      onClose={() => props.onClose && props.onClose()}
    />
  );

  const viewMultiGroupComponent = (props: any) => (
    <MultiGroupBatchWrapper
      {...props}
      isReadOnly={true}
      isSubmitting={false}
      onSubmit={async () => false}
      onClose={() => props.onClose && props.onClose()}
    />
  );

  //  const customBagCodeSearch = useCallback((item: BagGroupRate, searchValue: string) => {
  //  const bagCode = item.handBagCode || '';
  //  const bagName = item.handBagName || '';

  //  const normalizedSearchValue = removeAccents(searchValue.toLowerCase());
  //  const normalizedBagCode = removeAccents(bagCode.toLowerCase());
  //  const normalizedBagName = removeAccents(bagName.toLowerCase());

  // return normalizedBagCode.includes(normalizedSearchValue) ||
  // normalizedBagName.includes(normalizedSearchValue);
  // }, []);

  const customBagCodeSearch = useCallback((item: GroupedBagRate, searchValue: string) => {
    if (item.isGroupRow) return false;

    const bagCode = item.handBagCode || '';
    const bagName = item.handBagName || '';

    const normalizedSearchValue = removeAccents(searchValue.toLowerCase().trim());
    const normalizedBagCode = removeAccents(bagCode.toLowerCase().trim());
    const normalizedBagName = removeAccents(bagName.toLowerCase().trim());

    const matches =
      normalizedBagCode.includes(normalizedSearchValue) ||
      normalizedBagName.includes(normalizedSearchValue);

    console.log('Search result:', matches);
    return matches;
  }, []);

  return (
    <div>
      <DataTable
        columns={columns}
        data={bagGroupRates || []}
        title="Danh sách năng suất nhóm túi"
        description="Quản lý năng suất của các nhóm sản xuất túi"
        actions={['delete', 'edit', 'read-only', 'create']}
        searchColumn="handBagCode"
        searchPlaceholder="Tìm kiếm theo mã túi..."
        exportData={true}
        exportFormats={['excel', 'pdf']}
        isLoading={isLoading}
        onDelete={handleDelete}
        initialPageIndex={initialPageIndex}
        initialPageSize={calculatedPaginationMeta.pageSize || 10}
        totalItems={calculatedPaginationMeta.totalItems || 0}
        serverSidePagination={true}
        onPageChange={handleCustomPageChange}
        createFormComponent={createMultiGroupComponent}
        editFormComponent={editMultiGroupComponent}
        viewFormComponent={viewMultiGroupComponent}
        customSearchFunction={customBagCodeSearch}
        onBatchDelete={handleBatchDeleteBagGroupRates}
        enableRowGrouping={true}
        groupByField="handBagCode"
        initialExpandedGroups={false}
        forceGrouping={true}
      />
    </div>
  );
};

export default BagGroupRateList;
