import { useCallback } from 'react';
import { UseQueryResult, useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useBaseQueries, BasePaginationParams, BaseResponseData } from '../base/useBaseQueries';
import { 
  getLinesList,
  getLineById,
  getLineManagers,
  getLinesByFactory,
  getAccessibleLines,
  checkCanManageLine
} from '@/apis/line/line.api';
import { Line, LineCondDTO, LineManager, LineWithDetails } from '@/common/interface/line';
import { toast } from '../use-toast';

/**
 * Hook for Line queries with optimized cache handling
 */
export const useLineQueries = () => {
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

  // Use base hook for Line queries
  const lineQueries = useBaseQueries<Line, LineCondDTO>(
    'line',
    getLinesList,
    getLineById,
    undefined,
    handleQueryError
  );

  /**
   * Get line managers with performance optimizations
   */
  const getManagersByLineId = (
    lineId?: string, 
    options?: { 
      enabled?: boolean,
      staleTime?: number,
      refetchOnWindowFocus?: boolean
    }
  ): UseQueryResult<LineManager[], Error> => {
    return useQuery<LineManager[], Error>({
      queryKey: ['line', lineId, 'managers'],
      queryFn: async () => {
        if (!lineId) throw new Error('Line ID is required');
        
        try {
          const managers = await getLineManagers(lineId);
          
          // Transform string dates to Date objects
          return managers.map(manager => ({
            ...manager,
            startDate: new Date(manager.startDate),
            endDate: manager.endDate ? new Date(manager.endDate) : null
          }));
        } catch (error) {
          handleQueryError(error, 'quản lý dây chuyền');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: !!lineId && options?.enabled !== false,
      staleTime: options?.staleTime || 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
      refetchOnReconnect: false,
      refetchOnMount: true,
    });
  };

  /**
   * Get lines by factory ID with optimized caching
   */
  const getLinesByFactoryId = (
  factoryId?: string, 
  options?: { 
    enabled?: boolean,
    staleTime?: number,
    refetchOnWindowFocus?: boolean,
    retry?: number | boolean,
    suspense?: boolean,
    placeholderData?: Line[] | (() => Line[])
  }
): UseQueryResult<Line[], Error> => {
  return useQuery<Line[], Error>({
    queryKey: ['factory', factoryId, 'lines'],
    queryFn: async ({ signal }) => {
      if (!factoryId) throw new Error('Factory ID is required');
      
      try {
        return await getLinesByFactory(factoryId);
      } catch (error) {
        if (error && error?.response?.status === 404) {
          throw new Error(`Không tìm thấy nhà máy với ID: ${factoryId}`);
        }
        handleQueryError(error, 'dây chuyền của nhà máy');
        throw error instanceof Error ? error : new Error('Unknown error');
      }
    },
    enabled: !!factoryId && options?.enabled !== false,
    
    // Optimized caching strategy
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    
    // Performance optimizations
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    
    // Better error handling with retry logic
    retry: options?.retry ?? 1,
    
    // Enable placeholder data for faster UI rendering
    placeholderData: options?.placeholderData,
    
    // Enable structural sharing to minimize re-renders
    structuralSharing: true,
    
    // Better network handling
    networkMode: 'always',
  });
};

  /**
   * Get accessible lines with optimizations
   */
  const getAccessibleLinesForUser = (
    options?: { 
      enabled?: boolean,
      refetchOnWindowFocus?: boolean,
      staleTime?: number
    }
  ): UseQueryResult<Line[], Error> => {
    return useQuery<Line[], Error>({
      queryKey: ['lines', 'accessible'],
      queryFn: async () => {
        try {
          return await getAccessibleLines();
        } catch (error) {
          handleQueryError(error, 'dây chuyền có quyền truy cập');
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
   * Check if user can manage line with better caching
   */
  const canManageLine = (
    lineId?: string,
    options?: { enabled?: boolean, staleTime?: number }
  ): UseQueryResult<boolean, Error> => {
    return useQuery<boolean, Error>({
      queryKey: ['line', lineId, 'can-manage'],
      queryFn: async () => {
        if (!lineId) return false;
        try {
          return await checkCanManageLine(lineId);
        } catch (error) {
          handleQueryError(error, 'quyền quản lý dây chuyền');
          return false;
        }
      },
      enabled: !!lineId && options?.enabled !== false,
      staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  };

  /**
   * Get line with details - high performance implementation
   */
  const getLineWithDetails = (
    lineId?: string,
    options?: { 
      enabled?: boolean, 
      includeManagers?: boolean,
      refetchOnWindowFocus?: boolean,
      staleTime?: number
    }
  ): UseQueryResult<Partial<LineWithDetails>, Error> => {
    const includeManagers = options?.includeManagers !== false;
    
    return useQuery<Partial<LineWithDetails>, Error>({
      queryKey: ['line', lineId, 'details', { includeManagers }],
      queryFn: async () => {
        if (!lineId) throw new Error('Line ID is required');
        
        try {
          // Get basic line data
          const linePromise = getLineById(lineId);
          
          // If managers requested, fetch them in parallel
         // Inside the getLineWithDetails function queryFn
const managersPromise = includeManagers 
? getLineManagers(lineId)
    .then(managers => managers.map(manager => ({
      ...manager,
      startDate: new Date(manager.startDate),
      endDate: manager.endDate ? new Date(manager.endDate) : null
    })))
    .catch(error => {
      console.error('Error fetching line managers:', error);
      return [];
    })
: Promise.resolve([]);
          
          // Wait for parallel requests to complete
          const [lineData, managersData] = await Promise.all([
            linePromise,
            managersPromise
          ]);
          
          // Combine into a single response
          const lineWithDetails: Partial<LineWithDetails> = {
            ...lineData,
            managers: includeManagers ? managersData : [],
            teams: [] // Empty placeholder for future implementation
          };
          
          // Cache individual data pieces for reuse
          if (includeManagers) {
            queryClient.setQueryData(['line', lineId, 'managers'], managersData);
          }
          
          queryClient.setQueryData(['line', lineId], lineData);
          
          return lineWithDetails;
        } catch (error) {
          handleQueryError(error, 'chi tiết dây chuyền');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: !!lineId && options?.enabled !== false,
      staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    });
  };

  /**
   * Smart invalidation that minimizes refetches
   */
  const invalidateLineDetailsCache = useCallback(
    async (lineId: string, options?: { 
        forceRefetch?: boolean 
    }) => {
        if (!lineId) return;

        const refetchType = options?.forceRefetch ? 'active' : 'none';
        
        // Invalidate all line-related queries for this ID
        await queryClient.invalidateQueries({
          queryKey: ['line', lineId, 'details'],
          refetchType
        });
        
        await queryClient.invalidateQueries({
          queryKey: ['line', lineId, 'managers'],
          refetchType
        });
        
        await queryClient.invalidateQueries({
          queryKey: ['line', lineId],
          refetchType
        });
        
        // Get line data to find factory ID
        const lineData = queryClient.getQueryData<Line>(['line', lineId]);
        
        if (lineData && lineData.factoryId) {
            // Invalidate factory lines cache without forcing refetch
            await queryClient.invalidateQueries({
              queryKey: ['factory', lineData.factoryId, 'lines'],
              refetchType: 'none'
            });
          }
        
        // Mark line lists as stale, but don't refetch
        await queryClient.invalidateQueries({
          queryKey: ['line-list'],
          refetchType: 'none'
        });
    },
    [queryClient]
  );

  /**
   * Smart prefetching with deduplication
   */
  const prefetchLineDetails = useCallback(
    async (lineId: string, options?: { 
        includeManagers?: boolean,
        staleTime?: number
    }) => {
        if (!lineId) return;
        
        const includeManagers = options?.includeManagers !== false;
        const staleTime = options?.staleTime || 5 * 60 * 1000;
        
        try {
            // Cache key for details query
            const detailsQueryKey: QueryKey = ['line', lineId, 'details', { includeManagers }];
            
            // Check if we already have fresh data
            const cachedDetailsState = queryClient.getQueryState(detailsQueryKey);
            if (cachedDetailsState && cachedDetailsState.data && 
                cachedDetailsState.dataUpdatedAt > Date.now() - staleTime) {
              // Data is fresh, no need to prefetch
              return;
            }
            
            // Prefetch line details
            await queryClient.prefetchQuery({
                queryKey: detailsQueryKey,
                queryFn: async () => {
                    // Fetch in parallel for better performance
                    // Inside the prefetchLineDetails function queryFn
const [lineData, managersData] = await Promise.all([
  getLineById(lineId),
  includeManagers 
    ? getLineManagers(lineId)
        .then(managers => managers.map(manager => ({
          ...manager,
          startDate: new Date(manager.startDate),
          endDate: manager.endDate ? new Date(manager.endDate) : null
        })))
        .catch(() => []) 
    : Promise.resolve([])
]);
                    
                    const result: Partial<LineWithDetails> = {
                        ...lineData,
                        managers: managersData,
                        teams: []
                    };
                    
                    // Update individual caches for component queries
                    queryClient.setQueryData(['line', lineId], lineData);
                    
                    if (includeManagers) {
                      queryClient.setQueryData(['line', lineId, 'managers'], managersData);
                    }
                    
                    return result;
                },
                staleTime
            });
        } catch (error) {
            console.error("Error prefetching line details:", error);
        }
    },
    [queryClient]
  );

  /**
   * Invalidate managers cache optimized
   */
  const invalidateManagersCache = useCallback(
    async (lineId: string, forceRefetch = false) => {
      if (!lineId) return;
      
      const refetchType = forceRefetch ? 'active' : 'none';
      
      // Only invalidate the specific managers cache
      await queryClient.invalidateQueries({
        queryKey: ['line', lineId, 'managers'],
        refetchType
      });
      
      // Also invalidate related details cache but don't force refetch
      await queryClient.invalidateQueries({
        queryKey: ['line', lineId, 'details'],
        refetchType: 'none'
      });
    },
    [queryClient]
  );

  /**
   * Prefetch line managers for smoother UX
   */
  const prefetchLineManagers = useCallback(
    async (lineId: string) => {
      if (!lineId) return;

      // Check if already in cache
      const cachedManagers = queryClient.getQueryData(['line', lineId, 'managers']);
      if (cachedManagers) return;

      // Prefetch managers
      await queryClient.prefetchQuery({
        queryKey: ['line', lineId, 'managers'],
        queryFn: () => getLineManagers(lineId),
        staleTime: 5 * 60 * 1000
      });
    },
    [queryClient]
  );
  
  /**
   * Prefetch line list with specific parameters
   */
  const prefetchLineList = useCallback(
    async (params?: LineCondDTO & BasePaginationParams) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['line-list', params],
          queryFn: () => getLinesList(params || { page: 1, limit: 10 }),
          staleTime: 5 * 60 * 1000
        });
      } catch (error) {
        console.error("Error prefetching line list:", error);
      }
    },
    [queryClient]
  );
  
  /**
   * Update line data in cache
   */
  const updateLineCache = useCallback(
    (lineId: string, updatedData: Partial<Line>) => {
      // Don't update if no ID
      if (!lineId) return;
      
      // Update basic line data
      queryClient.setQueryData(['line', lineId], (oldData: Line | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, ...updatedData, updatedAt: new Date().toISOString() };
      });
      
      // Get factory ID from existing data or updated data
      const existingData = queryClient.getQueryData<Line>(['line', lineId]);
      const factoryId = updatedData.factoryId || existingData?.factoryId;
      
      if (factoryId) {
        // Update line in factory lines list
        queryClient.setQueriesData<Line[]>({ queryKey: ['factory', factoryId, 'lines'] }, (oldData) => {
            if (!oldData) return oldData;
            
            return oldData.map((line: Line) => 
              line.id === lineId ? 
                { ...line, ...updatedData, updatedAt: new Date().toISOString() } : 
                line
            );
          });
      }
      
      // Update line in lists
      queryClient.setQueriesData({ queryKey: ['line-list'] }, (oldData: BaseResponseData<Line> | undefined) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((line: Line) => 
            line.id === lineId ? 
              { ...line, ...updatedData, updatedAt: new Date().toISOString() } : 
              line
          )
        };
      });
      
      // Update line in details view
      queryClient.setQueryData(['line', lineId, 'details'], (oldData: Partial<LineWithDetails> | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, ...updatedData, updatedAt: new Date().toISOString() };
      });
    },
    [queryClient]
  );
  
  /**
   * Batch prefetch multiple lines
   */
  const batchPrefetchLines = useCallback(
    async (lineIds: string[], includeManagers = false) => {
      if (!lineIds || lineIds.length === 0) return;
      
      // Limit concurrency to avoid overwhelming the server
      const batchSize = 3;
      
      for (let i = 0; i < lineIds.length; i += batchSize) {
        const batch = lineIds.slice(i, i + batchSize);
        
        // Create a batch of promises but limit concurrency
        await Promise.all(
          batch.map(id => prefetchLineDetails(id, { includeManagers }))
        );
        
        // Small delay between batches to be nice to the server
        if (i + batchSize < lineIds.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    },
    [prefetchLineDetails]
  );

  // Add this to your useLineQueries hook
const prefetchLinesByFactory = useCallback(
  async (factoryId: string, options?: { staleTime?: number }) => {
    if (!factoryId) return;
    
    // Check if we already have fresh data
    const queryKey = ['factory', factoryId, 'lines'];
    const cachedState = queryClient.getQueryState(queryKey);
    const staleTime = options?.staleTime || 5 * 60 * 1000;
    
    if (cachedState?.data && 
        cachedState.dataUpdatedAt > Date.now() - staleTime) {
      // Data is fresh, no need to prefetch
      return;
    }
    
    // Prefetch lines for this factory
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => getLinesByFactory(factoryId),
      staleTime
    });
  },
  [queryClient]
);


  return {
    // Base line queries
    ...lineQueries,
    listLines: lineQueries.listItems,
    
    // Additional specialized queries
    getManagersByLineId,
    getLinesByFactoryId,
    getAccessibleLinesForUser,
    canManageLine,
    getLineWithDetails,
    
    // Cache management
    invalidateLineDetailsCache,
    prefetchLineDetails,
    invalidateManagersCache,
    prefetchLineManagers,
    prefetchLineList,
    updateLineCache,
    batchPrefetchLines,
    prefetchLinesByFactory,
  };
};