"use client";
import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    useRef
} from "react";
import { BagColor, BagColorCreateDTO, BagColorUpdateDTO, BagColorCondDTO } from "@/common/interface/handbag";
import { BaseResponseData, BasePaginationParams } from "@/hooks/base/useBaseQueries";
import { UseQueryResult, useQueryClient } from "@tanstack/react-query";
import { useBagColorHelpers } from "../useBagColorHelpers";
import { toast } from "../../use-toast";
import { batchDeleteBagColorsParallel, getBagColorById as getBagColorByIdApi } from "@/apis/handbag/handbag.api";
import { useBagColorQueries } from "./useBagColorQueries";
import { useBagColorMutations } from "./useBagColorMutations";

interface BagColorContextType {
    listBagColors: (
        params?: BagColorCondDTO & BasePaginationParams,
        options?: any
    ) => UseQueryResult<BaseResponseData<BagColor>, Error>;
    deleteBagColorMutation: ReturnType<typeof useBagColorMutations>['deleteBagColorMutation'];
    setSelectedBagColor: (bagColor: BagColor | null) => void;
    selectedBagColor: BagColor | null;
    loading: boolean;
    activeFilters: BagColorCondDTO & BasePaginationParams;
    handleCreateBagColor: (data: Omit<BagColorCreateDTO, 'id'>) => Promise<BagColor>;
    handleUpdateBagColor: (id: string, data: Omit<BagColorUpdateDTO, 'id'>) => Promise<BagColor>;
    resetError: () => void;
    updatePagination: (page: number, limit?: number) => void;
    batchDeleteBagColorsMutation: (ids: string[]) => Promise<void>;
}

const BagColorContext = createContext<BagColorContextType | undefined>(undefined);

