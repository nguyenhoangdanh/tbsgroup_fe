import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseInfiniteQueryResult,
  UseMutationResult,
  InfiniteData,
} from '@tanstack/react-query';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { stableToast } from '@/utils/stableToast';

import { BaseEntity, ListParams, BaseService, ListResponse } from './base-service';

const GC_TIME = 2 * 60 * 60 * 1000; // 2 hours
const STALE_TIME = 30 * 60 * 1000; // 30 minutes
const LIST_STALE_TIME = 5 * 60 * 1000; // 5 minutes

const DEFAULT_RETRY_OPTIONS = {
  retry: 1,
  retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
};

export interface EntityQueries<T extends BaseEntity, P extends ListParams> {
  getById: (id?: string, options?: { enabled?: boolean }) => UseQueryResult<T, Error>;
  getList: (params?: P, options?: Record<string, unknown>) => UseQueryResult<ListResponse<T>, Error>;
  getInfinite: (limit?: number, filters?: Omit<P, 'page' | 'limit'>) => UseInfiniteQueryResult<InfiniteData<ListResponse<T>>, Error>;
  prefetchById: (id: string) => Promise<void>;
  prefetchList: (params?: P) => Promise<void>;
  invalidateCache: (forceRefetch?: boolean) => Promise<void>;
}

export interface EntityMutations<T extends BaseEntity, CreateData, UpdateData> {
  create: UseMutationResult<T, Error, CreateData, unknown>;
  update: UseMutationResult<void, Error, { id: string; data: UpdateData }, unknown>;
  delete: UseMutationResult<void, Error, string, unknown>;
  batchDelete?: UseMutationResult<void, Error, string[], unknown>;
}

export interface EntityHelpers<T extends BaseEntity, P extends ListParams, CreateData, UpdateData> {
  selectedEntity: T | null;
  setSelectedEntity: (entity: T | null) => void;
  loading: boolean;
  error: Error | null;
  resetError: () => void;
  filterValues: Omit<P, 'page' | 'limit' | 'sortBy' | 'sortOrder'>;
  activeFilters: P;
  pagination: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  updateFilter: (key: string, value: unknown) => void;
  resetFilters: () => void;
  updatePagination: (page: number, limit: number, sortBy?: string, sortOrder?: 'asc' | 'desc') => void;
  handleCreate: (data: CreateData) => Promise<T>;
  handleUpdate: (id: string, data: UpdateData) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
}

export function createEntityHooks<
  T extends BaseEntity,
  P extends ListParams,
  CreateData,
  UpdateData
