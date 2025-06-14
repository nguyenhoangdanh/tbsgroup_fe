'use client';

import React, { memo, useCallback, useMemo, Suspense } from 'react';
import { DataTable } from 'react-table-power';
import { Team } from '@/common/interface/team';
import { teamTableColumns } from './columns';
import TeamFormWrapper from './TeamFormWrapper';
import { useTeamContext } from '@/hooks/teams';

// TeamContainer component that renders DataTable directly
export default memo(function TeamContainer() {
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
  } = useTeamContext();

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
      console.error('Create Team error:', error);
      return false;
    }
  }, [handleCreate]);

  const handleUpdateEntity = useCallback(async (id: string, formData: any) => {
    try {
      console.log('Updating Team with ID:', id, 'and data:', formData);
      await handleUpdate(id, formData);
      return true;
    } catch (error) {
      console.error('Update Team error:', error);
      return false;
    }
  }, [handleUpdate]);

  const handleDeleteEntity = useCallback(async (id?: string | number) => {
    try {
      await handleDelete(String(id));
      return true;
    } catch (error) {
      console.error('Delete Team error:', error);
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
      <TeamFormWrapper
        {...props}
        additionalData={{
          lines: relatedData?.lines || [],
          leaders: relatedData?.users || [],
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
    loadingStates?.lines ||
    loadingStates?.leaders;

  return (
    <div className="team-container">
      <DataTable<Team>
        tableId="teams-table"
        title="Quản lý tổ sản xuất"
        data={tableData}
        columns={teamTableColumns}
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
