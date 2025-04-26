"use client";
import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    useRef,
    useEffect
} from "react";
import { BasePaginationParams } from "@/hooks/base/useBaseQueries";
import { useGroupQueries } from "@/hooks/group/useGroupQueries";
import { useGroupMutations } from "@/hooks/group/useGroupMutations";
import { useDialog, DialogType } from "@/contexts/DialogProvider";
import { Group } from "@/common/interface/group";

// Define type for filter conditions
export interface GroupCondDTO {
    search?: string;
    code?: string;
    name?: string;
    teamId?: string;
}

// Define context type
interface GroupContextType {
    // State
    selectedGroup: Group | null;
    loading: boolean;
    activeFilters: GroupCondDTO & BasePaginationParams;
    stats: {
        totalGroups: number;
        totalTeams: number;
        totalLeaders: number;
        uniqueCategories: number;
    };
    groups: Group[];
    isLoading: boolean;
    calculatedPaginationMeta: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
    initialPageIndex: number;

    // Actions
    setSelectedGroup: (group: Group | null) => void;
    handleCreateGroup: (data: any) => Promise<Group>;
    handleUpdateGroup: (id: string, updateData: any) => Promise<Group>;
    handleDeleteGroup: (id: string) => Promise<void>;
    handleBatchDelete: (ids: string[]) => Promise<void>;
    handleEditGroup: (group: Group) => Promise<boolean>;
    handleGroupFormSubmit: (data: any) => Promise<boolean>;
    handlePageChange: (pageIndex: number, pageSize: number) => void;
    resetFilters: () => void;
    searchByNameOrCode: (search: string) => void;
    safeRefetch: () => void;
}

// Create context
const GroupContext = createContext<GroupContextType | undefined>(undefined);

