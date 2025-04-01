import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Factory } from "@/common/interface/factory";
import FactoryForm from "./form";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { useFactoryContext } from "@/hooks/factory/FactoryContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Factory as FactoryIcon, Building, Warehouse, Users, Workflow, Eye, GroupIcon } from "lucide-react";
import { DashboardCardComponent } from "../../../components/common/layouts/admin/DashboardCard";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Define filter tracker state type
type FilterTrackerState = {
    page: number;
    limit: number;
    search: string;
    departmentId: string | undefined;
    departmentType: "HEAD_OFFICE" | "FACTORY_OFFICE" | undefined;
};

const FactoryManagementScreen: React.FC = React.memo(() => {

    const router = useRouter();
    // Get dialog context
    const { updateDialogData, showDialog } = useDialog();

    // Get factory context
    const {
        listFactories,
        deleteFactoryMutation,
        setSelectedFactory,
        selectedFactory,
        loading,
        activeFilters,
        handleCreateFactory,
        handleUpdateFactory,
        resetError,
        updatePagination,
        batchDeleteFactoriesMutation
    } = useFactoryContext();

    // State for tracking whether component is mounted
    const [isMounted, setIsMounted] = useState(true);

    // Stats for dashboard cards
    const [stats, setStats] = useState({
        totalFactories: 0,
        withHeadOffice: 0,
        withFactoryOffice: 0,
        totalManagers: 0
    });

    // Other state management
    const [filterTrackers, setFilterTrackers] = useState<FilterTrackerState>({
        page: activeFilters.page || 1,
        limit: activeFilters.limit || 10,
        search: activeFilters.search || '',
        departmentId: activeFilters.departmentId,
        departmentType: activeFilters.departmentType
    });

    // Refs for preventing loops and handling state updates safely
    const prevActiveFiltersRef = useRef({ ...activeFilters });
    const isUpdatingTrackersRef = useRef(false);
    const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSubmittingRef = useRef(false);
    const pendingRequestsRef = useRef(new Set<string>());
    const isUpdatingPaginationRef = useRef(false);
    const shouldRefetchRef = useRef(false);
    const dialogUpdateInProgressRef = useRef(false);
    const operationCountRef = useRef(0);
    const MAX_OPERATIONS = 200;
    const syncingRef = useRef(false);
    const operationTypeCountsRef = useRef<Record<string, number>>({});

    // Cleanup on unmount
    useEffect(() => {
        operationCountRef.current = 0;
        setIsMounted(true);

        return () => {
            setIsMounted(false);
            if (refetchTimeoutRef.current) {
                clearTimeout(refetchTimeoutRef.current);
            }
            pendingRequestsRef.current.clear();
            isSubmittingRef.current = false;
            isUpdatingPaginationRef.current = false;
            shouldRefetchRef.current = false;
            dialogUpdateInProgressRef.current = false;
            isUpdatingTrackersRef.current = false;
            operationCountRef.current = 0;
            syncingRef.current = false;

            // Set selected factory to null
            setSelectedFactory(null);
        };
    }, [setSelectedFactory]);

    // Count operations to prevent infinite loops, with type tracking
    const incrementOperationCount = useCallback((operationType = 'general') => {
        // Increment global counter
        operationCountRef.current++;

        // Initialize and increment type counter
        if (!operationTypeCountsRef.current[operationType]) {
            operationTypeCountsRef.current[operationType] = 0;
        }
        operationTypeCountsRef.current[operationType]++;

        // Only warn and limit if we're way over the limit
        if (operationCountRef.current > MAX_OPERATIONS) {
            console.warn(`Exceeded maximum operations (${MAX_OPERATIONS}) in FactoryManagementScreen [${operationType}]`);
            return false;
        }

        // Most operation types allow more operations
        const typeLimit = operationType === 'effect' ? 50 : 100;
        if (operationTypeCountsRef.current[operationType] > typeLimit) {
            console.warn(`Exceeded maximum operations for type ${operationType} (${typeLimit})`);
            return false;
        }

        return true;
    }, []);

    // Update trackers when activeFilters change - with safeguards
    useEffect(() => {
        // Prevent excessive executions using operation counting
        if (!incrementOperationCount('filter_sync_effect')) {
            console.warn("Max effect executions reached in activeFilters sync");
            return;
        }

        // Skip if we're already updating or in the middle of a sync
        if (isUpdatingTrackersRef.current || syncingRef.current) return;

        // Perform a deep comparison to avoid unnecessary updates
        const hasChanged =
            prevActiveFiltersRef.current.page !== (activeFilters.page || 1) ||
            prevActiveFiltersRef.current.limit !== (activeFilters.limit || 10) ||
            prevActiveFiltersRef.current.search !== (activeFilters.search || '') ||
            prevActiveFiltersRef.current.departmentId !== activeFilters.departmentId ||
            prevActiveFiltersRef.current.departmentType !== activeFilters.departmentType;

        if (hasChanged) {
            // Set syncing flag to prevent loops
            syncingRef.current = true;

            // Update reference
            prevActiveFiltersRef.current = { ...activeFilters };

            // Update state
            setFilterTrackers({
                page: activeFilters.page || 1,
                limit: activeFilters.limit || 10,
                search: activeFilters.search || '',
                departmentId: activeFilters.departmentId,
                departmentType: activeFilters.departmentType
            });

            // Reset sync flag after update with a stable timeout
            const timeoutId = setTimeout(() => {
                syncingRef.current = false;
            }, 0);

            return () => {
                clearTimeout(timeoutId);
            };
        }
    }, [activeFilters, incrementOperationCount]);

    // Stable filters for data fetching
    const stableFilters = useMemo(() => {
        // Validate department type
        let departmentType: "HEAD_OFFICE" | "FACTORY_OFFICE" | undefined = undefined;
        if (filterTrackers.departmentType === "HEAD_OFFICE" || filterTrackers.departmentType === "FACTORY_OFFICE") {
            departmentType = filterTrackers.departmentType;
        }

        return {
            page: filterTrackers.page,
            limit: filterTrackers.limit,
            search: filterTrackers.search,
            departmentId: filterTrackers.departmentId,
            departmentType
        };
    }, [filterTrackers]);

    // Fetch factory list with query options
    const {
        data: factoryList,
        isLoading: isLoadingFactories,
        refetch: refetchFactories,
        isRefetching
    } = listFactories(stableFilters, {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        staleTime: 30000,
        cacheTime: 300000,
    });

    // Safely refetch data
    const safeRefetch = useCallback(() => {
        if (!isMounted || !incrementOperationCount('refetch')) return;

        if (refetchTimeoutRef.current) {
            clearTimeout(refetchTimeoutRef.current);
        }

        if (isUpdatingPaginationRef.current) {
            shouldRefetchRef.current = true;
            return;
        }

        const requestId = `refetch-${Date.now()}`;
        pendingRequestsRef.current.add(requestId);

        refetchTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
                refetchFactories().finally(() => {
                    if (isMounted) {
                        pendingRequestsRef.current.delete(requestId);
                        refetchTimeoutRef.current = null;
                    }
                });
            }
        }, 300);
    }, [refetchFactories, isMounted, incrementOperationCount]);

    // Handle page changes
    const handlePageChange = useCallback((pageIndex: number, pageSize: number) => {
        if (isUpdatingPaginationRef.current || !incrementOperationCount('page_change')) return;

        isUpdatingPaginationRef.current = true;
        isUpdatingTrackersRef.current = true;

        const apiPage = pageIndex + 1;

        try {
            // Set local tracker first
            setFilterTrackers(prev => ({
                ...prev,
                page: apiPage,
                limit: pageSize
            }));

            // Debounce the context update to prevent racing conditions
            const timeoutId = setTimeout(() => {
                updatePagination(apiPage, pageSize);

                // Clear flags after update is completed
                setTimeout(() => {
                    isUpdatingPaginationRef.current = false;
                    isUpdatingTrackersRef.current = false;

                    if (shouldRefetchRef.current && isMounted) {
                        shouldRefetchRef.current = false;
                        safeRefetch();
                    }
                }, 50);
            }, 50);

            return () => clearTimeout(timeoutId);
        } catch (error) {
            console.error("Error during pagination update:", error);
            isUpdatingPaginationRef.current = false;
            isUpdatingTrackersRef.current = false;
        }
    }, [updatePagination, safeRefetch, isMounted, incrementOperationCount]);

    // Handle delete operations
    const handleDeleteFactory = useCallback(async (id: string): Promise<void> => {
        if (isSubmittingRef.current || !incrementOperationCount()) return;

        const requestId = `delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            await deleteFactoryMutation.mutateAsync(id);

            if (selectedFactory?.id === id) {
                setSelectedFactory(null);
            }

            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);
        } catch (error) {
            console.error("Error deleting factory:", error);
        } finally {
            isSubmittingRef.current = false;
            pendingRequestsRef.current.delete(requestId);
        }
    }, [
        deleteFactoryMutation,
        safeRefetch,
        selectedFactory?.id,
        setSelectedFactory,
        isMounted,
        incrementOperationCount
    ]);

    // Handle edit operations
    const handleEditFactory = useCallback(async (factory: Factory): Promise<boolean> => {
        if (dialogUpdateInProgressRef.current || !incrementOperationCount()) return false;

        dialogUpdateInProgressRef.current = true;

        try {
            // Update context first
            setSelectedFactory(factory);

            // Schedule dialog show to break potential update cycle
            const timeoutId = setTimeout(() => {
                if (isMounted) {
                    showDialog({
                        type: DialogType.EDIT,
                        data: factory,
                    });
                    dialogUpdateInProgressRef.current = false;
                }
            }, 50);

            return true;
        } catch (error) {
            dialogUpdateInProgressRef.current = false;
            console.error("Error showing edit dialog:", error);
            return false;
        }
    }, [setSelectedFactory, showDialog, isMounted, incrementOperationCount]);

    // Handle batch delete operations
    const handleBatchDelete = useCallback(async (ids: string[]): Promise<void> => {
        if (isSubmittingRef.current || !incrementOperationCount()) return;

        const requestId = `batch-delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            await batchDeleteFactoriesMutation(ids);

            if (selectedFactory && ids.includes(selectedFactory.id)) {
                setSelectedFactory(null);
            }

            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);
        } catch (error) {
            console.error("Error during batch delete:", error);
        } finally {
            isSubmittingRef.current = false;
            pendingRequestsRef.current.delete(requestId);
        }
    }, [
        batchDeleteFactoriesMutation,
        setSelectedFactory,
        selectedFactory,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);

    // Handle form submission
    const handleFactoryFormSubmit = useCallback(async (data: any): Promise<boolean> => {
        if (isSubmittingRef.current || !isMounted || !incrementOperationCount()) return false;

        const requestId = `submit-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            if (data.id) {
                const { id, createdAt, updatedAt, ...updateData } = data;
                await handleUpdateFactory(id, updateData);
            } else {
                const { id, createdAt, updatedAt, ...createData } = data;
                await handleCreateFactory(createData);
            }

            // Use a simple flag rather than checking isMounted inside the timeout
            let stillMounted = true;

            // Clear selection first
            setSelectedFactory(null);

            // Wait for context updates to complete
            setTimeout(() => {
                if (stillMounted && isMounted) {
                    safeRefetch();
                }
            }, 50);

            return true;
        } catch (error) {
            console.error("Error saving factory data:", error);
            return false;
        } finally {
            if (isMounted) {
                isSubmittingRef.current = false;
                pendingRequestsRef.current.delete(requestId);
            }
        }
    }, [
        handleCreateFactory,
        handleUpdateFactory,
        safeRefetch,
        setSelectedFactory,
        isMounted,
        incrementOperationCount
    ]);

    // Effect for updating dialog data - with better loop prevention
    useEffect(() => {
        if (!isMounted || !selectedFactory || dialogUpdateInProgressRef.current) return;

        // Track effect count to prevent excessive executions
        if (!incrementOperationCount('dialog_effect')) {
            console.warn("Max effect executions reached in dialog data sync");
            return;
        }

        // Prevent concurrent or recursive updates
        dialogUpdateInProgressRef.current = true;

        const timeoutId = setTimeout(() => {
            if (isMounted) {
                updateDialogData(selectedFactory);
                setTimeout(() => {
                    dialogUpdateInProgressRef.current = false;
                }, 50);
            }
        }, 50);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [selectedFactory, updateDialogData, isMounted, incrementOperationCount]);

    // Calculate pagination metadata
    const calculatedPaginationMeta = useMemo(() => {
        if (!factoryList?.total) {
            return {
                totalItems: 0,
                totalPages: 0,
                currentPage: filterTrackers.page,
                pageSize: filterTrackers.limit
            };
        }

        return {
            totalItems: factoryList.total,
            totalPages: Math.ceil(factoryList.total / filterTrackers.limit),
            currentPage: filterTrackers.page,
            pageSize: filterTrackers.limit
        };
    }, [factoryList?.total, filterTrackers.page, filterTrackers.limit]);

    // Table columns definition
    const columns: ColumnDef<Factory>[] = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => {
                // Stabilize the selection state to prevent infinite updates
                const isAllSelected = table.getIsAllPageRowsSelected();
                const isSomeSelected = table.getIsSomePageRowsSelected();
                const checkboxState = isAllSelected ? true : isSomeSelected ? "indeterminate" : false;

                return (
                    <Checkbox
                        checked={checkboxState}
                        onCheckedChange={(value) => {
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
                        onCheckedChange={(value) => {
                            // Use a stable callback that won't recreate on each render
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
            header: "Mã nhà máy",
            cell: ({ row }) => row.original.code,
            accessorKey: "code",
        },
        {
            id: "name",
            header: "Tên nhà máy",
            cell: ({ row }) => row.original.name,
            accessorKey: "name",
        },
        {
            id: "address",
            header: "Địa chỉ",
            cell: ({ row }) => row.original.address || "-",
            accessorKey: "address",
        },
        {
            id: "department",
            header: "Phòng ban quản lý",
            cell: ({ row }) => {
                const dept = row.original.department;
                return dept ? (
                    <Badge className="text-xs">
                        {dept.name}
                    </Badge>
                ) : "-";
            },
        },
        {
            id: "managingDepartment",
            header: "Phòng ban tại nhà máy",
            cell: ({ row }) => {
                const dept = row.original.managingDepartment;
                return dept ? (
                    <Badge className="text-xs" variant="secondary">
                        {dept.name}
                    </Badge>
                ) : "-";
            },
        },
        {
            id: "description",
            header: "Mô tả",
            cell: ({ row }) => row.original.description || "-",
            accessorKey: "description",
        },
        {
            id: "actions",
            header: "Quản lý chi tiết",
            cell: ({ row }) => {
                const factory = row.original;
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row selection
                                router.push(`/admin/factories/${factory.id}/lines`);
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
                                e.stopPropagation(); // Prevent row selection
                                router.push(`/admin/factories/${factory.id}/teams`);
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
                                e.stopPropagation(); // Prevent row selection
                                router.push(`/admin/factories/${factory.id}/groups`);
                            }}
                            className="h-8 px-2 text-xs"
                        >
                            <GroupIcon className="mr-1 h-3 w-3" />
                            Tổ
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row selection
                                router.push(`/admin/factories/${factory.id}`);
                            }}
                            className="h-8 w-8"
                            title="Xem chi tiết"
                        >
                            <Eye className="h-3 w-3" />
                        </Button>
                    </div>
                );
            },
        },
    ], []);

    // Memoized derived values
    const factories = useMemo(() => factoryList?.data || [], [factoryList?.data]);
    const isLoading = loading || isLoadingFactories || isRefetching;

    // Initial page index calculation
    const initialPageIndex = useMemo(() =>
        Math.max(0, (calculatedPaginationMeta.currentPage || 1) - 1),
        [calculatedPaginationMeta.currentPage]
    );

    // Memoized form components to prevent unnecessary re-renders
    const createFormComponent = useMemo(() => (
        <FactoryForm onSubmit={handleFactoryFormSubmit} />
    ), [handleFactoryFormSubmit]);

    const editFormComponent = useMemo(() => (
        <FactoryForm onSubmit={handleFactoryFormSubmit} />
    ), [handleFactoryFormSubmit]);

    const viewFormComponent = useMemo(() => (
        <FactoryForm />
    ), []);

    // Update stats whenever factoryList changes
    useEffect(() => {
        if (factoryList?.data) {
            // Calculate stats for dashboard cards
            const total = factoryList.total || 0;
            const withHeadOffice = factoryList.data.filter(factory => factory.departmentId).length;
            const withFactoryOffice = factoryList.data.filter(factory => factory.managingDepartmentId).length;

            // Estimate of managers (in a real app, this would come from an API)
            const estimatedManagers = Math.min(total * 2, factoryList.data.length * 2);

            setStats({
                totalFactories: total,
                withHeadOffice: withHeadOffice,
                withFactoryOffice: withFactoryOffice,
                totalManagers: estimatedManagers
            });
        }
    }, [factoryList]);

    // Define dashboard cards
    const dashboardCards = useMemo(() => [
        {
            title: "Tổng số nhà máy",
            description: "Tổng số nhà máy trong hệ thống",
            data: stats.totalFactories.toString(),
            icon: FactoryIcon,
            color: "bg-blue-200",
            bgdark: "bg-blue-900",
        },
        {
            title: "Nhà máy có phòng quản lý",
            description: "Số nhà máy có phòng ban quản lý",
            data: stats.withHeadOffice.toString(),
            icon: Building,
            color: "bg-green-200",
            bgdark: "bg-green-900",
        },
        {
            title: "Nhà máy có văn phòng riêng",
            description: "Số nhà máy có văn phòng riêng",
            data: stats.withFactoryOffice.toString(),
            icon: Building2,
            color: "bg-amber-200",
            bgdark: "bg-amber-900",
        },
        {
            title: "Quản lý nhà máy",
            description: "Tổng số quản lý nhà máy",
            data: stats.totalManagers.toString(),
            icon: Users,
            color: "bg-violet-200",
            bgdark: "bg-violet-900",
        }
    ], [stats]);

    const { theme } = useTheme();

    return (
        <div className="container mx-auto py-6 gap-4 flex flex-col">

            {/* Dashboard Cards */}
            <div className="flex flex-wrap gap-4">
                {dashboardCards.map((card, index) => (
                    <div key={`factory-card-${index}`} className="flex-grow basis-60 max-w-xs min-w-60">
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
                data={factories}
                title="Quản lý nhà máy"
                description="Danh sách các nhà máy hiện có trong hệ thống"
                actions={["create", "edit", "delete"]}
                searchColumn="name"
                searchPlaceholder="Tìm kiếm theo tên nhà máy"
                exportData={true}
                onDelete={handleDeleteFactory}
                onEdit={handleEditFactory}
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

export default FactoryManagementScreen;