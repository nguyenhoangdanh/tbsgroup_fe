'use client';

import React, { memo, useCallback, useMemo, Suspense } from 'react';
import { DataTable } from 'react-table-power';
import { Line } from '@/common/interface/line';
import { lineTableColumns } from './columns';
import LineFormWrapper from './LineFormWrapper';
import { useLineContext } from '@/hooks/line';

// LineContainer component that renders DataTable directly
export default memo(function LineContainer() {
  const {
    getList,
    handleCreate,
    handleUpdate,
    handleDelete,
    activeFilters,
    loading,
    error,
    relatedData,
    loadingStates,
  } = useLineContext();

  // Get data from hook
  const listQuery = getList(activeFilters);
  const tableData = useMemo(() => {
    if (!listQuery.data?.data) return [];
    return listQuery.data.data;
  }, [listQuery.data?.data]);

  // CRUD handlers
  const handleCreateEntity = useCallback(async (formData: any) => {
    try {
      const result = await handleCreate(formData);
      if (result) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Create Line error:', error);
      return false;
    }
  }, [handleCreate]);

  const handleUpdateEntity = useCallback(async (id: string, formData: any) => {
    try {
      console.log('Updating Line with ID:', id, 'and data:', formData);
      await handleUpdate(id, formData);
      return true;
    } catch (error) {
      console.error('Update Line error:', error);
      return false;
    }
  }, [handleUpdate]);

  const handleDeleteEntity = useCallback(async (id?: string | number) => {
    try {
      await handleDelete(String(id));
      return true;
    } catch (error) {
      console.error('Delete Line error:', error);
      return false;
    }
  }, [handleDelete]);

  // Event handlers
  const eventHandlers = useMemo(() => ({
    onCreate: handleCreateEntity,
    onUpdate: handleUpdateEntity, 
    onDelete: handleDeleteEntity,
  }), [handleCreateEntity, handleUpdateEntity, handleDeleteEntity]);

  const enhancedFormWrapper = useCallback((props: any) => (
    <Suspense fallback={<div>Loading form...</div>}>
      <LineFormWrapper
        {...props}
        additionalData={{
          factories: relatedData?.factories || [],
          managers: relatedData?.managers || [],
        }}
        loadingStates={loadingStates || {}}
      />
    </Suspense>
  ), [relatedData, loadingStates]);

  // Built-in actions
  const builtInActions = useMemo(() => ({
    create: true,
    edit: true,
    delete: true,
    view: true,
    createFormComponent: enhancedFormWrapper,
    editFormComponent: enhancedFormWrapper,
    viewFormComponent: (props: any) => enhancedFormWrapper({ ...props, isReadOnly: true }),
    formHandling: {
      autoHandleFormSubmission: true,
      skipInitialValidation: true,
    },
  }), [enhancedFormWrapper]);

  const isLoading = loading ||
    listQuery.isLoading ||
    loadingStates?.factories ||
    loadingStates?.managers;

  return (
    <div className="line-container">
      <DataTable<Line>
        tableId="lines-table"
        title="Quản lý dây chuyền sản xuất"
        data={tableData}
        columns={lineTableColumns}
        loading={isLoading}
        pagination={true}
        selection={{ enabled: true }}
        eventHandlers={eventHandlers}
        builtInActions={builtInActions}
        globalSearch={{ enabled: true }}
        export={{ enabled: true }}
        dialog={{
          closeOnClickOutside: false,
          closeOnEsc: true,
        }}
      />
    </div>
  );
});
