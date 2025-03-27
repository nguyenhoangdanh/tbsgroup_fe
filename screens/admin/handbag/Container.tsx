import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { HandBag } from "@/common/interface/handbag";
import HandBagForm from "./form";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { useHandBagContext } from "@/hooks/handbag/HandBagContext";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, DollarSign, Package, ShoppingBag } from "lucide-react";
import { DashboardCardComponent } from "../../../components/common/layouts/admin/DashboardCard";
import { useTheme } from "next-themes";

// Define explicit tracker state type
type FilterTrackerState = {
  page: number;
  limit: number;
  search: string;
  active: boolean | undefined;
  category: string | undefined;
};

const HandBagManagementScreen: React.FC = React.memo(() => {
  // Get dialog context first to maintain hook order
  const { updateDialogData, showDialog } = useDialog();

  // Now get handbag context
  const {
    listHandBags,
    deleteHandBagMutation,
    setSelectedHandBag,
    selectedHandBag,
    loading,
    activeFilters,
    handleCreateHandBag,
    handleUpdateHandBag,
    resetError,
    updatePagination,
    batchDeleteHandBagsMutation
  } = useHandBagContext();

  // State for tracking whether component is mounted
  const [isMounted, setIsMounted] = useState(true)

  // Stats for dashboard cards
  const [stats, setStats] = useState({
    totalHandbags: 0,
    activeHandbags: 0,
    inactiveHandbags: 0,
    revenue: 0,
    categories: 0
  });;

  // Other state management
  const [filterTrackers, setFilterTrackers] = useState<FilterTrackerState>({
    page: activeFilters.page || 1,
    limit: activeFilters.limit || 10,
    search: activeFilters.search || '',
    active: activeFilters.active,
    category: activeFilters.category
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
  const paginationUpdateCountRef = useRef(0);
  const operationCountRef = useRef(0);
  const MAX_OPERATIONS = 200;
  const effectCountRef = useRef(0);
  const syncingRef = useRef(false);
  const operationTypeCountsRef = useRef<Record<string, number>>({});

  // Replace the cleanup effect in Container.tsx with this improved version

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
      paginationUpdateCountRef.current = 0;
      operationCountRef.current = 0;
      syncingRef.current = false;

      // Set selected bag to null but skip the error reset
      // This helps prevent the loop of resetFilters calls
      setSelectedHandBag(null);

      // Skip calling resetError on unmount
      // resetError();
    };
  }, [setSelectedHandBag]); // remove resetError from dependencies

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
      console.warn(`Exceeded maximum operations (${MAX_OPERATIONS}) in HandBagManagementScreen [${operationType}]`);
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
      prevActiveFiltersRef.current.active !== activeFilters.active ||
      prevActiveFiltersRef.current.category !== activeFilters.category;

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
        active: activeFilters.active,
        category: activeFilters.category
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
  const stableFilters = useMemo(() => ({
    page: filterTrackers.page,
    limit: filterTrackers.limit,
    search: filterTrackers.search,
    active: filterTrackers.active,
    category: filterTrackers.category
  }), [filterTrackers]);

  // Fetch handbag list with query options
  const {
    data: handBagList,
    isLoading: isLoadingHandBags,
    refetch: refetchHandBags,
    isRefetching
  } = listHandBags(stableFilters, {
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
        refetchHandBags().finally(() => {
          if (isMounted) {
            pendingRequestsRef.current.delete(requestId);
            refetchTimeoutRef.current = null;
          }
        });
      }
    }, 300);
  }, [refetchHandBags, isMounted, incrementOperationCount]);

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
  const handleDeleteHandBag = useCallback(async (id: string): Promise<void> => {
    if (isSubmittingRef.current || !incrementOperationCount()) return;

    const requestId = `delete-${Date.now()}`;
    try {
      isSubmittingRef.current = true;
      pendingRequestsRef.current.add(requestId);

      await deleteHandBagMutation.mutateAsync(id);

      if (selectedHandBag?.id === id) {
        setSelectedHandBag(null);
      }

      setTimeout(() => {
        if (isMounted) {
          safeRefetch();
        }
      }, 50);
    } catch (error) {
      console.error("Error deleting handbag:", error);
    } finally {
      isSubmittingRef.current = false;
      pendingRequestsRef.current.delete(requestId);
    }
  }, [
    deleteHandBagMutation,
    safeRefetch,
    selectedHandBag?.id,
    setSelectedHandBag,
    isMounted,
    incrementOperationCount
  ]);

  // Handle edit operations
  const handleEditHandBag = useCallback(async (handBag: HandBag): Promise<boolean> => {
    if (dialogUpdateInProgressRef.current || !incrementOperationCount()) return false;

    dialogUpdateInProgressRef.current = true;

    try {
      // Update context first
      setSelectedHandBag(handBag);

      // Schedule dialog show to break potential update cycle
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          showDialog({
            type: DialogType.EDIT,
            data: handBag,
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
  }, [setSelectedHandBag, showDialog, isMounted, incrementOperationCount]);

  // Handle batch delete operations
  const handleBatchDelete = useCallback(async (ids: string[]): Promise<void> => {
    if (isSubmittingRef.current || !incrementOperationCount()) return;

    const requestId = `batch-delete-${Date.now()}`;
    try {
      isSubmittingRef.current = true;
      pendingRequestsRef.current.add(requestId);

      await batchDeleteHandBagsMutation(ids);

      if (selectedHandBag && ids.includes(selectedHandBag.id)) {
        setSelectedHandBag(null);
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
    batchDeleteHandBagsMutation,
    setSelectedHandBag,
    selectedHandBag,
    safeRefetch,
    isMounted,
    incrementOperationCount
  ]);

  // Handle form submission
  const handleHandBagFormSubmit = useCallback(async (data: any): Promise<boolean> => {
    if (isSubmittingRef.current || !isMounted || !incrementOperationCount()) return false;

    const requestId = `submit-${Date.now()}`;
    try {
      isSubmittingRef.current = true;
      pendingRequestsRef.current.add(requestId);

      if (data.id) {
        const { id, createdAt, updatedAt, ...updateData } = data;
        await handleUpdateHandBag(id, updateData);
      } else {
        const { id, createdAt, updatedAt, ...createData } = data;
        await handleCreateHandBag(createData);
      }

      // Use a simple flag rather than checking isMounted inside the timeout
      let stillMounted = true;

      // Clear selection first
      setSelectedHandBag(null);

      // Wait for context updates to complete
      setTimeout(() => {
        if (stillMounted && isMounted) {
          safeRefetch();
        }
      }, 50);

      return true;
    } catch (error) {
      console.error("Error saving handbag data:", error);
      return false;
    } finally {
      if (isMounted) {
        isSubmittingRef.current = false;
        pendingRequestsRef.current.delete(requestId);
      }
    }
  }, [
    handleCreateHandBag,
    handleUpdateHandBag,
    safeRefetch,
    setSelectedHandBag,
    isMounted,
    incrementOperationCount
  ]);

  // Effect for updating dialog data - with better loop prevention
  useEffect(() => {
    if (!isMounted || !selectedHandBag || dialogUpdateInProgressRef.current) return;

    // Track effect count to prevent excessive executions
    if (!incrementOperationCount('dialog_effect')) {
      console.warn("Max effect executions reached in dialog data sync");
      return;
    }

    // Prevent concurrent or recursive updates
    dialogUpdateInProgressRef.current = true;

    const timeoutId = setTimeout(() => {
      if (isMounted) {
        updateDialogData(selectedHandBag);
        setTimeout(() => {
          dialogUpdateInProgressRef.current = false;
        }, 50);
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [selectedHandBag, updateDialogData, isMounted, incrementOperationCount]);

  // Calculate pagination metadata
  const calculatedPaginationMeta = useMemo(() => {
    if (!handBagList?.total) {
      return {
        totalItems: 0,
        totalPages: 0,
        currentPage: filterTrackers.page,
        pageSize: filterTrackers.limit
      };
    }

    return {
      totalItems: handBagList.total,
      totalPages: Math.ceil(handBagList.total / filterTrackers.limit),
      currentPage: filterTrackers.page,
      pageSize: filterTrackers.limit
    };
  }, [handBagList?.total, filterTrackers.page, filterTrackers.limit]);

  // Table columns definition
  const columns: ColumnDef<HandBag>[] = useMemo(() => [
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
      header: "Mã túi xách",
      cell: ({ row }) => row.original.code,
      accessorKey: "code",
    },
    {
      id: "name",
      header: "Tên túi xách",
      cell: ({ row }) => row.original.name,
      accessorKey: "name",
    },
    {
      id: "category",
      header: "Danh mục",
      cell: ({ row }) => row.original.category || "-",
      accessorKey: "category",
    },
    {
      id: "active",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge
          className="text-xs text-center"
          variant={row.original.active ? "default" : "secondary"}>
          {row.original.active ? "Active" : "Inactive"}
        </Badge>
      ),
      accessorKey: "active",
    },
    {
      id: "description",
      header: "Mô tả",
      cell: ({ row }) => row.original.description || "-",
      accessorKey: "description",
    },
  ], []);

  // Memoized derived values
  const handbags = useMemo(() => handBagList?.data || [], [handBagList?.data]);
  const isLoading = loading || isLoadingHandBags || isRefetching;

  // Initial page index calculation
  const initialPageIndex = useMemo(() =>
    Math.max(0, (calculatedPaginationMeta.currentPage || 1) - 1),
    [calculatedPaginationMeta.currentPage]
  );

  // Memoized form components to prevent unnecessary re-renders
  const createFormComponent = useMemo(() => (
    <HandBagForm onSubmit={handleHandBagFormSubmit} />
  ), [handleHandBagFormSubmit]);

  const editFormComponent = useMemo(() => (
    <HandBagForm onSubmit={handleHandBagFormSubmit} />
  ), [handleHandBagFormSubmit]);

  const viewFormComponent = useMemo(() => (
    <HandBagForm />
  ), []);

  // Update stats whenever handBagList changes
  useEffect(() => {
    if (handBagList?.data) {
      // Calculate stats for dashboard cards
      const total = handBagList.total || 0;
      const active = handBagList.data.filter(bag => bag.active).length;
      const inactive = handBagList.data.filter(bag => !bag.active).length;

      // Get unique categories
      const uniqueCategories = new Set();
      handBagList.data.forEach(bag => {
        if (bag.category) uniqueCategories.add(bag.category);
      });

      // Calculate mock revenue (this would come from your actual data)
      const estimatedRevenuePerBag = 1250; // Mock value
      const revenue = total * estimatedRevenuePerBag;

      setStats({
        totalHandbags: total,
        activeHandbags: active,
        inactiveHandbags: inactive,
        revenue: revenue,
        categories: uniqueCategories.size
      });
    }
  }, [handBagList]);

  // Define dashboard cards
  const dashboardCards = useMemo(() => [
    {
      title: "Tổng số túi xách",
      description: "Tổng số túi xách trong hệ thống",
      data: stats.totalHandbags.toString(),
      icon: ShoppingBag,
      color: "bg-blue-200",
      bgdark: "bg-blue-900",
    },
    {
      title: "Túi xách đang hoạt động",
      description: "Số lượng túi xách đang hoạt động",
      data: stats.activeHandbags.toString(),
      icon: CheckCircle2,
      color: "bg-green-200",
      bgdark: "bg-green-900",
    },
    {
      title: "Túi xách không hoạt động",
      description: "Số lượng túi xách không hoạt động",
      data: stats.inactiveHandbags.toString(),
      icon: AlertCircle,
      color: "bg-red-200",
      bgdark: "bg-red-900",
    },
    {
      title: "Doanh thu ước tính",
      description: "Doanh thu ước tính từ túi xách",
      data: `${(stats.revenue / 1000).toFixed(1)}k`,
      icon: DollarSign,
      color: "bg-yellow-200",
      bgdark: "bg-yellow-900",
    },
    {
      title: "Danh mục",
      description: "Tổng số danh mục túi xách",
      data: stats.categories.toString(),
      icon: Package,
      color: "bg-violet-200",
      bgdark: "bg-violet-900",
    },
  ], [stats])

  const { theme } = useTheme();


  return (
    <div className="container mx-auto py-6 gap-4 flex flex-col">

      {/* Dashboard Cards */}
      <div className="flex flex-wrap gap-4">
        {dashboardCards.map((card, index) => (
          <div key={`handbag-card-${index}`} className="flex-grow basis-60 max-w-xs min-w-60">
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
        data={handbags}
        title="Quản lý túi xách"
        description="Danh sách các túi xách hiện có trong hệ thống"
        actions={["create", "edit", "delete", "read-only"]}
        searchColumn="name"
        searchPlaceholder="Tìm kiếm theo tên túi xách"
        exportData={true}
        onDelete={handleDeleteHandBag}
        onEdit={handleEditHandBag}
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

export default HandBagManagementScreen;