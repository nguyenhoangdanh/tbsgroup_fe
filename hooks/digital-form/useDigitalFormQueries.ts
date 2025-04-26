// hooks/useDigitalFormQueries.ts
import {
    UseQueryResult,
    UseInfiniteQueryResult,
    InfiniteData,
    useQuery,
    useInfiniteQuery,
    useQueryClient,
  } from '@tanstack/react-query';
  import { useMemo, useCallback } from 'react';
  import { 
    DigitalForm, 
    DigitalFormEntry,
    FactoryProductionReport,
    LineProductionReport,
    TeamProductionReport,
    GroupProductionReport,
    ProductionComparisonReport
  } from '@/common/types/digital-form';
  import {
    TDigitalFormCond,
    TPaginationParams,
  } from '@/schemas/digital-form.schema';
  import { ApiResponse, ListApiResponse, DigitalFormService } from '@/services/digitalFormService';
  
  // Cache configurations
  export const GC_TIME = 60 * 60 * 1000; // 60 minutes
  export const STALE_TIME = 10 * 60 * 1000; // 10 minutes
  export const LIST_STALE_TIME = 60 * 1000; // 1 minute
  
  // Retry configuration
  export const DEFAULT_RETRY_OPTIONS = {
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * Math.pow(1.5, attemptIndex), 30000),
  };
  
  /**
   * Create stable query key to avoid unnecessary re-renders and refetches
   */
  export const createStableQueryKey = (params: any) => {
    const sortedParams: Record<string, any> = {};
  
    Object.keys(params)
      .sort()
      .forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          sortedParams[key] = params[key];
        }
      });
  
    return sortedParams;
  };
  
  /**
   * Hook for digital form related queries
   */
  export const useDigitalFormQueries = (
    errorHandler?: (error: any, queryName: string) => void
  ) => {
    const queryClient = useQueryClient();
  
    /**
     * Get form by ID
     */
    const getFormById = (
      id?: string,
      options?: { enabled?: boolean }
    ): UseQueryResult<DigitalForm, Error> =>
      useQuery<DigitalForm, Error>({
        queryKey: ['digital-form', id],
        queryFn: async () => {
          if (!id) throw new Error('ID is required');
          try {
            const response = await DigitalFormService.getForm(id);
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch digital form');
            }
            return response.data;
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (errorHandler) errorHandler(err, 'digital form');
            throw err;
          }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: !!id && options?.enabled !== false,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      });
  
    /**
     * Get digital form with entries
     */
    const getFormWithEntries = (
      id?: string,
      options?: { enabled?: boolean }
    ): UseQueryResult<{ form: DigitalForm; entries: DigitalFormEntry[] }, Error> =>
      useQuery<{ form: DigitalForm; entries: DigitalFormEntry[] }, Error>({
        queryKey: ['digital-form-with-entries', id],
        queryFn: async () => {
          if (!id) throw new Error('ID is required');
          try {
            const response = await DigitalFormService.getFormWithEntries(id);
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch digital form with entries');
            }
            return response.data;
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (errorHandler) errorHandler(err, 'digital form with entries');
            throw err;
          }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: !!id && options?.enabled !== false,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      });
  
    /**
     * Get print version of a form
     */
    const getPrintVersion = (
      id?: string,
      options?: { enabled?: boolean }
    ): UseQueryResult<{ form: DigitalForm; entries: DigitalFormEntry[] }, Error> =>
      useQuery<{ form: DigitalForm; entries: DigitalFormEntry[] }, Error>({
        queryKey: ['digital-form-print', id],
        queryFn: async () => {
          if (!id) throw new Error('ID is required');
          try {
            const response = await DigitalFormService.getPrintVersion(id);
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch print version');
            }
            return response.data;
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (errorHandler) errorHandler(err, 'print version');
            throw err;
          }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: !!id && options?.enabled !== false,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      });
  
    /**
     * List forms with filtering and pagination
     */
    const listForms = (
      params: TDigitalFormCond & TPaginationParams,
      options?: any
    ): UseQueryResult<ListApiResponse<DigitalForm>, Error> => {
      // Create stable query key to avoid unnecessary refetches
      const stableParams = useMemo(() => createStableQueryKey(params), [params]);
  
      return useQuery<ListApiResponse<DigitalForm>, Error>({
        queryKey: ['digital-forms-list', stableParams],
        queryFn: async () => {
          try {
            const response = await DigitalFormService.listForms(params);
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch digital forms list');
            }
            return response;
          } catch (error) {
            if (errorHandler) errorHandler(error, 'digital forms list');
            throw error;
          }
        },
        staleTime: LIST_STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...DEFAULT_RETRY_OPTIONS,
        ...options,
      });
    };
  
    /**
     * Get forms with infinite scrolling
     */
    const getFormsInfinite = (
      limit = 20,
      filters: Omit<TDigitalFormCond & TPaginationParams, 'page' | 'limit'>,
    ): UseInfiniteQueryResult<InfiniteData<ListApiResponse<DigitalForm>>, Error> => {
      // Create stable query key
      const stableFilters = useMemo(() => createStableQueryKey(filters), [filters]);
  
      return useInfiniteQuery<ListApiResponse<DigitalForm>, Error>({
        queryKey: ['digital-forms-infinite', limit, stableFilters],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
          try {
            const response = await DigitalFormService.listForms({
              ...filters,
              page: pageParam as number,
              limit,
            });
            
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch digital forms');
            }
            
            return response;
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (errorHandler) errorHandler(err, 'digital forms (infinite scroll)');
            throw err;
          }
        },
        getNextPageParam: lastPage => {
          if (lastPage.page < Math.ceil(lastPage.total / lastPage.limit)) {
            return lastPage.page + 1;
          }
          return undefined;
        },
        staleTime: LIST_STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      });
    };
  
    /**
     * Get factory production report
     */
    const getFactoryReport = (
      factoryId?: string,
      dateFrom?: string,
      dateTo?: string,
      options?: {
        includeLines?: boolean;
        includeTeams?: boolean;
        includeGroups?: boolean;
        groupByBag?: boolean;
        groupByProcess?: boolean;
        enabled?: boolean;
      }
    ): UseQueryResult<FactoryProductionReport, Error> => {
      const reportOptions = {
        includeLines: options?.includeLines,
        includeTeams: options?.includeTeams,
        includeGroups: options?.includeGroups,
        groupByBag: options?.groupByBag,
        groupByProcess: options?.groupByProcess,
      };
      
      const stableOptions = useMemo(() => createStableQueryKey(reportOptions), [reportOptions]);
  
      return useQuery<FactoryProductionReport, Error>({
        queryKey: ['factory-report', factoryId, dateFrom, dateTo, stableOptions],
        queryFn: async () => {
          if (!factoryId || !dateFrom || !dateTo) {
            throw new Error('Factory ID, dateFrom, and dateTo are required');
          }
          
          try {
            const response = await DigitalFormService.getFactoryReport(
              factoryId,
              dateFrom,
              dateTo,
              stableOptions
            );
            
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch factory report');
            }
            
            return response.data;
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (errorHandler) errorHandler(err, 'factory report');
            throw err;
          }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: !!factoryId && !!dateFrom && !!dateTo && options?.enabled !== false,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      });
    };
  
    /**
     * Get line production report
     */
    const getLineReport = (
      lineId?: string,
      dateFrom?: string,
      dateTo?: string,
      options?: {
        includeTeams?: boolean;
        includeGroups?: boolean;
        groupByBag?: boolean;
        groupByProcess?: boolean;
        enabled?: boolean;
      }
    ): UseQueryResult<LineProductionReport, Error> => {
      const reportOptions = {
        includeTeams: options?.includeTeams,
        includeGroups: options?.includeGroups,
        groupByBag: options?.groupByBag,
        groupByProcess: options?.groupByProcess,
      };
      
      const stableOptions = useMemo(() => createStableQueryKey(reportOptions), [reportOptions]);
  
      return useQuery<LineProductionReport, Error>({
        queryKey: ['line-report', lineId, dateFrom, dateTo, stableOptions],
        queryFn: async () => {
          if (!lineId || !dateFrom || !dateTo) {
            throw new Error('Line ID, dateFrom, and dateTo are required');
          }
          
          try {
            const response = await DigitalFormService.getLineReport(
              lineId,
              dateFrom,
              dateTo,
              stableOptions
            );
            
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch line report');
            }
            
            return response.data;
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (errorHandler) errorHandler(err, 'line report');
            throw err;
          }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: !!lineId && !!dateFrom && !!dateTo && options?.enabled !== false,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      });
    };
  
    /**
     * Get team production report
     */
    const getTeamReport = (
      teamId?: string,
      dateFrom?: string,
      dateTo?: string,
      options?: {
        includeGroups?: boolean;
        includeWorkers?: boolean;
        groupByBag?: boolean;
        groupByProcess?: boolean;
        enabled?: boolean;
      }
    ): UseQueryResult<TeamProductionReport, Error> => {
      const reportOptions = {
        includeGroups: options?.includeGroups,
        includeWorkers: options?.includeWorkers,
        groupByBag: options?.groupByBag,
        groupByProcess: options?.groupByProcess,
      };
      
      const stableOptions = useMemo(() => createStableQueryKey(reportOptions), [reportOptions]);
  
      return useQuery<TeamProductionReport, Error>({
        queryKey: ['team-report', teamId, dateFrom, dateTo, stableOptions],
        queryFn: async () => {
          if (!teamId || !dateFrom || !dateTo) {
            throw new Error('Team ID, dateFrom, and dateTo are required');
          }
          
          try {
            const response = await DigitalFormService.getTeamReport(
              teamId,
              dateFrom,
              dateTo,
              stableOptions
            );
            
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch team report');
            }
            
            return response.data;
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (errorHandler) errorHandler(err, 'team report');
            throw err;
          }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: !!teamId && !!dateFrom && !!dateTo && options?.enabled !== false,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      });
    };
  
    /**
     * Get group production report
     */
    const getGroupReport = (
      groupId?: string,
      dateFrom?: string,
      dateTo?: string,
      options?: {
        includeWorkers?: boolean;
        detailedAttendance?: boolean;
        groupByBag?: boolean;
        groupByProcess?: boolean;
        enabled?: boolean;
      }
    ): UseQueryResult<GroupProductionReport, Error> => {
      const reportOptions = {
        includeWorkers: options?.includeWorkers,
        detailedAttendance: options?.detailedAttendance,
        groupByBag: options?.groupByBag,
        groupByProcess: options?.groupByProcess,
      };
      
      const stableOptions = useMemo(() => createStableQueryKey(reportOptions), [reportOptions]);
  
      return useQuery<GroupProductionReport, Error>({
        queryKey: ['group-report', groupId, dateFrom, dateTo, stableOptions],
        queryFn: async () => {
          if (!groupId || !dateFrom || !dateTo) {
            throw new Error('Group ID, dateFrom, and dateTo are required');
          }
          
          try {
            const response = await DigitalFormService.getGroupReport(
              groupId,
              dateFrom,
              dateTo,
              stableOptions
            );
            
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch group report');
            }
            
            return response.data;
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (errorHandler) errorHandler(err, 'group report');
            throw err;
          }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: !!groupId && !!dateFrom && !!dateTo && options?.enabled !== false,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      });
    };
  
    /**
     * Get comparison report
     */
    const getComparisonReport = (
      lineId?: string,
      entityIds?: string[],
      compareBy?: 'team' | 'group',
      dateFrom?: string,
      dateTo?: string,
      options?: {
        includeHandBags?: boolean;
        includeProcesses?: boolean;
        includeTimeSeries?: boolean;
        enabled?: boolean;
      }
    ): UseQueryResult<ProductionComparisonReport, Error> => {
      const reportOptions = {
        includeHandBags: options?.includeHandBags,
        includeProcesses: options?.includeProcesses,
        includeTimeSeries: options?.includeTimeSeries,
      };
      
      const stableOptions = useMemo(() => createStableQueryKey(reportOptions), [reportOptions]);
      const stableEntityIds = useMemo(() => entityIds?.join(','), [entityIds]);
  
      return useQuery<ProductionComparisonReport, Error>({
        queryKey: ['comparison-report', lineId, stableEntityIds, compareBy, dateFrom, dateTo, stableOptions],
        queryFn: async () => {
          if (!lineId || !entityIds || !entityIds.length || !compareBy || !dateFrom || !dateTo) {
            throw new Error('All parameters are required for comparison report');
          }
          
          try {
            const response = await DigitalFormService.getComparisonReport(
              lineId,
              entityIds,
              compareBy,
              dateFrom,
              dateTo,
              stableOptions
            );
            
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch comparison report');
            }
            
            return response.data;
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (errorHandler) errorHandler(err, 'comparison report');
            throw err;
          }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: !!lineId && !!entityIds?.length && !!compareBy && !!dateFrom && !!dateTo && options?.enabled !== false,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      });
    };
  
    /**
     * Prefetch a form by ID
     */
    const prefetchFormById = useCallback(
      async (id: string) => {
        if (!id) return;
  
        try {
          await queryClient.prefetchQuery({
            queryKey: ['digital-form', id],
            queryFn: async () => {
              const response = await DigitalFormService.getForm(id);
              if (!response.success) {
                throw new Error(response.error || 'Failed to prefetch digital form');
              }
              return response.data;
            },
            staleTime: STALE_TIME,
            gcTime: GC_TIME,
            ...DEFAULT_RETRY_OPTIONS,
          });
        } catch (error) {
          console.error(`Failed to prefetch digital form with ID ${id}:`, error);
        }
      },
      [queryClient],
    );
  
    /**
     * Invalidate form cache
     */
    const invalidateFormCache = useCallback(
      async (id: string, forceRefetch = false) => {
        if (!id) return;
  
        try {
          await queryClient.invalidateQueries({
            queryKey: ['digital-form', id],
            refetchType: forceRefetch ? 'active' : 'none',
          });
  
          await queryClient.invalidateQueries({
            queryKey: ['digital-form-with-entries', id],
            refetchType: forceRefetch ? 'active' : 'none',
          });
  
          await queryClient.invalidateQueries({
            queryKey: ['digital-form-print', id],
            refetchType: forceRefetch ? 'active' : 'none',
          });
        } catch (error) {
          console.error(`Failed to invalidate digital form cache for ID ${id}:`, error);
        }
      },
      [queryClient],
    );
  
    /**
     * Invalidate forms list cache
     */
    const invalidateFormsListCache = useCallback(
      async (forceRefetch = false) => {
        try {
          await queryClient.invalidateQueries({
            queryKey: ['digital-forms-list'],
            refetchType: forceRefetch ? 'active' : 'none',
          });
  
          await queryClient.invalidateQueries({
            queryKey: ['digital-forms-infinite'],
            refetchType: forceRefetch ? 'active' : 'none',
          });
        } catch (error) {
          console.error('Failed to invalidate digital forms list cache:', error);
        }
      },
      [queryClient],
    );
  
    return {
      getFormById,
      getFormWithEntries,
      getPrintVersion,
      listForms,
      getFormsInfinite,
      
      // Reports
      getFactoryReport,
      getLineReport,
      getTeamReport,
      getGroupReport,
      getComparisonReport,
      
      // Cache management
      prefetchFormById,
      invalidateFormCache,
      invalidateFormsListCache,
    };
  };