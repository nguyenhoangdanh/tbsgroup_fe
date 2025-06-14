'use client';

import React, { memo, useCallback, useMemo, Suspense } from 'react';
import { DataTable } from 'react-table-power';

import { Group } from '@/common/interface/group';
import { useGroupContext } from '@/hooks/group';

import { groupTableColumns } from './columns';
import GroupFormWrapper from './GroupFormWrapper';

// GroupContainer component that renders DataTable directly
export default memo(function GroupContainer() {
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
  } = useGroupContext();

  // Get data from hook
  const listQuery = getList(activeFilters);
  const tableData = useMemo(() => {
    if (!listQuery.data?.data) return [];
    return listQuery.data.data;
  }, [listQuery.data?.data]);

  // CRUD handlers
  const handleCreateEntity = useCallback(
    async (formData: any) => {
      try {
        const result = await handleCreate(formData);
        if (result) {
          return true;
        }
        return false;
      } catch (error) {
        console.error('Create Group error:', error);
        return false;
      }
    },
    [handleCreate],
  );

  const handleUpdateEntity = useCallback(
    async (id: string, formData: any) => {
      try {
        console.log('Updating Group with ID:', id, 'and data:', formData);
        await handleUpdate(id, formData);
        return true;
      } catch (error) {
        console.error('Update Group error:', error);
        return false;
      }
    },
    [handleUpdate],
  );

  const handleDeleteEntity = useCallback(
    async (id?: string | number) => {
      try {
        await handleDelete(String(id));
        return true;
      } catch (error) {
        console.error('Delete Group error:', error);
        return false;
      }
    },
    [handleDelete],
  );

  // Event handlers
  const eventHandlers = useMemo(
    () => ({
      onCreate: handleCreateEntity,
      onUpdate: handleUpdateEntity,
      onDelete: handleDeleteEntity,
    }),
    [handleCreateEntity, handleUpdateEntity, handleDeleteEntity],
  );

  const enhancedFormWrapper = useCallback(
    (props: any) => (
      <Suspense fallback={<div>Loading form...</div>}>
        <GroupFormWrapper
          {...props}
          additionalData={{
            teams: relatedData?.teams || [],
            leaders: relatedData?.users || [],
          }}
          loadingStates={loadingStates || {}}
        />
      </Suspense>
    ),
    [relatedData, loadingStates],
  );

  // Built-in actions
  const builtInActions = useMemo(
    () => ({
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
    }),
    [enhancedFormWrapper],
  );

  const isLoading =
    loading ||
    listQuery.isLoading ||
    loadingStates?.teams ||
    loadingStates?.leaders;

  return (
    <div className="group-container">
      <DataTable<Group>
        tableId="groups-table"
        title="Quản lý nhóm sản xuất"
        data={tableData}
        columns={groupTableColumns}
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
