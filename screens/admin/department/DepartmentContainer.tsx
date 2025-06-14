'use client';

import { Building, Building2, Workflow, Eye, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo, useCallback, Suspense, memo } from 'react';
import { DataTable, TableColumn } from 'react-table-power';

import { Department, DepartmentCreateDTO, DepartmentUpdateDTO } from '@/common/interface/department';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DepartmentProvider, useDepartmentContext } from '@/hooks/department/DepartmentContext';

import DepartmentForm from './DepartmentForm';

const DepartmentContainerInner: React.FC = () => {
    const router = useRouter();

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
    } = useDepartmentContext();

    // Get department data
    const departmentQuery = getList(activeFilters, {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        staleTime: 30000,
        cacheTime: 300000,
    });

    // Transform data for DataTable with safe null checks and ensure unique IDs
    // Transform data for DataTable with safe null checks and ensure unique IDs
    const tableData = useMemo(() => {
        const rawData = departmentQuery.data?.data || [];
        console.log('[DepartmentContainer] Raw data from API:', rawData);

        if (!Array.isArray(rawData)) {
            console.warn('[DepartmentContainer] Data is not an array:', rawData);
            return [];
        }

        // Create a Set to track used IDs and ensure uniqueness
        const usedIds = new Set<string>();

        const transformed = rawData
            .filter((item, index) => {
                // Filter out items without valid ID or with duplicate IDs
                const id = item?.id;
                if (!id || usedIds.has(id)) {
                    console.warn(`[DepartmentContainer] Filtered out duplicate or invalid ID at index ${index}:`, item);
                    return false;
                }
                usedIds.add(id);
                return true;
            })
            .map((item, index) => {
                const dept: Department = {
                    id: item.id, // Use original ID since we've ensured uniqueness above
                    code: item?.code || 'N/A',
                    name: item?.name || 'Không có tên',
                    description: item?.description || null,
                    departmentType: item?.departmentType || 'HEAD_OFFICE',
                    parentId: item?.parentId || null,
                    createdAt: item?.createdAt ? new Date(item.createdAt) : new Date(),
                    updatedAt: item?.updatedAt ? new Date(item.updatedAt) : new Date(),
                };
                console.log(`[DepartmentContainer] Transformed item ${index} with ID ${dept.id}:`, dept);
                return dept;
            });

        return transformed;
    }, [departmentQuery.data?.data]);

    // Calculate stats for dashboard cards
    const stats = useMemo(() => {
        const departments = tableData;
        const total = departmentQuery.data?.total || 0;
        const headOffices = departments.filter(dept => dept.departmentType === 'HEAD_OFFICE').length;
        const factoryOffices = departments.filter(dept => dept.departmentType === 'FACTORY_OFFICE').length;
        const rootDepartments = departments.filter(dept => !dept.parentId).length;

        return {
            totalDepartments: total,
            headOffices,
            factoryOffices,
            rootDepartments,
        };
    }, [tableData, departmentQuery.data?.total]);

    // Enhanced navigation handlers
    const handleNavigateToDetails = useCallback((departmentId: string) => {
        router.push(`/admin/departments/${departmentId}`);
    }, [router]);

    const handleNavigateToOrganizationChart = useCallback(() => {
        router.push(`/admin/departments/organization-chart`);
    }, [router]);

    // Define columns with simplified cell rendering to avoid CSS conflicts
    const departmentColumns = useMemo<TableColumn<Department>[]>(() => [
        {
            accessorKey: 'code',
            header: 'Mã phòng ban',
            enableSorting: true,
            enableFiltering: true,
            cell: ({ row }) => {
                const department = row as Department;
                return department.code || 'N/A';
            },
        },
        {
            accessorKey: 'name',
            header: 'Tên phòng ban',
            enableSorting: true,
            enableFiltering: true,
            cell: ({ row }) => {
                const department = row as Department;
                return department.name || 'Không có tên';
            },
        },
        {
            accessorKey: 'departmentType',
            header: 'Loại phòng ban',
            enableSorting: true,
            enableFiltering: true,
            cell: ({ row }) => {
                const department = row as Department;
                const type = department.departmentType || 'HEAD_OFFICE';
                return (
                    <Badge
                        variant={type === 'HEAD_OFFICE' ? 'success' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleNavigateToDetails(department.id)}
                    >
                        {type === 'HEAD_OFFICE' ? 'Văn phòng điều hành' : 'Văn phòng nhà máy'}
                    </Badge>
                );
                // Uncomment if you want to use a button instead of badge
                // return type === 'HEAD_OFFICE' ? 'Văn phòng điều hành' : 'Văn phòng nhà máy';
            },
        },
        {
            header: 'Phòng ban cha',
            cell: ({ row }) => {
                const department = row as Department;
                return department?.parentId ? 'Có phòng ban cha' : 'Phòng ban gốc';
            },
            enableSorting: false,
            enableFiltering: false,
        },
        {
            accessorKey: 'description',
            header: 'Mô tả',
            enableFiltering: true,
            cell: ({ row }) => {
                const department = row as Department;
                return department.description || '-';
            },
        },
    ], [handleNavigateToDetails, router]);

    // Transform data function như UserContainer pattern
    const transformDepartmentData = (data: any[]): Department[] => {
        return data.map(dept => ({
            id: dept.id,
            code: dept.code,
            name: dept.name,
            description: dept.description,
            departmentType: dept.departmentType || dept.department_type,
            parentId: dept.parentId || dept.parent_id,
            createdAt: dept.createdAt,
            updatedAt: dept.updatedAt,
            ...dept
        }));
    };

    // CRUD handlers với proper parameter order như UserContainer
    const handleCreateDepartment = useCallback(async (formData: DepartmentCreateDTO) => {
        try {
            console.log('[DepartmentContainer] Creating department with data:', formData);
            const result = await handleCreate(formData);
            if (result) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Create department error:', error);
            return false;
        }
    }, [handleCreate]);

    const handleUpdateDepartment = useCallback(async (id: string, formData: any) => {
        try {
            const { id: formDataId, ...updateData } = formData;
            const actualId = id || formDataId;

            await handleUpdate(actualId, updateData);
            return true;
        } catch (error) {
            console.error('Update department error:', error);
            return false;
        }
    }, [handleUpdate]);

    const handleDeleteDepartment = useCallback(async (id: string) => {
        try {
            await handleDelete(id);
            return true;
        } catch (error) {
            console.error('Delete department error:', error);
            return false;
        }
    }, [handleDelete]);

    // Event handlers for DataTable
    const eventHandlers = useMemo(() => ({
        onCreate: handleCreateDepartment,
        onUpdate: handleUpdateDepartment,
        onDelete: handleDeleteDepartment,
    }), [handleCreateDepartment, handleUpdateDepartment, handleDeleteDepartment]);

    // Built-in actions for DataTable với improved data handling
    const builtInActions = useMemo(() => ({
        create: true,
        edit: true,
        delete: true,
        view: true,
        createFormComponent: (props: any) => {
            return (
                <Suspense fallback={<div>Loading form...</div>}>
                    <DepartmentForm
                        {...props}
                        dialogType="create"
                        departments={relatedData?.rootDepartments || []}
                        isLoadingDepartments={loadingStates?.rootDepartments || false}
                    />
                </Suspense>
            );
        },
        editFormComponent: (props: any) => {
            console.log('[DepartmentContainer] Edit form - relatedData:', relatedData);
            console.log('[DepartmentContainer] Edit form - rootDepartments:', relatedData?.rootDepartments);

            return (
                <Suspense fallback={<div>Loading form...</div>}>
                    <DepartmentForm
                        {...props}
                        dialogType="edit"
                        departments={relatedData?.rootDepartments || []}
                        isLoadingDepartments={loadingStates?.rootDepartments || false}
                    />
                </Suspense>
            );
        },
        viewFormComponent: (props: any) => {
            console.log('[DepartmentContainer] View form - relatedData:', relatedData);
            console.log('[DepartmentContainer] View form - rootDepartments:', relatedData?.rootDepartments);

            return (
                <Suspense fallback={<div>Loading form...</div>}>
                    <DepartmentForm
                        {...props}
                        dialogType="view"
                        departments={relatedData?.rootDepartments || []}
                        isLoadingDepartments={loadingStates?.rootDepartments || false}
                        isReadOnly
                    />
                </Suspense>
            );
        },
        formHandling: {
            autoHandleFormSubmission: true,
            skipInitialValidation: true,
        },
    }), [relatedData?.rootDepartments, loadingStates?.rootDepartments]);

    // Dashboard cards configuration
    const dashboardCards = useMemo(() => [
        {
            title: 'Tổng số phòng ban',
            description: 'Tổng số phòng ban trong hệ thống',
            data: stats.totalDepartments.toString(),
            icon: Building,
            color: 'bg-blue-200',
            bgdark: 'bg-blue-900',
        },
        {
            title: 'Văn phòng chính',
            description: 'Số phòng ban thuộc văn phòng chính',
            data: stats.headOffices.toString(),
            icon: Building,
            color: 'bg-green-200',
            bgdark: 'bg-green-900',
        },
        {
            title: 'Văn phòng nhà máy',
            description: 'Số phòng ban thuộc văn phòng nhà máy',
            data: stats.factoryOffices.toString(),
            icon: Building2,
            color: 'bg-amber-200',
            bgdark: 'bg-amber-900',
        },
        {
            title: 'Phòng ban gốc',
            description: 'Số phòng ban cấp cao nhất',
            data: stats.rootDepartments.toString(),
            icon: Building2,
            color: 'bg-violet-200',
            bgdark: 'bg-violet-900',
        },
    ], [stats]);


    return (
        <div className="department-container-debug">
            <DataTable<Department>
                tableId="department-debug-table"
                title="Quản lý phòng ban"
                data={tableData}
                columns={departmentColumns}
                loading={loading}
                pagination={{
                    enabled: true,
                    total: tableData.length,
                    pageSize: 10,
                    current: 1,
                }}
                selection={{ enabled: true }}
                eventHandlers={eventHandlers}
                builtInActions={builtInActions}
                globalSearch={{
                    enabled: true,
                    placeholder: "Tìm kiếm theo tên phòng ban...",
                    searchFields: ['name', 'code', 'description']
                }}
                export={{ enabled: true }}
                dialog={{
                    closeOnClickOutside: false,
                    closeOnEsc: true,
                }}
                emptyState={{
                    title: "Không có dữ liệu",
                    description: "Chưa có phòng ban nào trong hệ thống",
                }}
                className="debug-datatable"
                animate={false}
                style={{
                    border: '2px solid #ef4444',
                    backgroundColor: 'white',
                    minHeight: '200px'
                }}
            />
        </div>
    );
};

DepartmentContainerInner.displayName = 'DepartmentContainerInner';

const DepartmentContainer = memo(() => {
    return (
        <DepartmentProvider
            config={{
                enableAutoRefresh: true,
                prefetchRelatedData: true,
                cacheStrategy: 'aggressive',
            }}
        >
            <DepartmentContainerInner />
        </DepartmentProvider>
    );
});

DepartmentContainer.displayName = 'DepartmentContainer';
export default DepartmentContainer;
