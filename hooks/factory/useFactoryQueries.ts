
import { useCallback } from 'react';
import { UseQueryResult, useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useBaseQueries, BasePaginationParams, BaseResponseData } from '../base/useBaseQueries';
import { 
  getFactoriesList, 
  getFactoryById,
  getFactoryManagers,
  getAccessibleFactories,
  checkCanManageFactory
} from '@/apis/factory/factory.api';
import { Factory, FactoryCondDTO, FactoryManager, FactoryWithDetails } from '@/common/interface/factory';
import { toast } from '../use-toast';

/**
 * Hook for Factory queries with optimized cache handling
 */
export const useFactoryQueries = () => {
  const queryClient = useQueryClient();
  
  /**
   * Handle query errors with toast notifications
   */
  const handleQueryError = useCallback((error: any, queryName: string) => {
    // Extract message safely
    let errorMessage = 'Lỗi không xác định';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = error.message as string;
    }
    
    // Show toast with safe message
    toast({
      title: `Không thể tải dữ liệu ${queryName}`,
      description: errorMessage || 'Vui lòng thử lại sau',
      variant: 'destructive',
      duration: 3000,
    });
  }, []);

  // Use base hook for Factory queries
  const factoryQueries = useBaseQueries<Factory, FactoryCondDTO>(
    'factory',
    getFactoriesList,
    getFactoryById,
    undefined,
    handleQueryError
  );

  /**
   * Get factory managers with performance optimizations
   */
  const getManagersByFactoryId = (
    factoryId?: string, 
    options?: { 
      enabled?: boolean,
      staleTime?: number,
      refetchOnWindowFocus?: boolean
    }
  ): UseQueryResult<FactoryManager[], Error> => {
    return useQuery<FactoryManager[], Error>({
      queryKey: ['factory', factoryId, 'managers'],
      queryFn: async () => {
        if (!factoryId) throw new Error('Factory ID is required');
        
        try {
          return await getFactoryManagers(factoryId);
        } catch (error) {
          handleQueryError(error, 'quản lý nhà máy');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: !!factoryId && options?.enabled !== false,
      
      // Optimized caching strategy
      staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      
      // Reduce unnecessary fetches
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
      refetchOnReconnect: false,
      refetchOnMount: true,
    });
  };

  /**
   * Get accessible factories with optimizations
   */
  const getAccessibleFactoriesForUser = (
    options?: { 
      enabled?: boolean,
      refetchOnWindowFocus?: boolean,
      staleTime?: number
    }
  ): UseQueryResult<Factory[], Error> => {
    return useQuery<Factory[], Error>({
      queryKey: ['factories', 'accessible'],
      queryFn: async () => {
        try {
          return await getAccessibleFactories();
        } catch (error) {
          handleQueryError(error, 'nhà máy có quyền truy cập');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: options?.enabled !== false,
      staleTime: options?.staleTime || 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    });
  };

  /**
   * Check if user can manage factory with better caching
   */
  const canManageFactory = (
    factoryId?: string,
    options?: { enabled?: boolean, staleTime?: number }
  ): UseQueryResult<boolean, Error> => {
    return useQuery<boolean, Error>({
      queryKey: ['factory', factoryId, 'can-manage'],
      queryFn: async () => {
        if (!factoryId) return false;
        try {
          return await checkCanManageFactory(factoryId);
        } catch (error) {
          handleQueryError(error, 'quyền quản lý nhà máy');
          return false;
        }
      },
      enabled: !!factoryId && options?.enabled !== false,
      staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  };

  /**
   * Get factory with details - high performance implementation
   */
  const getFactoryWithDetails = (
    factoryId?: string,
    options?: { 
      enabled?: boolean, 
      includeManagers?: boolean,
      refetchOnWindowFocus?: boolean,
      staleTime?: number
    }
  ): UseQueryResult<Partial<FactoryWithDetails>, Error> => {
    const includeManagers = options?.includeManagers !== false;
    
    return useQuery<Partial<FactoryWithDetails>, Error>({
      queryKey: ['factory', factoryId, 'details', { includeManagers }],
      queryFn: async () => {
        if (!factoryId) throw new Error('Factory ID is required');
        
        try {
          // Get basic factory data
          const factoryPromise = getFactoryById(factoryId);
          
          // If managers requested, fetch them in parallel
          const managersPromise = includeManagers 
            ? getFactoryManagers(factoryId).catch(error => {
                console.error('Error fetching factory managers:', error);
                return [];
              })
            : Promise.resolve([]);
          
          // Wait for parallel requests to complete
          const [factoryData, managersData] = await Promise.all([
            factoryPromise,
            managersPromise
          ]);
          
          // Combine into a single response
          const factoryWithDetails: Partial<FactoryWithDetails> = {
            ...factoryData,
            managers: includeManagers ? managersData : [],
            lines: [] // Empty placeholder for future implementation
          };
          
          // Cache individual data pieces for reuse
          if (includeManagers) {
            queryClient.setQueryData(['factory', factoryId, 'managers'], managersData);
          }
          
          queryClient.setQueryData(['factory', factoryId], factoryData);
          
          return factoryWithDetails;
        } catch (error) {
          handleQueryError(error, 'chi tiết nhà máy');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: !!factoryId && options?.enabled !== false,
      staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    });
  };

  /**
   * Smart invalidation that minimizes refetches
   */
  const invalidateFactoryDetailsCache = useCallback(
    async (factoryId: string, options?: { 
        forceRefetch?: boolean 
    }) => {
        if (!factoryId) return;

        const refetchType = options?.forceRefetch ? 'active' : 'none';
        
        // Invalidate all factory-related queries for this ID
        await queryClient.invalidateQueries({
          queryKey: ['factory', factoryId, 'details'],
          refetchType
        });
        
        await queryClient.invalidateQueries({
          queryKey: ['factory', factoryId, 'managers'],
          refetchType
        });
        
        await queryClient.invalidateQueries({
          queryKey: ['factory', factoryId],
          refetchType
        });
        
        // Mark factory lists as stale, but don't refetch
        await queryClient.invalidateQueries({
          queryKey: ['factory-list'],
          refetchType: 'none'
        });
    },
    [queryClient]
  );

  /**
   * Smart prefetching with deduplication
   */
  const prefetchFactoryDetails = useCallback(
    async (factoryId: string, options?: { 
        includeManagers?: boolean,
        staleTime?: number
    }) => {
        if (!factoryId) return;
        
        const includeManagers = options?.includeManagers !== false;
        const staleTime = options?.staleTime || 5 * 60 * 1000;
        
        try {
            // Cache key for details query
            const detailsQueryKey: QueryKey = ['factory', factoryId, 'details', { includeManagers }];
            
            // Check if we already have fresh data
            const cachedDetailsState = queryClient.getQueryState(detailsQueryKey);
            if (cachedDetailsState?.data && 
                cachedDetailsState.dataUpdatedAt > Date.now() - staleTime) {
              // Data is fresh, no need to prefetch
              return;
            }
            
            // Prefetch factory details
            await queryClient.prefetchQuery({
                queryKey: detailsQueryKey,
                queryFn: async () => {
                    // Fetch in parallel for better performance
                    const [factoryData, managersData] = await Promise.all([
                        getFactoryById(factoryId),
                        includeManagers 
                          ? getFactoryManagers(factoryId).catch(() => []) 
                          : Promise.resolve([])
                    ]);
                    
                    const result: Partial<FactoryWithDetails> = {
                        ...factoryData,
                        managers: managersData,
                        lines: []
                    };
                    
                    // Update individual caches for component queries
                    queryClient.setQueryData(['factory', factoryId], factoryData);
                    
                    if (includeManagers) {
                      queryClient.setQueryData(['factory', factoryId, 'managers'], managersData);
                    }
                    
                    return result;
                },
                staleTime
            });
        } catch (error) {
            console.error("Error prefetching factory details:", error);
        }
    },
    [queryClient]
  );

  /**
   * Invalidate managers cache optimized
   */
  const invalidateManagersCache = useCallback(
    async (factoryId: string, forceRefetch = false) => {
      if (!factoryId) return;
      
      const refetchType = forceRefetch ? 'active' : 'none';
      
      // Only invalidate the specific managers cache
      await queryClient.invalidateQueries({
        queryKey: ['factory', factoryId, 'managers'],
        refetchType
      });
      
      // Also invalidate related details cache but don't force refetch
      await queryClient.invalidateQueries({
        queryKey: ['factory', factoryId, 'details'],
        refetchType: 'none'
      });
    },
    [queryClient]
  );

  /**
   * Prefetch factory managers for smoother UX
   */
  const prefetchFactoryManagers = useCallback(
    async (factoryId: string) => {
      if (!factoryId) return;

      // Check if already in cache
      const cachedManagers = queryClient.getQueryData(['factory', factoryId, 'managers']);
      if (cachedManagers) return;

      // Prefetch managers
      await queryClient.prefetchQuery({
        queryKey: ['factory', factoryId, 'managers'],
        queryFn: () => getFactoryManagers(factoryId),
        staleTime: 5 * 60 * 1000
      });
    },
    [queryClient]
  );
  
  /**
   * Prefetch factory list with specific parameters
   */
  const prefetchFactoryList = useCallback(
    async (params?: FactoryCondDTO & BasePaginationParams) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['factory-list', params],
          queryFn: () => getFactoriesList(params || { page: 1, limit: 10 }),
          staleTime: 5 * 60 * 1000
        });
      } catch (error) {
        console.error("Error prefetching factory list:", error);
      }
    },
    [queryClient]
  );
  
  /**
   * Update factory data in cache
   */
  const updateFactoryCache = useCallback(
    (factoryId: string, updatedData: Partial<Factory>) => {
      // Don't update if no ID
      if (!factoryId) return;
      
      // Update basic factory data
      queryClient.setQueryData(['factory', factoryId], (oldData: Factory | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, ...updatedData, updatedAt: new Date().toISOString() };
      });
      
      // Update factory in lists
      queryClient.setQueriesData({ queryKey: ['factory-list'] }, (oldData: BaseResponseData<Factory> | undefined) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((factory: Factory) => 
            factory.id === factoryId ? 
              { ...factory, ...updatedData, updatedAt: new Date().toISOString() } : 
              factory
          )
        };
      });
      
      // Update factory in details view
      queryClient.setQueryData(['factory', factoryId, 'details'], (oldData: Partial<FactoryWithDetails> | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, ...updatedData, updatedAt: new Date().toISOString() };
      });
    },
    [queryClient]
  );
  
  /**
   * Batch prefetch multiple factories
   */
  const batchPrefetchFactories = useCallback(
    async (factoryIds: string[], includeManagers = false) => {
      if (!factoryIds || factoryIds.length === 0) return;
      
      // Limit concurrency to avoid overwhelming the server
      const batchSize = 3;
      
      for (let i = 0; i < factoryIds.length; i += batchSize) {
        const batch = factoryIds.slice(i, i + batchSize);
        
        // Create a batch of promises but limit concurrency
        await Promise.all(
          batch.map(id => prefetchFactoryDetails(id, { includeManagers }))
        );
        
        // Small delay between batches to be nice to the server
        if (i + batchSize < factoryIds.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    },
    [prefetchFactoryDetails]
  );

  return {
    // Base factory queries
    ...factoryQueries,
    listFactories: factoryQueries.listItems,
    getFactoryById: factoryQueries.getById,
    
    // Additional specialized queries
    getManagersByFactoryId,
    getAccessibleFactoriesForUser,
    canManageFactory,
    getFactoryWithDetails,
    
    // Cache management
    invalidateFactoryDetailsCache,
    prefetchFactoryDetails,
    invalidateManagersCache,
    prefetchFactoryManagers,
    prefetchFactoryList,
    updateFactoryCache,
    batchPrefetchFactories
  };
};





















// import { useCallback } from 'react';
// import { UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query';
// import { useBaseQueries, BasePaginationParams, BaseResponseData } from '../base/useBaseQueries';
// import { 
//   getFactoriesList, 
//   getFactoryById,
//   getFactoryManagers,
//   getAccessibleFactories,
//   checkCanManageFactory
// } from '@/apis/factory/factory.api';
// import { Factory, FactoryCondDTO, FactoryManager, FactoryWithDetails } from '@/common/interface/factory';
// import { toast } from '../use-toast';

// /**
//  * Hook cho Factory queries
//  */
// export const useFactoryQueries = () => {
//   const queryClient = useQueryClient();
  
//   /**
//    * Handle query errors with toast notifications
//    */
//   const handleQueryError = useCallback((error: any, queryName: string) => {
//     // Extract message safely
//     let errorMessage = 'Lỗi không xác định';
//     if (error instanceof Error) {
//       errorMessage = error.message;
//     } else if (typeof error === 'object' && error !== null && 'message' in error) {
//       errorMessage = error.message as string;
//     }
    
//     // Show toast with safe message
//     toast({
//       title: `Không thể tải dữ liệu ${queryName}`,
//       description: errorMessage || 'Vui lòng thử lại sau',
//       variant: 'destructive',
//       duration: 3000,
//     });
//   }, []);

//   // Sử dụng hook cơ sở cho Factory queries
//   const factoryQueries = useBaseQueries<Factory, FactoryCondDTO>(
//     'factory',
//     getFactoriesList,
//     getFactoryById,
//     undefined,
//     handleQueryError
//   );

//   /**
//    * Get factory managers
//    */
//   const getManagersByFactoryId = (
//     factoryId?: string,
//     options?: { enabled?: boolean }
//   ): UseQueryResult<FactoryManager[], Error> => {
//     return useQuery<FactoryManager[], Error>({
//       queryKey: ['factory', factoryId, 'managers'],
//       queryFn: async () => {
//         if (!factoryId) throw new Error('Factory ID is required');
//         try {
//           const response = await getFactoryManagers(factoryId);
//           return response;
//         } catch (error) {
//           handleQueryError(error, 'quản lý nhà máy');
//           throw error instanceof Error ? error : new Error('Unknown error');
//         }
//       },
//       enabled: !!factoryId && options?.enabled !== false,
//       staleTime: 5 * 60 * 1000, // 5 minutes
//       gcTime: 30 * 60 * 1000, // 30 minutes
//     });
//   };

//   /**
//    * Get accessible factories for current user
//    */
//   const getAccessibleFactoriesForUser = (
//     options?: { enabled?: boolean }
//   ): UseQueryResult<Factory[], Error> => {
//     return useQuery<Factory[], Error>({
//       queryKey: ['factories', 'accessible'],
//       queryFn: async () => {
//         try {
//           const response = await getAccessibleFactories();
//           return response;
//         } catch (error) {
//           handleQueryError(error, 'nhà máy có quyền truy cập');
//           throw error instanceof Error ? error : new Error('Unknown error');
//         }
//       },
//       enabled: options?.enabled !== false,
//       staleTime: 10 * 60 * 1000, // 10 minutes
//       gcTime: 30 * 60 * 1000, // 30 minutes
//     });
//   };

//   /**
//    * Check if user can manage factory
//    */
//   const canManageFactory = (
//     factoryId?: string,
//     options?: { enabled?: boolean }
//   ): UseQueryResult<boolean, Error> => {
//     return useQuery<boolean, Error>({
//       queryKey: ['factory', factoryId, 'can-manage'],
//       queryFn: async () => {
//         if (!factoryId) return false;
//         try {
//           return await checkCanManageFactory(factoryId);
//         } catch (error) {
//           handleQueryError(error, 'quyền quản lý nhà máy');
//           return false;
//         }
//       },
//       enabled: !!factoryId && options?.enabled !== false,
//       staleTime: 5 * 60 * 1000, // 5 minutes
//       gcTime: 15 * 60 * 1000, // 15 minutes
//     });
//   };

//   /**
//    * Get factory with details
//    */
//   const getFactoryWithDetails = (
//     factoryId?: string,
//     options?: { enabled?: boolean, includeManagers?: boolean }
//   ): UseQueryResult<Partial<FactoryWithDetails>, Error> => {
//     const includeManagers = options?.includeManagers !== false;
    
//     return useQuery<Partial<FactoryWithDetails>, Error>({
//       queryKey: ['factory', factoryId, 'details', { includeManagers }],
//       queryFn: async () => {
//         if (!factoryId) throw new Error('Factory ID is required');
//         try {
//           // Get basic factory data
//           const factoryResponse = await getFactoryById(factoryId);
          
//           // Start with basic factory data
//           const factoryWithDetails: Partial<FactoryWithDetails> = {
//             ...factoryResponse,
//             managers: [],
//             lines: []
//           };
          
//           // If managers data is requested, fetch it
//           if (includeManagers) {
//             try {
//               const managersResponse = await getFactoryManagers(factoryId);
//               factoryWithDetails.managers = managersResponse;
//             } catch (managersError) {
//               console.error('Error fetching factory managers:', managersError);
//               factoryWithDetails.managers = [];
//             }
//           }
          
//           return factoryWithDetails;
//         } catch (error) {
//           handleQueryError(error, 'chi tiết nhà máy');
//           throw error instanceof Error ? error : new Error('Unknown error');
//         }
//       },
//       enabled: !!factoryId && options?.enabled !== false,
//       staleTime: 5 * 60 * 1000, // 5 minutes
//       gcTime: 30 * 60 * 1000, // 30 minutes
//     });
//   };

//   /**
//    * Invalidate factory details cache
//    */
//   const invalidateFactoryDetailsCache = useCallback(
//     async (factoryId: string, forceRefetch = false) => {
//       if (!factoryId) return;

//       try {
//         await queryClient.invalidateQueries({
//           queryKey: ['factory', factoryId, 'details'],
//           refetchType: forceRefetch ? 'active' : 'none',
//         });
        
//         // Also invalidate managers
//         await queryClient.invalidateQueries({
//           queryKey: ['factory', factoryId, 'managers'],
//           refetchType: forceRefetch ? 'active' : 'none',
//         });
//       } catch (error) {
//         console.error(`Failed to invalidate factory details cache for ID ${factoryId}:`, error);
//       }
//     },
//     [queryClient]
//   );

//   /**
//    * Prefetch factory details for better UX
//    */
//   const prefetchFactoryDetails = useCallback(
//     async (factoryId: string, options?: { includeManagers?: boolean }) => {
//       if (!factoryId) return;
      
//       const includeManagers = options?.includeManagers !== false;

//       try {
//         await queryClient.prefetchQuery({
//           queryKey: ['factory', factoryId, 'details', { includeManagers }],
//           queryFn: async () => {
//             const factoryResponse = await getFactoryById(factoryId);
            
//             const factoryWithDetails: Partial<FactoryWithDetails> = {
//               ...factoryResponse,
//               managers: [],
//               lines: []
//             };
            
//             if (includeManagers) {
//               try {
//                 const managersResponse = await getFactoryManagers(factoryId);
//                 factoryWithDetails.managers = managersResponse;
//               } catch (managersError) {
//                 console.error('Error prefetching factory managers:', managersError);
//               }
//             }
            
//             return factoryWithDetails;
//           },
//           staleTime: 5 * 60 * 1000, // 5 minutes
//         });
//       } catch (error) {
//         console.error(`Failed to prefetch factory details for ID ${factoryId}:`, error);
//       }
//     },
//     [queryClient]
//   );

//   return {
//     // Base factory queries
//     ...factoryQueries,
//     listFactories: factoryQueries.listItems,
    
//     // Additional specialized queries
//     getManagersByFactoryId,
//     getAccessibleFactoriesForUser,
//     canManageFactory,
//     getFactoryWithDetails,
    
//     // Cache management
//     invalidateFactoryDetailsCache,
//     prefetchFactoryDetails
//   };
// };