>(
  entityName: string,
  service: BaseService<T, P, CreateData, UpdateData>,
  _defaultValues: () => CreateData
) {
  // Create stable query key
  const createStableQueryKey = (params: Record<string, unknown>) => {
    const sortedParams: Record<string, unknown> = {};
    Object.keys(params)
      .sort()
      .forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          sortedParams[key] = params[key];
        }
      });
    return sortedParams;
  };

  // Queries Hook
  const useQueries = (): EntityQueries<T, P> => {
    const queryClient = useQueryClient();
    const [queryError, setQueryError] = useState<Error | null>(null);

    const handleQueryError = useCallback((error: unknown, queryName: string) => {
      let errorMessage = 'Lỗi không xác định';
      try {
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          const errorObj = error as Record<string, unknown>;
          if (errorObj.message && typeof errorObj.message === 'string') {
            errorMessage = errorObj.message;
          } else if (errorObj.status && errorObj.statusText) {
            errorMessage = `HTTP Error: ${errorObj.status} ${errorObj.statusText}`;
          }
        }
      } catch {
        errorMessage = 'Không thể hiển thị chi tiết lỗi';
      }

      setQueryError(error instanceof Error ? error : new Error(errorMessage));
      stableToast.error(`Không thể tải dữ liệu ${queryName}`, {
        description: errorMessage
      });
    }, []);

    const getById = (id?: string, options?: { enabled?: boolean }): UseQueryResult<T, Error> =>
      useQuery<T, Error>({
        queryKey: [entityName, id],
        queryFn: async () => {
          if (!id) throw new Error(`${entityName} ID is required`);
          try {
            return await service.getById(id);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            handleQueryError(err, entityName);
            throw err;
          }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: !!id && options?.enabled !== false,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      });

    const getList = (params: P = {} as P, options?: Record<string, unknown>): UseQueryResult<ListResponse<T>, Error> => {
      const stableParams = useMemo(() => createStableQueryKey(params as Record<string, unknown>), [params]);

      return useQuery<ListResponse<T>, Error>({
        queryKey: [`${entityName}-list`, stableParams],
        queryFn: async () => {
          try {
            return await service.getList(params);
          } catch (error) {
            handleQueryError(error, `danh sách ${entityName}`);
            throw error;
          }
        },
        staleTime: LIST_STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: !options?.skipRefetchOnMount,
        ...DEFAULT_RETRY_OPTIONS,
        ...options,
      });
    };

    const getInfinite = (
      limit = 20,
      filters: Omit<P, 'page' | 'limit'> = {} as Omit<P, 'page' | 'limit'>
    ): UseInfiniteQueryResult<InfiniteData<ListResponse<T>>, Error> => {
      const stableFilters = useMemo(() => createStableQueryKey(filters as Record<string, unknown>), [filters]);

      return useInfiniteQuery<ListResponse<T>, Error>({
        queryKey: [`${entityName}-infinite`, limit, stableFilters],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
          try {
            return await service.getList({
              ...filters,
              page: pageParam as number,
              limit,
            } as P);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            handleQueryError(err, `${entityName} (infinite scroll)`);
            throw err;
          }
        },
        getNextPageParam: (lastPage) => {
          if (!lastPage || typeof lastPage.total !== 'number' || typeof lastPage.limit !== 'number') {
            return undefined;
          }
          const totalPages = Math.ceil(lastPage.total / lastPage.limit);
          if (lastPage.page < totalPages) {
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

    const prefetchById = useCallback(
      async (id: string) => {
        if (!id) return;
        try {
          await queryClient.prefetchQuery({
            queryKey: [entityName, id],
            queryFn: () => service.getById(id),
            staleTime: STALE_TIME,
            gcTime: GC_TIME,
            ...DEFAULT_RETRY_OPTIONS,
          });
        } catch (error) {
          console.error(`Failed to prefetch ${entityName} with ID ${id}:`, error);
        }
      },
      [queryClient]
    );

    const prefetchList = useCallback(
      async (params: P = {} as P) => {
        try {
          await queryClient.prefetchQuery({
            queryKey: [`${entityName}-list`, createStableQueryKey(params as Record<string, unknown>)],
            queryFn: () => service.getList(params),
            staleTime: STALE_TIME,
            gcTime: GC_TIME,
            ...DEFAULT_RETRY_OPTIONS,
          });
        } catch (error) {
          console.error(`Failed to prefetch ${entityName} list:`, error);
        }
      },
      [queryClient]
    );

    const invalidateCache = useCallback(
      async (forceRefetch = false) => {
        try {
          await queryClient.invalidateQueries({
            queryKey: [`${entityName}-list`],
            refetchType: forceRefetch ? 'active' : 'none',
          });
          await queryClient.invalidateQueries({
            queryKey: [`${entityName}-infinite`],
            refetchType: forceRefetch ? 'active' : 'none',
          });
        } catch (error) {
          console.error(`Failed to invalidate ${entityName} cache:`, error);
        }
      },
      [queryClient]
    );

    return {
      getById,
      getList,
      getInfinite,
      prefetchById,
      prefetchList,
      invalidateCache,
    };
  };

  // Mutations Hook
  const useMutations = (): EntityMutations<T, CreateData, UpdateData> => {
    const queryClient = useQueryClient();

    const create = useMutation<T, Error, CreateData, { previousListData?: Array<{ queryKey: unknown; queryData: unknown }> }>({
      mutationFn: (data: CreateData) => service.create(data),
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: [`${entityName}-list`] });
        const queries = queryClient.getQueriesData({ queryKey: [`${entityName}-list`] });
        const previousListData: Array<{ queryKey: unknown; queryData: unknown }> = [];

        for (const [queryKey, queryData] of queries) {
          previousListData.push({ queryKey, queryData });
        }

        return { previousListData };
      },
      onSuccess: async () => {
        stableToast.success(`${entityName} đã được tạo thành công`, {
          description: undefined
        });

        queryClient.invalidateQueries({ queryKey: [`${entityName}-list`], refetchType: 'active' });
      },
      onError: (error, _variables, context) => {
        stableToast.error(`Không thể tạo ${entityName}`, {
          description: (error as Error).message
        });
        if (context?.previousListData) {
          for (const item of context.previousListData) {
            queryClient.setQueryData(item.queryKey as string[], item.queryData);
          }
        }
      },
    });

    const update = useMutation<void, Error, { id: string; data: UpdateData }, { previousListData?: Array<{ queryKey: unknown; queryData: unknown }> }>({
      mutationFn: ({ id, data }: { id: string; data: UpdateData }) => service.update(id, data),
      onMutate: async ({ id }) => {
        if (!id || typeof id !== 'string' || id.length < 5) {
          throw new Error('Invalid ID provided for update operation');
        }

        await queryClient.cancelQueries({ queryKey: [`${entityName}-list`] });
        await queryClient.cancelQueries({ queryKey: [entityName, id] });

        const queries = queryClient.getQueriesData({ queryKey: [`${entityName}-list`] });
        const previousListData: Array<{ queryKey: unknown; queryData: unknown }> = [];

        for (const [queryKey, queryData] of queries) {
          previousListData.push({ queryKey, queryData });

          queryClient.setQueryData(queryKey as string[], (oldData: ListResponse<T> | undefined) => {
            if (!oldData || !oldData.data) return oldData;
            
            return {
              ...oldData,
              data: oldData.data.map((item: T) => 
                item.id === id ? { ...item, updatedAt: new Date() } : item
              ),
            };
          });
        }

        return { previousListData };
      },
      onSuccess: async (_, variables) => {
        stableToast.success(`${entityName} đã được cập nhật thành công`, {
          description: undefined
        });
        queryClient.invalidateQueries({ queryKey: [`${entityName}-list`], refetchType: 'none' });
        queryClient.invalidateQueries({ queryKey: [entityName, variables.id], refetchType: 'none' });
      },
      onError: (error, _variables, context) => {
        stableToast.error(`Không thể cập nhật ${entityName}`, {
          description: (error as Error).message
        });
        
        if (context?.previousListData) {
          for (const item of context.previousListData) {
            queryClient.setQueryData(item.queryKey as string[], item.queryData);
          }
        }
      },
    });

    const deleteEntity = useMutation<void, Error, string, { previousListData?: Array<{ queryKey: unknown; queryData: unknown }> }>({
      mutationFn: (id: string) => service.delete(id),
      onMutate: async (id) => {
        if (!id || typeof id !== 'string' || id.length < 5) {
          throw new Error('Invalid ID provided for delete operation');
        }

        await queryClient.cancelQueries({ queryKey: [`${entityName}-list`] });
        const queries = queryClient.getQueriesData({ queryKey: [`${entityName}-list`] });
        const previousListData: Array<{ queryKey: unknown; queryData: unknown }> = [];

        for (const [queryKey, queryData] of queries) {
          previousListData.push({ queryKey, queryData });

          queryClient.setQueryData(queryKey as string[], (oldData: ListResponse<T> | undefined) => {
            if (!oldData || !oldData.data) return oldData;
            
            return {
              ...oldData,
              data: oldData.data.filter((item: T) => item.id !== id),
              total: Math.max(0, (oldData.total || 0) - 1),
            };
          });
        }

        return { previousListData };
      },
      onSuccess: async (_, id) => {
        stableToast.success(`${entityName} đã được xóa thành công`, {
          description: undefined
        });
        queryClient.invalidateQueries({ queryKey: [`${entityName}-list`], refetchType: 'none' });
        queryClient.removeQueries({ queryKey: [entityName, id] });
      },
      onError: (error, _variables, context) => {
        stableToast.error(`Không thể xóa ${entityName}`, {
          description: (error as Error).message
        });
        
        if (context?.previousListData) {
          for (const item of context.previousListData) {
            queryClient.setQueryData(item.queryKey as string[], item.queryData);
          }
        }
      },
    });

    return {
      create,
      update,
      delete: deleteEntity,
    };
  };

  // Helpers Hook
  const useHelpers = (): EntityHelpers<T, P, CreateData, UpdateData> => {
    const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [filterValues, setFilterValues] = useState<Omit<P, 'page' | 'limit' | 'sortBy' | 'sortOrder'>>({} as Omit<P, 'page' | 'limit' | 'sortBy' | 'sortOrder'>);
    const [pagination, setPagination] = useState({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc' as 'asc' | 'desc',
    });

    const isSubmittingRef = useRef(false);
    const previousFiltersRef = useRef({});

    const debouncedFilterValues = useDebounce(filterValues, 500);

    const [activeFilters, setActiveFilters] = useState<P>({
      ...filterValues,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    } as P);

    const { create, update, delete: deleteEntity } = useMutations();

    const updateFilter = useCallback((key: string, value: unknown) => {
      setFilterValues(prev => {
        const prevTyped = prev as Record<string, unknown>;
        if (prevTyped[key] === value) return prev;
        return { ...prev, [key]: value };
      });
    }, []);

    const resetFilters = useCallback(() => {
      setFilterValues({} as Omit<P, 'page' | 'limit' | 'sortBy' | 'sortOrder'>);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    const updatePagination = useCallback((page: number, limit: number, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
      setPagination(prev => ({
        page,
        limit,
        sortBy: sortBy || prev.sortBy,
        sortOrder: sortOrder || prev.sortOrder,
      }));
    }, []);

    const handleCreate = useCallback(
      async (data: CreateData): Promise<T> => {
        if (isSubmittingRef.current) throw new Error('Already submitting');
        isSubmittingRef.current = true;
        setLoading(true);
        setError(null);

        try {
          const result = await create.mutateAsync(data);
          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          throw error;
        } finally {
          setLoading(false);
          isSubmittingRef.current = false;
        }
      },
      [create]
    );

    const handleUpdate = useCallback(
      async (id: string, data: UpdateData): Promise<void> => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setLoading(true);
        setError(null);

        try {
          await update.mutateAsync({ id, data });
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          throw error;
        } finally {
          setLoading(false);
          isSubmittingRef.current = false;
        }
      },
      [update]
    );

    const handleDelete = useCallback(
      async (id: string): Promise<void> => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setLoading(true);
        setError(null);

        try {
          await deleteEntity.mutateAsync(id);
          if (selectedEntity?.id === id) {
            setSelectedEntity(null);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          throw error;
        } finally {
          setLoading(false);
          isSubmittingRef.current = false;
        }
      },
      [deleteEntity, selectedEntity]
    );

    const resetError = useCallback(() => setError(null), []);

    useEffect(() => {
      const hasFilterChanged = JSON.stringify(debouncedFilterValues) !== JSON.stringify(previousFiltersRef.current);
      previousFiltersRef.current = debouncedFilterValues;

      const newPage = hasFilterChanged ? 1 : pagination.page;

      setActiveFilters(prev => ({
        ...prev,
        ...debouncedFilterValues,
        page: newPage,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
      }));

      if (hasFilterChanged && pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, [debouncedFilterValues, pagination]);

    return {
      selectedEntity,
      setSelectedEntity,
      loading,
      error,
      resetError,
      filterValues,
      activeFilters,
      pagination,
      updateFilter,
      resetFilters,
      updatePagination,
      handleCreate,
      handleUpdate,
      handleDelete,
    };
  };

  const useEntity = () => {
    const queries = useQueries();
    const mutations = useMutations();
    const helpers = useHelpers();

    return useMemo(() => ({
      ...queries,
      ...mutations,
      ...helpers,
      queries,
      mutations,
      helpers,
    }), [queries, mutations, helpers]);
  };

  return {
    useQueries,
    useMutations,
    useHelpers,
    useEntity,
  };
}
