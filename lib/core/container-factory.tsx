'use client';

import React, { memo, useCallback, useMemo, Suspense } from 'react';
import { DataTable, TableColumn } from 'react-table-power';
import { BaseEntity } from './entity-manager';

interface ContainerFactoryOptions<T extends BaseEntity> {
  entityName: string;
  tableId: string;
  title: string;
  columns: TableColumn<T>[];
  useEntityHook: () => any;
  FormComponent: React.ComponentType<any>;
  transformData?: (data: any[]) => T[];
  additionalFormProps?: Record<string, any>;
}

export function createEntityContainer<T extends BaseEntity>(
  options: ContainerFactoryOptions<T>
) {
  const EntityContainer = memo(() => {
    const {
      getList,
      handleCreate,
      handleUpdate,
      handleDelete,
      activeFilters,
      loading,
      error,
    } = options.useEntityHook();

    // Get data from hook
    const listQuery = getList(activeFilters);
    const tableData = useMemo(() => {
      if (!listQuery.data?.data) return [];
      return options.transformData 
        ? options.transformData(listQuery.data.data)
        : listQuery.data.data;
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
        console.error(`Create ${options.entityName} error:`, error);
        return false;
      }
    }, [handleCreate]);

    const handleUpdateEntity = useCallback(async (id: string, formData: any) => {
      try {
        await handleUpdate(id, formData);
        return true;
      } catch (error) {
        console.error(`Update ${options.entityName} error:`, error);
        return false;
      }
    }, [handleUpdate]);

    const handleDeleteEntity = useCallback(async (id: string) => {
      try {
        await handleDelete(id);
        return true;
      } catch (error) {
        console.error(`Delete ${options.entityName} error:`, error);
        return false;
      }
    }, [handleDelete]);

    // Event handlers
    const eventHandlers = useMemo(() => ({
      onCreate: handleCreateEntity,
      onUpdate: handleUpdateEntity, 
      onDelete: handleDeleteEntity,
    }), [handleCreateEntity, handleUpdateEntity, handleDeleteEntity]);

    // Built-in actions
    const builtInActions = useMemo(() => ({
      create: true,
      edit: true,
      delete: true,
      view: true,
      createFormComponent: (props: any) => (
        <Suspense fallback={<div>Loading form...</div>}>
          <options.FormComponent {...props} {...options.additionalFormProps} />
        </Suspense>
      ),
      editFormComponent: (props: any) => (
        <Suspense fallback={<div>Loading form...</div>}>
          <options.FormComponent {...props} {...options.additionalFormProps} />
        </Suspense>
      ),
      viewFormComponent: (props: any) => (
        <Suspense fallback={<div>Loading form...</div>}>
          <options.FormComponent {...props} {...options.additionalFormProps} isReadOnly />
        </Suspense>
      ),
      formHandling: {
        autoHandleFormSubmission: true,
        skipInitialValidation: true,
      },
    }), []);

    // Error handling
    if (error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
          <p className="text-red-600">{error.message}</p>
        </div>
      );
    }

    return (
      <div className={`${options.entityName.toLowerCase()}-container`}>
        <DataTable<T>
          tableId={options.tableId}
          title={options.title}
          data={tableData}
          columns={options.columns}
          loading={loading || listQuery.isLoading}
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

  EntityContainer.displayName = `${options.entityName}Container`;

  return EntityContainer;
}