export const BagColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Use QueryClient for direct cache manipulation
    const queryClient = useQueryClient();

    // State management with stable initializers
    const [selectedBagColor, setSelectedBagColor] = useState<BagColor | null>(null);
    const [loading, setLoading] = useState(false);

    // Important refs to prevent update loops
    const isUpdatingPaginationRef = useRef(false);
    const pendingOperationsRef = useRef(new Set<string>());
    const updateCountRef = useRef(0);
    const updateCountByTypeRef = useRef<Record<string, number>>({});
    const MAX_UPDATES = 200; // Increased limit
    const MAX_UPDATES_PER_TYPE = 100; // Per operation type limit
    const isMountedRef = useRef(true);

    // Track component mount state and reset counters
    React.useEffect(() => {
        // Set mounted flag
        isMountedRef.current = true;

        // Reset all counters on mount
        updateCountRef.current = 0;
        updateCountByTypeRef.current = {};

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Get helpers using memoized initialization
    const {
        updateFilter,
        pagination,
        filterValues: activeFilters,
        resetFilters
    } = useBagColorHelpers();

    // Get queries using stable dependencies
    const {
        listItems: listBagColors,
        invalidateItemCache,
        invalidateListCache
    } = useBagColorQueries();

    // Get mutations using stable dependencies
    const {
        createBagColorMutation,
        updateBagColorMutation,
        deleteBagColorMutation,
        onBagColorMutationSuccess
    } = useBagColorMutations();

    // Track operations to prevent infinite loops, by type
    const incrementOperationCount = useCallback((operationType = 'general') => {
        // Increment general counter
        updateCountRef.current++;

        // Initialize type counter if not exists
        if (!updateCountByTypeRef.current[operationType]) {
            updateCountByTypeRef.current[operationType] = 0;
        }

        // Increment type counter
        updateCountByTypeRef.current[operationType]++;

        // Check global limit first
        if (updateCountRef.current > MAX_UPDATES) {
            console.warn(`Exceeded maximum total operations (${MAX_UPDATES}) in BagColorContext`);
            return false;
        }

        // Check per-type limit
        if (updateCountByTypeRef.current[operationType] > MAX_UPDATES_PER_TYPE) {
            console.warn(`Exceeded maximum operations for ${operationType} (${MAX_UPDATES_PER_TYPE})`);
            return false;
        }

        return true;
    }, []);

    // Helper function to fetch latest bagColor by ID
    const fetchLatestBagColor = useCallback(async (identifier: string, isName = false): Promise<BagColor | null> => {
        try {
            if (!isName) {
                try {
                    // Direct API call instead of using hook
                    const directResult = await getBagColorByIdApi(identifier);
                    if (directResult) return directResult;
                } catch (error) {
                    console.log("Couldn't fetch by ID directly, trying search...");
                }
            }

            // For name search, use direct query instead of hook
            let params: BagColorCondDTO & BasePaginationParams = {
                page: 1,
                limit: 1
            };

            if (isName) {
                params.search = identifier;
            }

            // Use queryClient directly
            try {
                const cacheKey = ['bagColor-list', params];
                // Try cache first
                const cachedData = queryClient.getQueryData<BaseResponseData<BagColor>>(cacheKey);

                if (cachedData?.data?.[0]) {
                    return cachedData.data[0];
                }

                // If not in cache, fetch directly
                const result = await queryClient.fetchQuery({
                    queryKey: cacheKey,
                    queryFn: () => {
                        return listBagColors(params).refetch().then(res => res.data);
                    },
                    staleTime: 0
                });

                if (result?.data?.[0]) {
                    return result.data[0];
                }
            } catch (error) {
                console.error("Error fetching from cache/API:", error);
            }

            return null;
        } catch (error) {
            console.error("Error fetching latest bagColor:", error);
            return null;
        }
    }, [queryClient, listBagColors]);

    // Memoized create handler with proper operation tracking
    const handleCreateBagColor = useCallback(async (data: Omit<BagColorCreateDTO, 'id'>): Promise<BagColor> => {
        // Skip if we've exceeded operation count for create operations
        if (!incrementOperationCount('create')) {
            throw new Error("Too many create operations, try again later");
        }

        // Create a unique request ID
        const requestId = `create-${Date.now()}`;

        // Check if operation is already in progress
        if (pendingOperationsRef.current.has(requestId)) {
            throw new Error("Operation already in progress");
        }

        pendingOperationsRef.current.add(requestId);
        setLoading(true);

        try {
            // Perform mutation
            const result = await createBagColorMutation.mutateAsync(data);

            // Show success toast
            toast({
                title: 'Tạo màu túi xách thành công',
                description: `Màu túi xách "${data.colorName}" đã được tạo.`,
                duration: 2000,
            });

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
            // Handle error
            console.log('Error creating bag color:', error);
            toast({
                title: 'Lỗi tạo màu túi xách',
                description: (error as Error).message,
                variant: 'destructive',
                duration: 3000,
            });
            throw error;
        } finally {
            // Clean up
            if (isMountedRef.current) {
                pendingOperationsRef.current.delete(requestId);
                setLoading(false);
            }
        }
    }, [createBagColorMutation, onBagColorMutationSuccess, fetchLatestBagColor, incrementOperationCount]);

    // Memoized update handler with proper operation tracking
    const handleUpdateBagColor = useCallback(async (id: string, updateData: Omit<BagColorUpdateDTO, 'id'>): Promise<BagColor> => {
        // Skip if we've exceeded operation count for update operations
        if (!incrementOperationCount('update')) {
            throw new Error("Too many update operations, try again later");
        }

        // Create a unique request ID
        const requestId = `update-${id}-${Date.now()}`;

        // Check if operation is already in progress
        if (pendingOperationsRef.current.has(requestId)) {
            throw new Error("Operation already in progress");
        }

        pendingOperationsRef.current.add(requestId);
        setLoading(true);

        try {
            // Perform mutation
            await updateBagColorMutation.mutateAsync({
                id,
                data: updateData
            });

            // Show success toast
            toast({
                title: 'Cập nhật màu túi xách thành công',
                description: `Màu túi xách đã được cập nhật.`,
                duration: 2000,
            });

            // Invalidate cache
            await onBagColorMutationSuccess(id);

            // Fetch updated BagColor
            const updatedBagColor = await fetchLatestBagColor(id);

            if (!updatedBagColor) {
                throw new Error('Không thể lấy thông tin màu túi xách sau khi cập nhật');
            }

            return updatedBagColor;
        } catch (error) {
            // Handle error
            toast({
                title: 'Lỗi cập nhật màu túi xách',
                description: (error as Error).message,
                variant: 'destructive',
                duration: 3000,
            });
            throw error;
        } finally {
            // Clean up
            if (isMountedRef.current) {
                pendingOperationsRef.current.delete(requestId);
                setLoading(false);
            }
        }
    }, [updateBagColorMutation, onBagColorMutationSuccess, fetchLatestBagColor, incrementOperationCount]);

    // Stable pagination update with safeguards
    const updatePagination = useCallback((page: number, limit?: number) => {
        // Skip if already updating
        if (isUpdatingPaginationRef.current) return;

        // Skip if we've exceeded operation count for pagination operations
        if (!incrementOperationCount('pagination')) {
            console.warn("Too many pagination updates, skipping");
            return;
        }

        // Check if values actually changed
        if (pagination.page === page && (!limit || pagination.limit === limit)) {
            return; // No change needed
        }

        // Set flag to prevent re-entry
        isUpdatingPaginationRef.current = true;

        try {
            // Store intended values in locals to ensure they don't change
            const targetPage = page;
            const targetLimit = limit ?? pagination.limit;

            // Batch updates to minimize renders
            updateFilter('page' as keyof BagColorCondDTO, targetPage);
            if (targetLimit !== pagination.limit) {
                updateFilter('limit' as keyof BagColorCondDTO, targetLimit);
            }

            // Clear flag after a safe delay
            setTimeout(() => {
                if (isMountedRef.current) {
                    isUpdatingPaginationRef.current = false;
                }
            }, 50);
        } catch (error) {
            // Ensure flag is cleared even if error occurs
            console.error("Error updating pagination:", error);
            isUpdatingPaginationRef.current = false;
        }
    }, [updateFilter, pagination.page, pagination.limit, incrementOperationCount]);

    // Stable reset error method - don't count this operation type to avoid limits
    const resetError = useCallback(() => {
        // Only increment count if not initial app load (don't count resets at startup)
        const isInitialLoad = updateCountRef.current < 5;

        if (!isInitialLoad && !incrementOperationCount('error_reset')) {
            console.warn("Too many operations, skipping error reset");
            return;
        }

        resetFilters();
    }, [resetFilters, incrementOperationCount]);

    // Batch delete with proper error handling
    const batchDeleteBagColorsMutation = useCallback(async (ids: string[]) => {
        if (!incrementOperationCount('batch_delete')) {
            throw new Error("Too many delete operations, try again later");
        }

        setLoading(true);
        try {
            // Direct batch delete API call
            await batchDeleteBagColorsParallel(ids);

            // Invalidate any relevant cache
            await Promise.all(ids.map(id => invalidateItemCache(id)));
            await invalidateListCache(true);

            // Show success toast
            toast({
                title: 'Xóa màu túi xách thành công',
                description: `Đã xóa ${ids.length} màu túi xách.`,
                duration: 2000,
            });

            return;
        } catch (error) {
            console.error('Error batch deleting bag colors:', error);

            // Show error toast
            toast({
                title: 'Xóa hàng loạt thất bại',
                description: error instanceof Error ? error.message : 'Lỗi không xác định',
                variant: 'destructive',
                duration: 3000,
            });

            throw error;
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [invalidateItemCache, invalidateListCache, incrementOperationCount]);

    // Memoize the entire context value to prevent unnecessary re-renders
    const contextValue = useMemo<BagColorContextType>(() => ({
        listBagColors,
        deleteBagColorMutation,
        setSelectedBagColor,
        selectedBagColor,
        loading,
        activeFilters,
        handleCreateBagColor,
        handleUpdateBagColor,
        resetError,
        updatePagination,
        batchDeleteBagColorsMutation,
    }), [
        listBagColors,
        deleteBagColorMutation,
        setSelectedBagColor,
        selectedBagColor,
        loading,
        activeFilters,
        handleCreateBagColor,
        handleUpdateBagColor,
        resetError,
        updatePagination,
        batchDeleteBagColorsMutation
    ]);

    return (
        <BagColorContext.Provider value={contextValue}>
            {children}
        </BagColorContext.Provider>
    );
};

// Custom hook to use context with error checking
export const useBagColorContext = () => {
    const context = useContext(BagColorContext);
    if (context === undefined) {
        throw new Error('useBagColorContext must be used within a BagColorProvider');
    }
    return context;
};

export default BagColorContext;