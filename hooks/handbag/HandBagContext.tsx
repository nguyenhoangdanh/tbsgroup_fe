"use client";
import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    useRef
} from "react";
import { HandBag, HandBagCreateDTO, HandBagUpdateDTO, HandBagCondDTO } from "@/common/interface/handbag";
import { BaseResponseData, BasePaginationParams } from "@/hooks/base/useBaseQueries";
import { UseQueryResult, useQueryClient } from "@tanstack/react-query";
import { useHandBagMutations } from "./useHandBagMutations";
import { useHandBagHelpers } from "./useHandBagHelpers";
import { useHandBagQueries } from "./useHandBagQueries";
import { toast } from "../use-toast";
import { batchDeleteHandBagsParallel, getHandBagById as getHandBagByIdApi } from "@/apis/handbag/handbag.api";

interface HandBagContextType {
    listHandBags: (
        params?: HandBagCondDTO & BasePaginationParams,
        options?: any
    ) => UseQueryResult<BaseResponseData<HandBag>, Error>;
    deleteHandBagMutation: ReturnType<typeof useHandBagMutations>['deleteHandBagMutation'];
    setSelectedHandBag: (handbag: HandBag | null) => void;
    selectedHandBag: HandBag | null;
    loading: boolean;
    activeFilters: HandBagCondDTO & BasePaginationParams;
    handleCreateHandBag: (data: Omit<HandBagCreateDTO, 'id'>) => Promise<HandBag>;
    handleUpdateHandBag: (id: string, data: Omit<HandBagUpdateDTO, 'id'>) => Promise<HandBag>;
    resetError: () => void;
    updatePagination: (page: number, limit?: number) => void;
    batchDeleteHandBagsMutation: (ids: string[]) => Promise<void>;
}

const HandBagContext = createContext<HandBagContextType | undefined>(undefined);

