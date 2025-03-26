import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { HandBag } from "@/common/interface/handbag";
import HandBagForm from "./form";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { useHandBagContext } from "@/hooks/handbag/HandBagContext";

const HandBagManagementScreen: React.FC = React.memo(() => {
  // Destructure context and hooks with memoization
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
  } = useHandBagContext();

  // Dialog context with memoized access
  const { showDialog } = useDialog();

  // Stable filters to prevent unnecessary refetches
  const stableFilters = useMemo(() => ({
    page: activeFilters.page || 1,
    limit: activeFilters.limit || 10,
    search: activeFilters.search || '',
    active: activeFilters.active,
    category: activeFilters.category
  }), [
    activeFilters.page,
    activeFilters.limit,
    activeFilters.search,
    activeFilters.active,
    activeFilters.category
  ]);

  // Fetch handbag list with optimized query options
  const {
    data: handBagList,
    isLoading: isLoadingHandBags,
    refetch: refetchHandBags,
    isRefetching
  } = listHandBags(stableFilters, {
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  });

  // Memoize pagination calculation
  const calculatedPaginationMeta = useMemo(() => {
    if (!handBagList?.total) {
      return {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: stableFilters.limit || 10
      };
    }

    return {
      totalItems: handBagList.total,
      totalPages: Math.ceil(handBagList.total / (stableFilters.limit || 10)),
      currentPage: stableFilters.page || 1,
      pageSize: stableFilters.limit || 10
    };
  }, [handBagList?.total, stableFilters.limit, stableFilters.page]);

  // Refs to prevent multiple concurrent requests
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  const pendingRequestsRef = useRef(new Set<string>());

  // Memoized safe refetch to prevent unnecessary recreations
  const safeRefetch = useCallback(() => {
    console.log('Safe Refetch Called');
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    const requestId = `refetch-${Date.now()}`;
    pendingRequestsRef.current.add(requestId);

    refetchTimeoutRef.current = setTimeout(() => {
      console.log('Executing Safe Refetch');
      refetchHandBags().finally(() => {
        pendingRequestsRef.current.delete(requestId);
        refetchTimeoutRef.current = null;
      });
    }, 300);
  }, [refetchHandBags]);

  // Memoized page change handler
  const handlePageChange = useCallback((pageIndex: number, pageSize: number) => {
    const apiPage = pageIndex + 1;

    // Only update if there's an actual change
    if (calculatedPaginationMeta.currentPage === apiPage &&
      calculatedPaginationMeta.pageSize === pageSize) {
      return;
    }

    // Update pagination in context
    updatePagination(apiPage, pageSize);

    // Trigger refetch asynchronously
    setTimeout(safeRefetch, 0);
  }, [
    updatePagination,
    safeRefetch,
    calculatedPaginationMeta.currentPage,
    calculatedPaginationMeta.pageSize
  ]);

  // Memoized delete handler
  const handleDeleteHandBag = useCallback(async (id: string): Promise<void> => {
    if (isSubmittingRef.current) return;

    const requestId = `delete-${Date.now()}`;
    try {
      isSubmittingRef.current = true;
      pendingRequestsRef.current.add(requestId);

      await deleteHandBagMutation.mutateAsync(id);

      // Reset selection if deleted bag was selected
      if (selectedHandBag?.id === id) {
        setSelectedHandBag(null);
      }

      safeRefetch();
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
    setSelectedHandBag
  ]);

  // Memoized edit handler
  const handleEditHandBag = useCallback(async (handBag: HandBag): Promise<boolean> => {
    setSelectedHandBag(handBag);
    showDialog({
      type: DialogType.EDIT,
      data: handBag,
    });
    return true;
  }, [setSelectedHandBag, showDialog]);

  // Memoized form submit handler
  const handleHandBagFormSubmit = useCallback(async (data: any): Promise<boolean> => {
    if (isSubmittingRef.current) return false;

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

      safeRefetch();
      setSelectedHandBag(null);
      return true;
    } catch (error) {
      console.error("Error saving handbag data:", error);
      return false;
    } finally {
      isSubmittingRef.current = false;
      pendingRequestsRef.current.delete(requestId);
    }
  }, [handleCreateHandBag, handleUpdateHandBag, safeRefetch, setSelectedHandBag]);

  // Cleanup on unmount with stable dependencies
  useEffect(() => {
    console.log('HandBagManagementScreen Mounted');

    return () => {
      console.log('HandBagManagementScreen Unmounting');

      // Clear all timers and refs
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }

      pendingRequestsRef.current.clear();
      isSubmittingRef.current = false;

      // Reset selected handbag and errors
      setSelectedHandBag(null);
      resetError();
    };
  }, [setSelectedHandBag, resetError]);

  // Columns definition with strict memoization
  const columns: ColumnDef<HandBag>[] = useMemo(() => [
    {
      id: "code",
      header: "Handbag Code",
      cell: ({ row }) => row.original.code,
      accessorKey: "code",
    },
    {
      id: "name",
      header: "Handbag Name",
      cell: ({ row }) => row.original.name,
      accessorKey: "name",
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => row.original.category || "-",
      accessorKey: "category",
    },
    {
      id: "active",
      header: "Status",
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
      header: "Description",
      cell: ({ row }) => row.original.description || "-",
      accessorKey: "description",
    },
  ], []); // Empty dependency array ensures stable reference

  // Derived values with careful memoization
  const handbags = useMemo(() => handBagList?.data || [], [handBagList?.data]);
  const isLoading = loading || isLoadingHandBags || isRefetching;

  // Initial page index calculation with memoization
  const initialPageIndex = useMemo(() =>
    Math.max(0, (calculatedPaginationMeta.currentPage || 1) - 1),
    [calculatedPaginationMeta.currentPage]
  );

  // Prevent unnecessary re-renders with stable references for form components
  const createFormComponent = useMemo(() => (
    <HandBagForm onSubmit={handleHandBagFormSubmit} />
  ), [handleHandBagFormSubmit]);

  const editFormComponent = useMemo(() => (
    <HandBagForm onSubmit={handleHandBagFormSubmit} />
  ), [handleHandBagFormSubmit]);

  const viewFormComponent = useMemo(() => (
    <HandBagForm />
  ), []);

  return (
    <div className="container mx-auto py-6">
      <DataTable
        columns={columns}
        data={handbags}
        title="Handbag Management"
        description="Manage handbag information in the system"
        actions={["create", "edit", "delete", "read-only"]}
        searchColumn="name"
        searchPlaceholder="Search by handbag name..."
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
      />
    </div>
  );
});

export default HandBagManagementScreen;