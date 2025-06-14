'use client';

import React, { useMemo, useCallback, Suspense } from 'react';
import { DataTable, TableColumn } from 'react-table-power';
import { Factory as FactoryIcon, Building, Building2, Users, Workflow, Eye, GroupIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

import FactoryForm from './FactoryForm';
import { DashboardCardComponent } from '../../../components/common/layouts/admin/DashboardCard';
import { useFactoryContext } from '@/hooks/factory/FactoryContext';
import { Factory, FactoryCreateDTO, FactoryUpdateDTO } from '@/common/interface/factory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const FactoryContainer: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();

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
  } = useFactoryContext();

  // Get factory data
  const factoryQuery = getList(activeFilters, {
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    staleTime: 30000,
    cacheTime: 300000,
  });

  // Transform data for DataTable với safe null checks
  const tableData = useMemo(() => {
    const rawData = factoryQuery.data?.data || [];
    console.log('[FactoryContainer] Raw data from API:', rawData);
    
    if (!Array.isArray(rawData)) {
      console.warn('[FactoryContainer] Data is not an array:', rawData);
      return [];
    }

    const transformed = rawData.map((item, index) => ({
      id: item?.id || `temp-${index}`,
      code: item?.code || 'N/A',
      name: item?.name || 'Không có tên',
      description: item?.description || null,
      address: item?.address || null,
      phone: item?.phone || null,
      departmentId: item?.departmentId || null,
      managingDepartmentId: item?.managingDepartmentId || null,
      department: item?.department || null,
      managingDepartment: item?.managingDepartment || null,
      createdAt: item?.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item?.updatedAt ? new Date(item.updatedAt) : new Date(),
    }));

    console.log('[FactoryContainer] Transformed data:', transformed);
    return transformed;
  }, [factoryQuery.data?.data]);

  // Calculate stats for dashboard cards
  const stats = useMemo(() => {
    const factories = tableData;
    const total = factoryQuery.data?.total || 0;
    const withHeadOffice = factories.filter(factory => factory.departmentId).length;
    const withFactoryOffice = factories.filter(factory => factory.managingDepartmentId).length;
    const estimatedManagers = Math.min(total * 2, factories.length * 2);

    return {
      totalFactories: total,
      withHeadOffice,
      withFactoryOffice,
      totalManagers: estimatedManagers,
    };
  }, [tableData, factoryQuery.data?.total]);

  // Enhanced navigation handlers
  const handleNavigateToDetails = useCallback((factoryId: string) => {
    router.push(`/admin/factories/${factoryId}`);
  }, [router]);

  const handleNavigateToLines = useCallback((factoryId: string) => {
    router.push(`/admin/factories/${factoryId}/lines`);
  }, [router]);

  const handleNavigateToTeams = useCallback((factoryId: string) => {
    router.push(`/admin/factories/${factoryId}/teams`);
  }, [router]);

  const handleNavigateToGroups = useCallback((factoryId: string) => {
    router.push(`/admin/factories/${factoryId}/groups`);
  }, [router]);

  // Define table columns theo pattern của UserContainer
  const factoryColumns = useMemo<TableColumn<Factory>[]>(() => [
    {
      accessorKey: 'code',
      header: 'Mã nhà máy',
      enableSorting: true,
      enableFiltering: true,
      cell: ({ row }) => {
        const factory = row as Factory;
        return <span className="font-medium">{factory.code}</span>;
      },
    },
    {
      accessorKey: 'name',
      header: 'Tên nhà máy',
      enableSorting: true,
      enableFiltering: true,
      cell: ({ row }) => {
        const factory = row as Factory;
        return <span>{factory.name}</span>;
      },
    },
    {
      accessorKey: 'address',
      header: 'Địa chỉ',
      enableSorting: true,
      enableFiltering: true,
      cell: ({ row }) => {
        const factory = row as Factory;
        return <span>{factory.address || '-'}</span>;
      },
    },
    {
      header: 'Phòng ban quản lý',
      cell: ({ row }) => {
        const factory = row as Factory;
        const dept = factory.department;
        return dept ? <Badge className="text-xs">{dept.name}</Badge> : '-';
      },
      enableSorting: false,
      enableFiltering: false,
    },
    {
      header: 'Phòng ban tại nhà máy',
      cell: ({ row }) => {
        const factory = row as Factory;
        const dept = factory.managingDepartment;
        return dept ? (
          <Badge className="text-xs" variant="secondary">
            {dept.name}
          </Badge>
        ) : '-';
      },
      enableSorting: false,
      enableFiltering: false,
    },
    {
      accessorKey: 'description',
      header: 'Mô tả',
      enableFiltering: true,
      cell: ({ row }) => {
        const factory = row as Factory;
        return <span>{factory.description || '-'}</span>;
      },
    },
    {
      header: 'Quản lý',
      cell: ({ row }) => {
        const factory = row as Factory;
        if (!factory?.id) return null;
        
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToDetails(factory.id);
              }}
              className="h-8 px-2 text-xs"
            >
              <Eye className="mr-1 h-3 w-3" />
              Chi tiết
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToLines(factory.id);
              }}
              className="h-8 px-2 text-xs"
            >
              <Workflow className="mr-1 h-3 w-3" />
              Dây chuyền
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToTeams(factory.id);
              }}
              className="h-8 px-2 text-xs"
            >
              <Users className="mr-1 h-3 w-3" />
              Nhóm
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToGroups(factory.id);
              }}
              className="h-8 px-2 text-xs"
            >
              <GroupIcon className="mr-1 h-3 w-3" />
              Tổ
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableFiltering: false,
    },
  ], [handleNavigateToDetails, handleNavigateToLines, handleNavigateToTeams, handleNavigateToGroups]);

  // CRUD handlers với parameter order như UserContainer
  const handleCreateFactory = useCallback(async (formData: FactoryCreateDTO) => {
    try {
      const result = await handleCreate(formData);
      if (result) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Create factory error:', error);
      return false;
    }
  }, [handleCreate]);

  const handleUpdateFactory = useCallback(async (formData: any, id: string) => {
    try {
      const { id: formDataId, ...updateData } = formData;
      const actualId = id || formDataId;
      await handleUpdate(actualId, updateData);
      return true;
    } catch (error) {
      console.error('Update factory error:', error);
      return false;
    }
  }, [handleUpdate]);

  const handleDeleteFactory = useCallback(async (id: string) => {
    try {
      await handleDelete(id);
      return true;
    } catch (error) {
      console.error('Delete factory error:', error);
      return false;
    }
  }, [handleDelete]);

  // Event handlers for DataTable
  const eventHandlers = useMemo(() => ({
    onCreate: handleCreateFactory,
    onUpdate: handleUpdateFactory,
    onDelete: handleDeleteFactory,
  }), [handleCreateFactory, handleUpdateFactory, handleDeleteFactory]);

  // Built-in actions for DataTable
  const builtInActions = useMemo(() => ({
    create: true,
    edit: true,
    delete: true,
    view: true,
    createFormComponent: (props: any) => (
      <Suspense fallback={<div>Loading form...</div>}>
        <FactoryForm 
          {...props} 
          departments={relatedData?.departments || []}
          isLoadingDepartments={loadingStates?.departments || false}
        />
      </Suspense>
    ),
    editFormComponent: (props: any) => (
      <Suspense fallback={<div>Loading form...</div>}>
        <FactoryForm 
          {...props} 
          departments={relatedData?.departments || []}
          isLoadingDepartments={loadingStates?.departments || false}
        />
      </Suspense>
    ),
    viewFormComponent: (props: any) => (
      <Suspense fallback={<div>Loading form...</div>}>
        <FactoryForm 
          {...props} 
          departments={relatedData?.departments || []}
          isLoadingDepartments={loadingStates?.departments || false}
          isReadOnly 
        />
      </Suspense>
    ),
    formHandling: {
      autoHandleFormSubmission: true,
      skipInitialValidation: true,
    },
  }), [relatedData?.departments, loadingStates?.departments]);

  // Dashboard cards configuration
  const dashboardCards = useMemo(() => [
    {
      title: 'Tổng số nhà máy',
      description: 'Tổng số nhà máy trong hệ thống',
      data: stats.totalFactories.toString(),
      icon: FactoryIcon,
      color: 'bg-blue-200',
      bgdark: 'bg-blue-900',
    },
    {
      title: 'Nhà máy có phòng quản lý',
      description: 'Số nhà máy có phòng ban quản lý',
      data: stats.withHeadOffice.toString(),
      icon: Building,
      color: 'bg-green-200',
      bgdark: 'bg-green-900',
    },
    {
      title: 'Nhà máy có văn phòng riêng',
      description: 'Số nhà máy có văn phòng riêng',
      data: stats.withFactoryOffice.toString(),
      icon: Building2,
      color: 'bg-amber-200',
      bgdark: 'bg-amber-900',
    },
    {
      title: 'Quản lý nhà máy',
      description: 'Tổng số quản lý nhà máy',
      data: stats.totalManagers.toString(),
      icon: Users,
      color: 'bg-violet-200',
      bgdark: 'bg-violet-900',
    },
  ], [stats]);

  // Debug logging
  console.log('[FactoryContainer] Rendering with:', {
    tableDataLength: tableData.length,
    loading: loading || factoryQuery.isLoading,
    error: error?.message,
    queryData: factoryQuery.data,
  });

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
    <div className="factory-container container mx-auto py-6 gap-4 flex flex-col">
      {/* Dashboard Cards */}
      <div className="flex flex-wrap gap-4">
        {dashboardCards.map((card, index) => (
          <div key={`factory-card-${index}`} className="flex-grow basis-60 max-w-xs min-w-60">
            <DashboardCardComponent {...card} theme={theme} />
          </div>
        ))}
      </div>

      {/* Debug info */}
      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        Debug: {tableData.length} items, Loading: {loading || factoryQuery.isLoading ? 'Yes' : 'No'}
      </div>

      {/* DataTable */}
      <DataTable<Factory>
        tableId="factory-management-table"
        title="Quản lý nhà máy"
        description="Danh sách các nhà máy hiện có trong hệ thống"
        data={tableData}
        columns={factoryColumns}
        loading={loading || factoryQuery.isLoading}
        pagination={{
          enabled: true,
          serverSide: true,
          totalItems: factoryQuery.data?.total || 0,
          pageSize: activeFilters.limit || 10,
          pageIndex: (activeFilters.page || 1) - 1,
        }}
        selection={{ enabled: true }}
        eventHandlers={eventHandlers}
        builtInActions={builtInActions}
        globalSearch={{ 
          enabled: true,
          placeholder: "Tìm kiếm theo tên nhà máy...",
          searchColumns: ['name', 'code', 'address', 'description']
        }}
        export={{ enabled: true }}
        dialog={{
          closeOnClickOutside: false,
          closeOnEsc: true,
        }}
        emptyState={{
          title: "Không có dữ liệu",
          description: "Chưa có nhà máy nào trong hệ thống",
        }}
      />
    </div>
  );
};

export default FactoryContainer;