export const HandBagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Use QueryClient for direct cache manipulation
    const queryClient = useQueryClient();

    // State management with stable initializers
    const [selectedHandBag, setSelectedHandBag] = useState<HandBag | null>(null);
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
    } = useHandBagHelpers();

    // Get queries using stable dependencies
    const {
        listItems: listHandBags,
        invalidateItemCache,
        invalidateListCache
    } = useHandBagQueries();

    // Get mutations using stable dependencies
    const {
        createHandBagMutation,
        updateHandBagMutation,
        deleteHandBagMutation,
        onHandBagMutationSuccess
    } = useHandBagMutations();

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
            console.warn(`Exceeded maximum total operations (${MAX_UPDATES}) in HandBagContext`);
            return false;
        }

        // Check per-type limit
        if (updateCountByTypeRef.current[operationType] > MAX_UPDATES_PER_TYPE) {
            console.warn(`Exceeded maximum operations for ${operationType} (${MAX_UPDATES_PER_TYPE})`);
            return false;
        }

        return true;
    }, []);

    // Helper function to fetch latest handbag by ID - FIXED
    const fetchLatestHandBag = useCallback(async (identifier: string, isName = false): Promise<HandBag | null> => {
        try {
            if (!isName) {
                try {
                    // Direct API call instead of using hook
                    const directResult = await getHandBagByIdApi(identifier);
                    if (directResult) return directResult;
                } catch (error) {
                    console.log("Couldn't fetch by ID directly, trying search...");
                }
            }

            // For name search, use direct query instead of hook
            let params: HandBagCondDTO & BasePaginationParams = {
                page: 1,
                limit: 1
            };

            if (isName) {
                params.search = identifier;
            }

            // Use queryClient directly
            try {
                const cacheKey = ['handBag-list', params];
                // Try cache first
                const cachedData = queryClient.getQueryData<BaseResponseData<HandBag>>(cacheKey);

                if (cachedData?.data?.[0]) {
                    return cachedData.data[0];
                }

                // If not in cache, fetch directly
                const result = await queryClient.fetchQuery({
                    queryKey: cacheKey,
                    queryFn: () => {
                        return listHandBags(params).refetch().then(res => res.data);
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
            console.error("Error fetching latest handbag:", error);
            return null;
        }
    }, [queryClient, listHandBags]);

    // Memoized create handler with proper operation tracking
    const handleCreateHandBag = useCallback(async (data: Omit<HandBagCreateDTO, 'id'>): Promise<HandBag> => {
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
            const result = await createHandBagMutation.mutateAsync(data);

            // Show success toast
            toast({
                title: 'Tạo túi xách thành công',
                description: `Túi xách "${data.name}" đã được tạo.`,
                duration: 2000,
            });

            // Get ID from result
            const createdId = result?.id;

            if (!createdId) {
                console.error("API response missing ID:", result);
                throw new Error("Could not create handbag - No ID returned from API");
            }

            // Invalidate cache
            await onHandBagMutationSuccess(createdId);

            // Fetch complete Handbag object
            let createdHandBag: HandBag;

            try {
                const fetchedBag = await fetchLatestHandBag(createdId);
                if (fetchedBag) {
                    createdHandBag = fetchedBag;
                } else {
                    // Fallback
                    createdHandBag = {
                        id: createdId,
                        ...data,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        active: true
                    } as HandBag;
                }
            } catch (fetchError) {
                console.warn("Failed to fetch created handbag, using fallback:", fetchError);
                // Fallback
                createdHandBag = {
                    id: createdId,
                    ...data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    active: true
                } as HandBag;
            }

            return createdHandBag;
        } catch (error) {
            // Handle error

            console.log('Error creating handbag:', error);
            toast({
                title: 'Lỗi tạo túi xách',
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
    }, [createHandBagMutation, onHandBagMutationSuccess, fetchLatestHandBag, incrementOperationCount]);

    // Memoized update handler with proper operation tracking
    const handleUpdateHandBag = useCallback(async (id: string, updateData: Omit<HandBagUpdateDTO, 'id'>): Promise<HandBag> => {
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
            await updateHandBagMutation.mutateAsync({
                id,
                data: updateData
            });

            // Show success toast
            toast({
                title: 'Cập nhật túi xách thành công',
                description: `Túi xách đã được cập nhật.`,
                duration: 2000,
            });

            // Invalidate cache
            await onHandBagMutationSuccess(id);

            // Fetch updated Handbag
            const updatedHandBag = await fetchLatestHandBag(id);

            if (!updatedHandBag) {
                throw new Error('Không thể lấy thông tin túi xách sau khi cập nhật');
            }

            return updatedHandBag;
        } catch (error) {
            // Handle error
            toast({
                title: 'Lỗi cập nhật túi xách',
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
    }, [updateHandBagMutation, onHandBagMutationSuccess, fetchLatestHandBag, incrementOperationCount]);

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
            updateFilter('page' as keyof HandBagCondDTO, targetPage);
            if (targetLimit !== pagination.limit) {
                updateFilter('limit' as keyof HandBagCondDTO, targetLimit);
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
    const batchDeleteHandBagsMutation = useCallback(async (ids: string[]) => {
        if (!incrementOperationCount('batch_delete')) {
            throw new Error("Too many delete operations, try again later");
        }

        setLoading(true);
        try {
            // Direct batch delete API call
            await batchDeleteHandBagsParallel(ids);

            // Invalidate any relevant cache
            await Promise.all(ids.map(id => invalidateItemCache(id)));
            await invalidateListCache(true);

            // Show success toast
            toast({
                title: 'Xóa túi xách thành công',
                description: `Đã xóa ${ids.length} túi xách.`,
                duration: 2000,
            });

            return;
        } catch (error) {
            console.error('Error batch deleting handbags:', error);

            // Show error toast
            toast({
                title: 'Batch delete failed',
                description: error instanceof Error ? error.message : 'Unknown error',
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
    const contextValue = useMemo<HandBagContextType>(() => ({
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
        batchDeleteHandBagsMutation,
    }), [
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
    ]);

    return (
        <HandBagContext.Provider value={contextValue}>
            {children}
        </HandBagContext.Provider>
    );
};

// Custom hook to use context with error checking
export const useHandBagContext = () => {
    const context = useContext(HandBagContext);
    if (context === undefined) {
        throw new Error('useHandBagContext must be used within a HandBagProvider');
    }
    return context;
};

export default HandBagContext;



























// import React, {
//     createContext,
//     useContext,
//     useState,
//     useCallback,
//     useMemo,
//     useRef
// } from "react";
// import { HandBag, HandBagCreateDTO, HandBagUpdateDTO, HandBagCondDTO } from "@/common/interface/handbag";
// import { BaseResponseData, BasePaginationParams } from "@/hooks/base/useBaseQueries";
// import { UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useHandBagMutations } from "./useHandBagMutations";
// import { useHandBagHelpers } from "./useHandBagHelpers";
// import { useHandBagQueries } from "./useHandBagQueries";
// import { toast } from "../use-toast";
// import { batchDeleteHandBagsParallel } from "@/apis/handbag/handbag.api";

// interface HandBagContextType {
//     listHandBags: (
//         params?: HandBagCondDTO & BasePaginationParams,
//         options?: any
//     ) => UseQueryResult<BaseResponseData<HandBag>, Error>;
//     deleteHandBagMutation: ReturnType<typeof useHandBagMutations>['deleteHandBagMutation'];
//     setSelectedHandBag: (handbag: HandBag | null) => void;
//     selectedHandBag: HandBag | null;
//     loading: boolean;
//     activeFilters: HandBagCondDTO & BasePaginationParams;
//     handleCreateHandBag: (data: Omit<HandBagCreateDTO, 'id'>) => Promise<HandBag>;
//     handleUpdateHandBag: (id: string, data: Omit<HandBagUpdateDTO, 'id'>) => Promise<HandBag>;
//     resetError: () => void;
//     updatePagination: (page: number, limit?: number) => void;
// }

// const HandBagContext = createContext<HandBagContextType | undefined>(undefined);

// export const HandBagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     // Sử dụng useQueryClient để có thể thao tác trực tiếp với cache
//     const queryClient = useQueryClient();

//     // Sử dụng stable state initialization
//     const [selectedHandBag, setSelectedHandBag] = useState<HandBag | null>(null);
//     const [loading, setLoading] = useState(false);
//     const isUpdatingPaginationRef = useRef(false);
//     const pendingOperationsRef = useRef(new Set<string>());

//     // Destructure và memoize helpers
//     const {
//         updateFilter,
//         pagination,
//         filterValues: activeFilters,
//         resetFilters
//     } = useHandBagHelpers();

//     const {
//         listItems: listHandBags,
//         getById: getHandBagById,
//         invalidateItemCache,
//         invalidateListCache
//     } = useHandBagQueries();

//     const {
//         createHandBagMutation,
//         updateHandBagMutation,
//         deleteHandBagMutation,
//         onHandBagMutationSuccess
//     } = useHandBagMutations();

//     // Helper function để lấy handbag mới nhất theo ID
//     const fetchLatestHandBag = useCallback(async (identifier: string, isName = false): Promise<HandBag | null> => {
//         try {
//             if (!isName) {
//                 try {
//                     const result = await queryClient.fetchQuery({
//                         queryKey: ['handBag', identifier],
//                         queryFn: () => getHandBagById(identifier).refetch().then(res => res.data),
//                         staleTime: 0
//                     });

//                     if (result) return result;
//                 } catch (error) {
//                     console.log("Couldn't fetch by ID directly, trying search...");
//                 }
//             }


//             let params: HandBagCondDTO & BasePaginationParams = {
//                 page: 1,
//                 limit: 1
//             };

//             if (isName) {
//                 params.search = identifier;
//             }

//             // Refetch để lấy dữ liệu mới nhất
//             const result = await queryClient.fetchQuery({
//                 queryKey: ['handBag-list', params],
//                 queryFn: () => listHandBags(params).refetch().then(res => res.data),
//                 staleTime: 0
//             });

//             if (result?.data?.[0]) {
//                 return result.data[0];
//             }

//             // Nếu không tìm thấy bằng search, thử tìm bằng ID
//             if (isName && !result?.data?.[0]) {
//                 return await queryClient.fetchQuery({
//                     queryKey: ['handBag', identifier],
//                     queryFn: () => getHandBagById(identifier).refetch().then(res => res.data)
//                 });
//             }

//             return null;
//         } catch (error) {
//             console.error("Error fetching latest handbag:", error);
//             return null;
//         }
//     }, [queryClient, listHandBags, getHandBagById]);

//     // Memoized và stable create handler
//     const handleCreateHandBag = useCallback(async (data: Omit<HandBagCreateDTO, 'id'>): Promise<HandBag> => {
//         // Tạo một requestId duy nhất cho thao tác này
//         const requestId = `create-${Date.now()}`;

//         // Kiểm tra xem thao tác đã đang thực hiện hay chưa
//         if (pendingOperationsRef.current.has(requestId)) {
//             throw new Error("Thao tác đang được xử lý");
//         }

//         pendingOperationsRef.current.add(requestId);
//         setLoading(true);

//         try {
//             // Thực hiện mutation
//             const result = await createHandBagMutation.mutateAsync(data);

//             // Show success toast
//             toast({
//                 title: 'Create handbag successful',
//                 description: `Handbag "${data.name}" has been created.`,
//                 duration: 2000,
//             });

//             // Check if response has an id directly or nested in a data property
//             const createdId = result?.id;

//             if (!createdId) {
//                 console.error("API response missing ID:", result);
//                 throw new Error("Could not create handbag - No ID returned from API");
//             }

//             // Invalidate cache to ensure latest data
//             await onHandBagMutationSuccess(createdId);

//             // Fetch the complete Handbag object
//             let createdHandBag: HandBag;

//             try {
//                 const fetchedBag = await fetchLatestHandBag(createdId);
//                 if (fetchedBag) {
//                     createdHandBag = fetchedBag;
//                 } else {
//                     // Fallback if fetch fails
//                     createdHandBag = {
//                         id: createdId,
//                         ...data,
//                         createdAt: new Date().toISOString(),
//                         updatedAt: new Date().toISOString(),
//                         active: true
//                     } as HandBag;
//                 }
//             } catch (fetchError) {
//                 console.warn("Failed to fetch created handbag, using fallback:", fetchError);
//                 // Use fallback object
//                 createdHandBag = {
//                     id: createdId,
//                     ...data,
//                     createdAt: new Date().toISOString(),
//                     updatedAt: new Date().toISOString(),
//                     active: true
//                 } as HandBag;
//             }

//             return createdHandBag;
//         } catch (error) {
//             // Handle error
//             const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
//             toast({
//                 title: 'Lỗi tạo túi xách',
//                 description: errorMessage,
//                 variant: 'destructive',
//                 duration: 3000,
//             });
//             throw error;
//         } finally {
//             pendingOperationsRef.current.delete(requestId);
//             setLoading(false);
//         }
//     }, [createHandBagMutation, onHandBagMutationSuccess, fetchLatestHandBag]);

//     // Memoized và stable update handler
//     const handleUpdateHandBag = useCallback(async (id: string, updateData: Omit<HandBagUpdateDTO, 'id'>): Promise<HandBag> => {
//         // Tạo một requestId duy nhất cho thao tác này
//         const requestId = `update-${id}-${Date.now()}`;

//         // Kiểm tra xem thao tác đã đang thực hiện hay chưa
//         if (pendingOperationsRef.current.has(requestId)) {
//             throw new Error("Thao tác đang được xử lý");
//         }

//         pendingOperationsRef.current.add(requestId);
//         setLoading(true);

//         try {
//             // Thực hiện mutation
//             await updateHandBagMutation.mutateAsync({
//                 id,
//                 data: updateData
//             });

//             // Show success toast
//             toast({
//                 title: 'Cập nhật túi xách thành công',
//                 description: `Túi xách đã được cập nhật.`,
//                 duration: 2000,
//             });

//             // Invalidate cache
//             await onHandBagMutationSuccess(id);

//             // Lấy đối tượng Handbag đã cập nhật
//             const updatedHandBag = await fetchLatestHandBag(id);

//             if (!updatedHandBag) {
//                 throw new Error('Không thể lấy thông tin túi xách sau khi cập nhật');
//             }

//             return updatedHandBag;
//         } catch (error) {
//             // Handle error
//             const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
//             toast({
//                 title: 'Lỗi cập nhật túi xách',
//                 description: errorMessage,
//                 variant: 'destructive',
//                 duration: 3000,
//             });
//             throw error;
//         } finally {
//             pendingOperationsRef.current.delete(requestId);
//             setLoading(false);
//         }
//     }, [updateHandBagMutation, onHandBagMutationSuccess, fetchLatestHandBag]);

//     // Stable pagination update method với safeguards để ngăn loops
//     const updatePagination = useCallback((page: number, limit?: number) => {
//         // Ngăn re-entry và cập nhật không cần thiết
//         if (isUpdatingPaginationRef.current) return;

//         // Kiểm tra xem có thực sự cần thay đổi hay không
//         if (pagination.page === page && (!limit || pagination.limit === limit)) {
//             return; // Không cần thay đổi
//         }

//         // Set flag để ngăn re-entry
//         isUpdatingPaginationRef.current = true;

//         try {
//             // Lưu trữ giá trị dự định trong refs để đảm bảo chúng không thay đổi
//             const targetPage = page;
//             const targetLimit = limit ?? pagination.limit;

//             // Batched updates để giảm thiểu renders
//             updateFilter('page' as keyof HandBagCondDTO, targetPage);
//             if (targetLimit !== pagination.limit) {
//                 updateFilter('limit' as keyof HandBagCondDTO, targetLimit);
//             }

//             // Clear flag sau một delay an toàn
//             requestAnimationFrame(() => {
//                 isUpdatingPaginationRef.current = false;
//             });
//         } catch (error) {
//             // Đảm bảo flag được xóa ngay cả khi có lỗi
//             console.error("Error updating pagination:", error);
//             isUpdatingPaginationRef.current = false;
//         }
//     }, [updateFilter, pagination.page, pagination.limit]);

//     // Stable reset error method
//     const resetError = useCallback(() => {
//         resetFilters();
//     }, [resetFilters]);

//     const batchDeleteHandBagsMutation = useCallback(async (ids: string[]) => {
//         setLoading(true);
//         try {
//             // You have two options:
//             // 1. Use the batch delete endpoint if available
//             await batchDeleteHandBagsParallel(ids);

//         } catch (error) {
//             console.error('Error batch deleting handbags:', error);
//             throw error;
//         } finally {
//             setLoading(false);
//         }
//     }
//         , [queryClient]);

//     // Memoize toàn bộ context value để ngăn re-renders không cần thiết
//     const contextValue = useMemo<HandBagContextType>(() => ({
//         listHandBags,
//         deleteHandBagMutation,
//         batchDeleteHandBagsMutation,
//         setSelectedHandBag,
//         selectedHandBag,
//         loading,
//         activeFilters,
//         handleCreateHandBag,
//         handleUpdateHandBag,
//         resetError,
//         updatePagination,
//     }), [
//         listHandBags,
//         deleteHandBagMutation,
//         setSelectedHandBag,
//         selectedHandBag,
//         loading,
//         activeFilters,
//         handleCreateHandBag,
//         handleUpdateHandBag,
//         resetError,
//         updatePagination,
//         batchDeleteHandBagsMutation
//     ]);

//     return (
//         <HandBagContext.Provider value={contextValue}>
//             {children}
//         </HandBagContext.Provider>
//     );
// };

// // Custom hook to use context với error checking
// export const useHandBagContext = () => {
//     const context = useContext(HandBagContext);
//     if (context === undefined) {
//         throw new Error('useHandBagContext must be used within a HandBagProvider');
//     }
//     return context;
// };

// export default HandBagContext;



























