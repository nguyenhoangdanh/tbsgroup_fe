"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { Badge } from "@/components/ui/badge";
import { BagColor } from "@/common/interface/handbag";
import BagColorForm from "./form";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { useHandBagQueries } from "@/hooks/handbag/useHandBagQueries";
import { useHandBagMutations } from "@/hooks/handbag/useHandBagMutations";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Droplet, Palette, PaintBucket } from "lucide-react";
import { useTheme } from "next-themes";
import { DashboardCardComponent } from "@/components/common/layouts/admin/DashboardCard";

// Define explicit tracker state type
type FilterTrackerState = {
    page: number;
    limit: number;
    search: string;
    active: boolean | undefined;
    handBagId: string | undefined;
    colorCode: string | undefined;
    colorName: string | undefined;
};

const BagColorManagementScreen: React.FC = React.memo(() => {
    // Get dialog context
    const { updateDialogData, showDialog } = useDialog();

    // Get handbag queries for colors
    const {
        listBagColors,
        getBagColorById,
        invalidateBagColorCache,
        invalidateBagColorsCache,
        listItems: listHandBags
    } = useHandBagQueries();

    const { data: handBags } = listHandBags();

    const handbagOptions = useMemo(() => {
        if (!handBags?.data) return [];

        return handBags?.data.map(bag => ({
            label: bag.name,
            value: bag.id
        }));
    }, [handBags?.data]);

    // Get mutations 
    const {
        deleteBagColorMutation,
        onBagColorMutationSuccess,
        createBagColorMutation,
        updateBagColorMutation
    } = useHandBagMutations();

    // State management
    const [selectedBagColor, setSelectedBagColor] = useState<BagColor | null>(null);
    const [loading, setLoading] = useState(false);

    // Stats for dashboard cards
    const [stats, setStats] = useState({
        totalColors: 0,
        activeColors: 0,
        inactiveColors: 0,
        uniqueHandbags: 0,
        uniqueColorGroups: 0
    });

    // State for tracking whether component is mounted
    const [isMounted, setIsMounted] = useState(true);

    // Initial active filters
    const [activeFilters, setActiveFilters] = useState({
        page: 1,
        limit: 10,
        search: '',
        active: undefined as boolean | undefined,
        handBagId: undefined as string | undefined,
        colorCode: undefined as string | undefined,
        colorName: undefined as string | undefined,
    });

    // Filter trackers
    const [filterTrackers, setFilterTrackers] = useState<FilterTrackerState>({
        page: activeFilters.page || 1,
        limit: activeFilters.limit || 10,
        search: activeFilters.search || '',
        active: activeFilters.active,
        handBagId: activeFilters.handBagId,
        colorCode: activeFilters.colorCode,
        colorName: activeFilters.colorName
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

            // Set selected bag color to null
            setSelectedBagColor(null);
        };
    }, []);

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
            console.warn(`Exceeded maximum operations (${MAX_OPERATIONS}) in BagColorManagementScreen [${operationType}]`);
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
            prevActiveFiltersRef.current.handBagId !== activeFilters.handBagId ||
            prevActiveFiltersRef.current.colorCode !== activeFilters.colorCode ||
            prevActiveFiltersRef.current.colorName !== activeFilters.colorName;

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
                handBagId: activeFilters.handBagId,
                colorCode: activeFilters.colorCode,
                colorName: activeFilters.colorName
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
        handBagId: filterTrackers.handBagId,
        colorCode: filterTrackers.colorCode,
        colorName: filterTrackers.colorName
    }), [filterTrackers]);

    // Fetch bagColor list with query options
    const {
        data: bagColorList,
        isLoading: isLoadingBagColors,
        refetch: refetchBagColors,
        isRefetching
    } = listBagColors(stableFilters, {
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
                refetchBagColors().finally(() => {
                    if (isMounted) {
                        pendingRequestsRef.current.delete(requestId);
                        refetchTimeoutRef.current = null;
                    }
                });
            }
        }, 300);
    }, [refetchBagColors, isMounted, incrementOperationCount]);

    // Update pagination
    const updatePagination = useCallback((page: number, limit?: number) => {
        // Skip if already updating
        if (isUpdatingPaginationRef.current) return;

        // Skip if we've exceeded operation count for pagination operations
        if (!incrementOperationCount('pagination')) {
            console.warn("Too many pagination updates, skipping");
            return;
        }

        // Check if values actually changed
        if (activeFilters.page === page && (!limit || activeFilters.limit === limit)) {
            return; // No change needed
        }

        // Set flag to prevent re-entry
        isUpdatingPaginationRef.current = true;

        try {
            setActiveFilters(prev => ({
                ...prev,
                page,
                limit: limit || prev.limit
            }));

            // Clear flag after a safe delay
            setTimeout(() => {
                if (isMounted) {
                    isUpdatingPaginationRef.current = false;
                }
            }, 50);
        } catch (error) {
            // Ensure flag is cleared even if error occurs
            console.error("Error updating pagination:", error);
            isUpdatingPaginationRef.current = false;
        }
    }, [activeFilters.page, activeFilters.limit, isMounted, incrementOperationCount]);

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

    // Helper function to fetch latest bagColor by ID
    const fetchLatestBagColor = useCallback(async (id: string): Promise<BagColor | null> => {
        try {
            const result = await getBagColorById(id).refetch();
            return result.data as BagColor;
        } catch (error) {
            console.error("Error fetching latest bag color:", error);
            return null;
        }
    }, [getBagColorById]);

    // Handle delete operations
    const handleDeleteBagColor = useCallback(async (id: string): Promise<void> => {
        if (isSubmittingRef.current || !incrementOperationCount()) return;

        const requestId = `delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            await deleteBagColorMutation.mutateAsync(id);

            if (selectedBagColor?.id === id) {
                setSelectedBagColor(null);
            }

            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);
        } catch (error) {
            console.error("Error deleting bag color:", error);
        } finally {
            isSubmittingRef.current = false;
            pendingRequestsRef.current.delete(requestId);
        }
    }, [
        deleteBagColorMutation,
        safeRefetch,
        selectedBagColor?.id,
        isMounted,
        incrementOperationCount
    ]);

    // Handle edit operations
    const handleEditBagColor = useCallback(async (bagColor: BagColor): Promise<boolean> => {
        if (dialogUpdateInProgressRef.current || !incrementOperationCount()) return false;

        dialogUpdateInProgressRef.current = true;

        try {
            // Update context first
            setSelectedBagColor(bagColor);

            // Schedule dialog show to break potential update cycle
            const timeoutId = setTimeout(() => {
                if (isMounted) {
                    showDialog({
                        type: DialogType.EDIT,
                        data: bagColor,
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
    }, [setSelectedBagColor, showDialog, isMounted, incrementOperationCount]);

    // Handle batch delete operations
    const handleBatchDelete = useCallback(async (ids: string[]): Promise<void> => {
        if (isSubmittingRef.current || !incrementOperationCount()) return;

        const requestId = `batch-delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            // Delete each bag color one by one
            await Promise.all(ids.map(id => deleteBagColorMutation.mutateAsync(id)));

            if (selectedBagColor && ids.includes(selectedBagColor.id)) {
                setSelectedBagColor(null);
            }

            // Invalidate cache
            await Promise.all(ids.map(id => invalidateBagColorCache(id)));
            await invalidateBagColorsCache(true);

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
        deleteBagColorMutation,
        invalidateBagColorCache,
        invalidateBagColorsCache,
        setSelectedBagColor,
        selectedBagColor,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);

    // Memoized create handler with proper operation tracking
    const handleCreateBagColor = useCallback(async (data: any): Promise<BagColor> => {
        // Skip if we've exceeded operation count for create operations
        if (!incrementOperationCount('create')) {
            throw new Error("Too many create operations, try again later");
        }

        // Create a unique request ID
        const requestId = `create-${Date.now()}`;

        // Check if operation is already in progress
        if (pendingRequestsRef.current.has(requestId)) {
            throw new Error("Operation already in progress");
        }

        pendingRequestsRef.current.add(requestId);
        setLoading(true);

        try {
            // Perform mutation
            const result = await createBagColorMutation.mutateAsync(data);

            // Show success toast via useHandBagMutations

            // Get ID from result
            const createdId = result?.id;

            if (!createdId) {
                console.error("API response missing ID:", result);
                throw new Error("Could not create bag color - No ID returned from API");
            }

            // Invalidate cache
            await onBagColorMutationSuccess(createdId, data.handBagId);

            // Fetch complete BagColor object
            let createdBagColor: BagColor;

            try {
                const fetchedColor = await fetchLatestBagColor(createdId);
                if (fetchedColor) {
                    createdBagColor = fetchedColor;
                } else {
                    // Fallback
                    createdBagColor = {
                        id: createdId,
                        ...data,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        active: true
                    } as BagColor;
                }
            } catch (fetchError) {
                console.warn("Failed to fetch created bag color, using fallback:", fetchError);
                // Fallback
                createdBagColor = {
                    id: createdId,
                    ...data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    active: true
                } as BagColor;
            }

            return createdBagColor;
        } catch (error) {
            // Handle error already done in mutation
            throw error;
        } finally {
            // Clean up
            if (isMounted) {
                pendingRequestsRef.current.delete(requestId);
                setLoading(false);
            }
        }
    }, [createBagColorMutation, onBagColorMutationSuccess, fetchLatestBagColor, incrementOperationCount]);

    // Memoized update handler with proper operation tracking
    const handleUpdateBagColor = useCallback(async (id: string, updateData: any): Promise<BagColor> => {
        // Skip if we've exceeded operation count for update operations
        if (!incrementOperationCount('update')) {
            throw new Error("Too many update operations, try again later");
        }

        // Create a unique request ID
        const requestId = `update-${id}-${Date.now()}`;

        // Check if operation is already in progress
        if (pendingRequestsRef.current.has(requestId)) {
            throw new Error("Operation already in progress");
        }

        pendingRequestsRef.current.add(requestId);
        setLoading(true);

        try {
            // Perform mutation
            await updateBagColorMutation.mutateAsync({
                id,
                data: updateData
            });

            // Invalidate cache
            await onBagColorMutationSuccess(id, updateData.handBagId);

            // Fetch updated BagColor
            const updatedBagColor = await fetchLatestBagColor(id);

            if (!updatedBagColor) {
                throw new Error('Không thể lấy thông tin màu túi xách sau khi cập nhật');
            }

            return updatedBagColor;
        } catch (error) {
            // Handle error via mutation
            throw error;
        } finally {
            // Clean up
            if (isMounted) {
                pendingRequestsRef.current.delete(requestId);
                setLoading(false);
            }
        }
    }, [updateBagColorMutation, onBagColorMutationSuccess, fetchLatestBagColor, incrementOperationCount]);

    // Handle form submission
    const handleBagColorFormSubmit = useCallback(async (data: any): Promise<boolean> => {
        if (isSubmittingRef.current || !isMounted || !incrementOperationCount()) return false;

        const requestId = `submit-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            if (data.id) {
                const { id, createdAt, updatedAt, ...updateData } = data;
                await handleUpdateBagColor(id, updateData);
            } else {
                const { id, createdAt, updatedAt, ...createData } = data;
                await handleCreateBagColor(createData);
            }

            // Clear selection first
            setSelectedBagColor(null);

            // Wait for context updates to complete
            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);

            return true;
        } catch (error) {
            console.error("Error saving bag color data:", error);
            return false;
        } finally {
            if (isMounted) {
                isSubmittingRef.current = false;
                pendingRequestsRef.current.delete(requestId);
            }
        }
    }, [
        handleCreateBagColor,
        handleUpdateBagColor,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);

    // Effect for updating dialog data - with better loop prevention
    useEffect(() => {
        if (!isMounted || !selectedBagColor || dialogUpdateInProgressRef.current) return;

        // Track effect count to prevent excessive executions
        if (!incrementOperationCount('dialog_effect')) {
            console.warn("Max effect executions reached in dialog data sync");
            return;
        }

        // Prevent concurrent or recursive updates
        dialogUpdateInProgressRef.current = true;

        const timeoutId = setTimeout(() => {
            if (isMounted) {
                updateDialogData(selectedBagColor);
                setTimeout(() => {
                    dialogUpdateInProgressRef.current = false;
                }, 50);
            }
        }, 50);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [selectedBagColor, updateDialogData, isMounted, incrementOperationCount]);

    // Calculate pagination metadata
    const calculatedPaginationMeta = useMemo(() => {
        if (!bagColorList?.total) {
            return {
                totalItems: 0,
                totalPages: 0,
                currentPage: filterTrackers.page,
                pageSize: filterTrackers.limit
            };
        }

        return {
            totalItems: bagColorList.total,
            totalPages: Math.ceil(bagColorList.total / filterTrackers.limit),
            currentPage: filterTrackers.page,
            pageSize: filterTrackers.limit
        };
    }, [bagColorList?.total, filterTrackers.page, filterTrackers.limit]);

    // Table columns definition
    const columns: ColumnDef<BagColor>[] = useMemo(() => [
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
            id: "colorCode",
            header: "Mã màu",
            cell: ({ row }) => row.original.colorCode,
            accessorKey: "colorCode",
        },
        {
            id: "colorName",
            header: "Tên màu",
            cell: ({ row }) => row.original.colorName,
            accessorKey: "colorName",
        },
        {
            id: "preview",
            header: "Màu hiển thị",
            cell: ({ row }) => (
                <div
                    className="w-8 h-8 rounded-full border border-gray-200"
                    style={{ backgroundColor: row.original.colorCode }}
                />
            ),
        },
        // {
        //     id: "handBagId",
        //     header: "Thuộc túi xách",
        //     cell: ({ row }) => row.original.handBagName || row.original.handBagId || "-",
        //     accessorKey: "handBagId",
        // },
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
            id: "notes",
            header: "Mô tả",
            cell: ({ row }) => row.original.notes || "-",
            accessorKey: "description",
        },
    ], []);

    // Memoized derived values
    const bagColors = useMemo(() => bagColorList?.data || [], [bagColorList]);
    const isLoading = loading || isLoadingBagColors || isRefetching;

    // Initial page index calculation
    const initialPageIndex = useMemo(() =>
        Math.max(0, (calculatedPaginationMeta.currentPage || 1) - 1),
        [calculatedPaginationMeta.currentPage]
    );

    // Memoized form components to prevent unnecessary re-renders
    const createFormComponent = useMemo(() => (
        <BagColorForm handbags={handbagOptions} onSubmit={handleBagColorFormSubmit} />
    ), [handleBagColorFormSubmit]);

    const editFormComponent = useMemo(() => (
        <BagColorForm handbags={handbagOptions} onSubmit={handleBagColorFormSubmit} />
    ), [handleBagColorFormSubmit]);

    const viewFormComponent = useMemo(() => (
        <BagColorForm />
    ), []);

    // Update stats whenever bagColorList changes
    useEffect(() => {
        if (bagColorList?.data) {
            // Calculate stats
            const total = bagColorList.total || 0;
            const active = bagColorList.data.filter(color => color.active).length;
            const inactive = bagColorList.data.filter(color => !color.active).length;

            // Count unique handbags
            const uniqueHandbags = new Set();
            bagColorList.data.forEach(color => {
                if (color.handBagId) uniqueHandbags.add(color.handBagId);
            });

            // Group colors by first character of color name (for example)
            const colorGroups = new Set();
            bagColorList.data.forEach(color => {
                if (color.colorName) {
                    const firstChar = color.colorName.charAt(0).toUpperCase();
                    colorGroups.add(firstChar);
                }
            });

            setStats({
                totalColors: total,
                activeColors: active,
                inactiveColors: inactive,
                uniqueHandbags: uniqueHandbags.size,
                uniqueColorGroups: colorGroups.size
            });
        }
    }, [bagColorList]);

    // Define dashboard cards
    const dashboardCards = useMemo(() => [
        {
            title: "Tổng số màu túi",
            description: "Tổng số màu túi xách trong hệ thống",
            data: stats.totalColors.toString(),
            icon: Palette,
            color: "bg-blue-200",
            bgdark: "bg-blue-900",
        },
        {
            title: "Màu đang hoạt động",
            description: "Số lượng màu đang hoạt động",
            data: stats.activeColors.toString(),
            icon: CheckCircle2,
            color: "bg-green-200",
            bgdark: "bg-green-900",
        },
        {
            title: "Màu không hoạt động",
            description: "Số lượng màu không hoạt động",
            data: stats.inactiveColors.toString(),
            icon: AlertCircle,
            color: "bg-red-200",
            bgdark: "bg-red-900",
        },
        {
            title: "Phân loại màu",
            description: "Số nhóm màu khác nhau",
            data: stats.uniqueColorGroups.toString(),
            icon: Droplet,
            color: "bg-purple-200",
            bgdark: "bg-purple-900",
        },
        {
            title: "Túi xách",
            description: "Số túi xách có màu sắc",
            data: stats.uniqueHandbags.toString(),
            icon: PaintBucket,
            color: "bg-yellow-200",
            bgdark: "bg-yellow-900",
        },
    ], [stats]);

    const { theme } = useTheme();

    // Reset filters function
    const resetFilters = useCallback(() => {
        setActiveFilters({
            page: 1,
            limit: 10,
            search: '',
            active: undefined,
            handBagId: undefined,
            colorCode: undefined,
            colorName: undefined,
        });
    }, []);

    // Filter by active status
    const filterByActiveStatus = useCallback((active: boolean | undefined) => {
        setActiveFilters(prev => ({
            ...prev,
            active,
            page: 1, // Reset to first page when filtering
        }));
    }, []);

    // Search by name
    const searchByName = useCallback((search: string) => {
        setActiveFilters(prev => ({
            ...prev,
            search,
            page: 1, // Reset to first page when searching
        }));
    }, []);

    // Filter by handBag
    const filterByHandBag = useCallback((handBagId: string | undefined) => {
        setActiveFilters(prev => ({
            ...prev,
            handBagId,
            page: 1, // Reset to first page when filtering
        }));
    }, []);

    return (
        <div className="container mx-auto py-6 gap-4 flex flex-col">
            {/* Dashboard Cards */}
            <div className="flex flex-wrap gap-4">
                {dashboardCards.map((card, index) => (
                    <div key={`bagcolor-card-${index}`} className="flex-grow basis-60 max-w-xs min-w-60">
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
                data={bagColors}
                title="Quản lý màu túi xách"
                description="Danh sách các màu túi xách hiện có trong hệ thống"
                actions={["create", "edit", "delete", "read-only"]}
                searchColumn="colorName"
                searchPlaceholder="Tìm kiếm theo tên màu..."
                exportData={true}
                onDelete={handleDeleteBagColor}
                onEdit={handleEditBagColor}
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

export default BagColorManagementScreen;