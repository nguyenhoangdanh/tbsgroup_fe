'use client';

import React, { memo, useCallback, useMemo, Suspense } from 'react';
import { DataTable } from 'react-table-power';

import { UserProfileType } from '@/common/interface/user';
import { useUserContext } from '@/hooks/users';

import { userTableColumns } from './columns';
import UserFormWrapper from './UserFormWrapper';


// UserContainer component that renders DataTable directly
export default memo(function UserContainer() {
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
  } = useUserContext();

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
      console.error('Create User error:', error);
      return false;
    }
  }, [handleCreate]);

  const handleUpdateEntity = useCallback(async (id: string, formData: any) => {
    try {
      console.log('Updating User with ID:', id, 'and data:', formData);
      await handleUpdate(id, formData);
      return true;
    } catch (error) {
      console.error('Update User error:', error);
      return false;
    }
  }, [handleUpdate]);

  const handleDeleteEntity = useCallback(async (id?: string | number) => {
    try {
      await handleDelete(String(id));
      return true;
    } catch (error) {
      console.error('Delete User error:', error);
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
      <UserFormWrapper
        {...props}
        additionalData={{
          factories: relatedData?.factories || [],
          lines: relatedData?.lines || [],
          teams: relatedData?.teams || [],
          groups: relatedData?.groups || [],
          departments: relatedData?.departments || [],
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
    loadingStates?.roles ||
    loadingStates?.factories ||
    loadingStates?.lines ||
    loadingStates?.teams ||
    loadingStates?.groups;

  return (
    <div className="user-container">
      <DataTable<UserProfileType>
        tableId="users-table"
        title="Quản lý người dùng"
        data={tableData}
        columns={userTableColumns}
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