// Max operations to prevent infinite loops
const MAX_OPERATIONS = 200;

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Dialog context
    const { updateDialogData, showDialog, hideDialog } = useDialog();

    // Get queries and mutations
    const {
        listGroups,
        getGroupById,
        invalidateGroupCache,
        invalidateGroupsCache
    } = useGroupQueries();

    const {
        createGroupMutation,
        updateGroupMutation,
        deleteGroupMutation,
        onGroupMutationSuccess
    } = useGroupMutations();

    // State management
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(true);

    // Stats for dashboard cards
    const [stats, setStats] = useState({
        totalGroups: 0,
        totalTeams: 0,
        totalLeaders: 0,
        uniqueCategories: 0,
    });

    // Initial active filters
    const [activeFilters, setActiveFilters] = useState<GroupCondDTO & BasePaginationParams>({
        page: 1,
        limit: 10,
        search: '',
        code: undefined,
        name: undefined,
        teamId: undefined,
    });

    // Filter trackers
    const [filterTrackers, setFilterTrackers] = useState({
        page: activeFilters.page || 1,
        limit: activeFilters.limit || 10,
        search: activeFilters.search || '',
        code: activeFilters.code,
        name: activeFilters.name,
        teamId: activeFilters.teamId
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
            setSelectedGroup(null);
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
            console.warn(`Exceeded maximum operations (${MAX_OPERATIONS}) in GroupContext [${operationType}]`);
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
            prevActiveFiltersRef.current.code !== activeFilters.code ||
            prevActiveFiltersRef.current.name !== activeFilters.name ||
            prevActiveFiltersRef.current.teamId !== activeFilters.teamId;

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
                code: activeFilters.code,
                name: activeFilters.name,
                teamId: activeFilters.teamId
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
        code: filterTrackers.code,
        name: filterTrackers.name,
        teamId: filterTrackers.teamId
    }), [filterTrackers]);

    // Fetch group list with query options
    const {
        data: groupList,
        isLoading: isLoadingGroups,
        refetch: refetchGroups,
        isRefetching
    } = listGroups(stableFilters, {
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
                refetchGroups().finally(() => {
                    if (isMounted) {
                        pendingRequestsRef.current.delete(requestId);
                        refetchTimeoutRef.current = null;
                    }
                });
            }
        }, 300);
    }, [refetchGroups, isMounted, incrementOperationCount]);

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

    // Helper function to fetch latest group by ID
    const fetchLatestGroup = useCallback(async (id: string): Promise<Group | null> => {
        try {
            const result = await getGroupById(id).refetch();
            return result.data as Group;
        } catch (error) {
            console.error("Error fetching latest group:", error);
            return null;
        }
    }, [getGroupById]);

    // Handle delete operations
    const handleDeleteGroup = useCallback(async (id: string): Promise<void> => {
        if (isSubmittingRef.current || !incrementOperationCount()) return;

        const requestId = `delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            await deleteGroupMutation.mutateAsync(id);

            if (selectedGroup?.id === id) {
                setSelectedGroup(null);
            }

            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);
        } catch (error) {
            console.error("Error deleting group:", error);
        } finally {
            isSubmittingRef.current = false;
            pendingRequestsRef.current.delete(requestId);
        }
    }, [
        deleteGroupMutation,
        safeRefetch,
        selectedGroup?.id,
        setSelectedGroup,
        isMounted,
        incrementOperationCount
    ]);

    // Handle edit operations
    const handleEditGroup = useCallback(async (group: Group): Promise<boolean> => {
        if (dialogUpdateInProgressRef.current || !incrementOperationCount()) return false;

        dialogUpdateInProgressRef.current = true;

        try {
            // Update context first
            setSelectedGroup(group);

            // Schedule dialog show to break potential update cycle
            const timeoutId = setTimeout(() => {
                if (isMounted) {
                    showDialog({
                        type: DialogType.EDIT,
                        data: group,
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
    }, [setSelectedGroup, showDialog, isMounted, incrementOperationCount]);

    // Handle batch delete operations
    const handleBatchDelete = useCallback(async (ids: string[]): Promise<void> => {
        if (isSubmittingRef.current || !incrementOperationCount()) return;

        const requestId = `batch-delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            // Delete each group one by one
            await Promise.all(ids.map(id => deleteGroupMutation.mutateAsync(id)));

            if (selectedGroup && ids.includes(selectedGroup.id)) {
                setSelectedGroup(null);
            }

            // Invalidate cache
            await Promise.all(ids.map(id => invalidateGroupCache(id)));
            await invalidateGroupsCache(true);

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
        deleteGroupMutation,
        invalidateGroupCache,
        invalidateGroupsCache,
        setSelectedGroup,
        selectedGroup,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);

    // Memoized create handler with proper operation tracking
    const handleCreateGroup = useCallback(async (data: any): Promise<Group> => {
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
            const result = await createGroupMutation.mutateAsync(data);

            // Get ID from result
            const createdId = result?.id;

            if (!createdId) {
                console.error("API response missing ID:", result);
                throw new Error("Could not create group - No ID returned from API");
            }

            // Invalidate cache
            await onGroupMutationSuccess(createdId);

            // Fetch complete Group object
            let createdGroup: Group;

            try {
                const fetchedGroup = await fetchLatestGroup(createdId);
                if (fetchedGroup) {
                    createdGroup = fetchedGroup;
                } else {
                    // Fallback
                    createdGroup = {
                        id: createdId,
                        ...data,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } as Group;
                }
            } catch (fetchError) {
                console.warn("Failed to fetch created group, using fallback:", fetchError);
                // Fallback
                createdGroup = {
                    id: createdId,
                    ...data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as Group;
            }

            return createdGroup;
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
    }, [createGroupMutation, onGroupMutationSuccess, fetchLatestGroup, incrementOperationCount]);

    // Memoized update handler with proper operation tracking
    const handleUpdateGroup = useCallback(async (id: string, updateData: any): Promise<Group> => {
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
            await updateGroupMutation.mutateAsync({
                id,
                data: updateData
            });

            // Invalidate cache
            await onGroupMutationSuccess(id);

            // Fetch updated Group
            const updatedGroup = await fetchLatestGroup(id);

            if (!updatedGroup) {
                throw new Error('Không thể lấy thông tin nhóm sau khi cập nhật');
            }

            return updatedGroup;
        } catch (error) {
            // Handle error via mutation
            throw error;
        } finally {
            // Clean up
            if (isMounted) {
                pendingRequestsRef.current.delete(requestId);
                setLoading(false);
                hideDialog();
            }
        }
    }, [updateGroupMutation, onGroupMutationSuccess, fetchLatestGroup, hideDialog, incrementOperationCount]);

    // Handle form submission
    const handleGroupFormSubmit = useCallback(async (data: any): Promise<boolean> => {
        if (isSubmittingRef.current || !isMounted || !incrementOperationCount()) return false;

        const requestId = `submit-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            if (data.id) {
                const { id, createdAt, updatedAt, ...updateData } = data;
                await handleUpdateGroup(id, updateData);
            } else {
                const { id, createdAt, updatedAt, ...createData } = data;
                await handleCreateGroup(createData);
            }

            // Clear selection first
            setSelectedGroup(null);

            // Wait for context updates to complete
            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);

            return true;
        } catch (error) {
            console.error("Error saving group data:", error);
            return false;
        } finally {
            if (isMounted) {
                isSubmittingRef.current = false;
                pendingRequestsRef.current.delete(requestId);
            }
        }
    }, [
        handleCreateGroup,
        handleUpdateGroup,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);

    // Effect for updating dialog data - with better loop prevention
    useEffect(() => {
        if (!isMounted || !selectedGroup || dialogUpdateInProgressRef.current) return;

        // Track effect count to prevent excessive executions
        if (!incrementOperationCount('dialog_effect')) {
            console.warn("Max effect executions reached in dialog data sync");
            return;
        }

        // Prevent concurrent or recursive updates
        dialogUpdateInProgressRef.current = true;

        const timeoutId = setTimeout(() => {
            if (isMounted) {
                updateDialogData(selectedGroup);
                setTimeout(() => {
                    dialogUpdateInProgressRef.current = false;
                }, 50);
            }
        }, 50);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [selectedGroup, updateDialogData, isMounted, incrementOperationCount]);

    // Calculate pagination metadata
    const calculatedPaginationMeta = useMemo(() => {
        if (!groupList?.total) {
            return {
                totalItems: 0,
                totalPages: 0,
                currentPage: filterTrackers.page,
                pageSize: filterTrackers.limit
            };
        }

        return {
            totalItems: groupList.total,
            totalPages: Math.ceil(groupList.total / filterTrackers.limit),
            currentPage: filterTrackers.page,
            pageSize: filterTrackers.limit
        };
    }, [groupList?.total, filterTrackers.page, filterTrackers.limit]);

    // Initial page index calculation
    const initialPageIndex = useMemo(() =>
        Math.max(0, (calculatedPaginationMeta.currentPage || 1) - 1),
        [calculatedPaginationMeta.currentPage]
    );

    // Memoized derived values
    const groups = useMemo(() => groupList?.data || [], [groupList?.data]);
    const isLoading = loading || isLoadingGroups || isRefetching;

    // Update stats whenever groupList changes
    useEffect(() => {
        if (groupList?.data) {
            // Calculate stats
            const total = groupList.total || 0;
            const teams = new Set(groupList.data.map(group => group.teamId)).size;
            const leaders = groupList.data.reduce((sum, group) => sum + (group.leaders?.length || 0), 0);

            // Count unique categories (based on first letter of code for example)
            const categories = new Set();
            groupList.data.forEach(group => {
                if (group.code) {
                    const firstChar = group.code.charAt(0).toUpperCase();
                    categories.add(firstChar);
                }
            });

            setStats({
                totalGroups: total,
                totalTeams: teams,
                totalLeaders: leaders,
                uniqueCategories: categories.size
            });
        }
    }, [groupList]);

    // Reset filters function
    const resetFilters = useCallback(() => {
        setActiveFilters({
            page: 1,
            limit: 10,
            search: '',
            code: undefined,
            name: undefined,
            teamId: undefined,
        });
    }, []);

    // Search by name or code
    const searchByNameOrCode = useCallback((search: string) => {
        setActiveFilters(prev => ({
            ...prev,
            search,
            page: 1, // Reset to first page when
        }));
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo<GroupContextType>(() => ({
        // State
        selectedGroup,
        loading,
        activeFilters,
        stats,
        groups,
        isLoading,
        calculatedPaginationMeta,
        initialPageIndex,

        // Actions
        setSelectedGroup,
        handleCreateGroup,
        handleUpdateGroup,
        handleDeleteGroup,
        handleBatchDelete,
        handleEditGroup,
        handleGroupFormSubmit,
        handlePageChange,
        resetFilters,
        searchByNameOrCode,
        safeRefetch
    }), [
        selectedGroup,
        loading,
        activeFilters,
        stats,
        groups,
        isLoading,
        calculatedPaginationMeta,
        initialPageIndex,
        setSelectedGroup,
        handleCreateGroup,
        handleUpdateGroup,
        handleDeleteGroup,
        handleBatchDelete,
        handleEditGroup,
        handleGroupFormSubmit,
        handlePageChange,
        resetFilters,
        searchByNameOrCode,
        safeRefetch
    ]);

    return (
        <GroupContext.Provider value={contextValue}>
            {children}
        </GroupContext.Provider>
    );
};

// Custom hook to use context
export const useGroup = () => {
    const context = useContext(GroupContext);
    if (context === undefined) {
        throw new Error('useGroup must be used within a GroupProvider');
    }
    return context;
};