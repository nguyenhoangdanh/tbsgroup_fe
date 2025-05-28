'use client';

import { UseQueryResult, useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';

import { useFactoryHelpers } from './useFactoryHelpers';
import { useFactoryMutations } from './useFactoryMutations';
import { useFactoryQueries } from './useFactoryQueries';

import {
  batchDeleteFactoriesParallel,
  getFactoryById as getFactoryByIdApi,
} from '@/apis/factory/factory.api';
import {
  Factory,
  FactoryCreateDTO,
  FactoryUpdateDTO,
  FactoryCondDTO,
  FactoryManagerDTO,
} from '@/common/interface/factory';
import { toast } from 'react-toast-kit';
import { BaseResponseData, BasePaginationParams } from '@/hooks/base/useBaseQueries';

interface FactoryContextType {
  listFactories: (
    params?: FactoryCondDTO & BasePaginationParams,
    options?: any,
  ) => UseQueryResult<BaseResponseData<Factory>, Error>;
  deleteFactoryMutation: ReturnType<typeof useFactoryMutations>['deleteFactoryMutation'];
  setSelectedFactory: (factory: Factory | null) => void;
  selectedFactory: Factory | null;
  loading: boolean;
  activeFilters: FactoryCondDTO & BasePaginationParams;
  handleCreateFactory: (data: Omit<FactoryCreateDTO, 'id'>) => Promise<Factory>;
  handleUpdateFactory: (id: string, data: Omit<FactoryUpdateDTO, 'id'>) => Promise<Factory>;
  handleAddManager: (factoryId: string, managerDTO: FactoryManagerDTO) => Promise<void>;
  handleRemoveManager: (factoryId: string, userId: string) => Promise<void>;
  resetError: () => void;
  updatePagination: (page: number, limit?: number) => void;
  batchDeleteFactoriesMutation: (ids: string[]) => Promise<void>;
}

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

export const FactoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use QueryClient for cache manipulation
  const queryClient = useQueryClient();

  // State management
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);
  const [loading, setLoading] = useState(false);

  //  Simplified refs for operation tracking
  const isMountedRef = useRef(true);
  const operationsInProgress = useRef(new Map<string, boolean>());

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Get helpers for filtering
  const {
    updateFilter,
    pagination,
    filterValues: activeFilters,
    resetFilters,
  } = useFactoryHelpers();

  // Get query methods
  const {
    listItems: listFactories,
    invalidateItemCache,
    invalidateListCache,
  } = useFactoryQueries();

  // Get mutation methods
  const {
    createFactoryMutation,
    updateFactoryMutation,
    deleteFactoryMutation,
    addManagerMutation,
    removeManagerMutation,
  } = useFactoryMutations();

  // Optimized cache invalidation helper
  const invalidateRelevantCaches = useCallback(
    async (factoryId: string, options = { refetch: true }) => {
      // Invalidate with a single call to reduce React renders
      await queryClient.invalidateQueries({
        predicate: query => {
          // Match item cache
          if (query.queryKey[0] === 'factory' && query.queryKey[1] === factoryId) {
            return true;
          }

          // Match details cache
          if (
            query.queryKey[0] === 'factory' &&
            query.queryKey[1] === factoryId &&
            query.queryKey[2] === 'details'
          ) {
            return true;
          }

          //  Match managers cache
          if (
            query.queryKey[0] === 'factory' &&
            query.queryKey[1] === factoryId &&
            query.queryKey[2] === 'managers'
          ) {
            return true;
          }

          // Match list cache
          if (query.queryKey[0] === 'factory-list') {
            return true;
          }

          //  Match accessible factories
          if (query.queryKey[0] === 'factories' && query.queryKey[1] === 'accessible') {
            return true;
          }

          return false;
        },
        refetchType: options.refetch ? 'active' : 'none',
      });
    },
    [queryClient],
  );

  // Helper to manage operation tracking
  const manageOperation = useCallback(
    <T,>(operationKey: string, operation: () => Promise<T>): Promise<T> => {
      //Check if operation is already in progress
      if (operationsInProgress.current.get(operationKey)) {
        return Promise.reject(new Error('Operation already in progress'));
      }

      //Set operation in progress
      operationsInProgress.current.set(operationKey, true);
      setLoading(true);

      //  Execute operation
      return operation().finally(() => {
        if (isMountedRef.current) {
          operationsInProgress.current.delete(operationKey);
          setLoading(false);
        }
      });
    },
    [],
  );

  // Fetch factory by ID with optimized cache usage
  const fetchLatestFactory = useCallback(
    async (factoryId: string): Promise<Factory | null> => {
      try {
        // First check if it's already in the cache
        const cachedFactory = queryClient.getQueryData<Factory>(['factory', factoryId]);
        if (cachedFactory) return cachedFactory;

        // If not in cache, fetch directly
        return await getFactoryByIdApi(factoryId);
      } catch (error) {
        console.error('Error fetching latest factory:', error);
        return null;
      }
    },
    [queryClient],
  );

  // Create factory with optimized cache handling
  const handleCreateFactory = useCallback(
    async (data: Omit<FactoryCreateDTO, 'id'>): Promise<Factory> => {
      return manageOperation(`create-factory-${Date.now()}`, async () => {
        try {
          // Perform mutation
          const result = await createFactoryMutation.mutateAsync(data);

          toast({
            title: 'Tạo nhà máy thành công',
            description: `Nhà máy "${data.name}" đã được tạo.`,
            duration: 2000,
          });

          // Get ID from result
          const createdId = result?.id;
          if (!createdId) {
            throw new Error('Could not create factory - No ID returned from API');
          }

          // Invalidate caches
          await invalidateRelevantCaches(createdId);

          // Fetch complete Factory object
          const fetchedFactory = await fetchLatestFactory(createdId);
          if (fetchedFactory) return fetchedFactory;

          //  Fallback object if fetch fails
          return {
            id: createdId,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Factory;
        } catch (error) {
          // Handle error
          console.error('Error creating factory:', error);
          toast({
            title: 'Lỗi tạo nhà máy',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'error',
            duration: 3000,
          });
          throw error;
        }
      });
    },
    [createFactoryMutation, fetchLatestFactory, invalidateRelevantCaches, manageOperation],
  );

  //  Update factory with optimized cache handling
  const handleUpdateFactory = useCallback(
    async (id: string, updateData: Omit<FactoryUpdateDTO, 'id'>): Promise<Factory> => {
      return manageOperation(`update-factory-${id}-${Date.now()}`, async () => {
        try {
          //  Perform mutation
          await updateFactoryMutation.mutateAsync({
            id,
            data: updateData,
          });

          toast({
            title: 'Cập nhật nhà máy thành công',
            description: `Nhà máy đã được cập nhật.`,
            duration: 2000,
          });

          // Invalidate cache
          await invalidateRelevantCaches(id);

          //  Fetch updated Factory
          const updatedFactory = await fetchLatestFactory(id);
          if (!updatedFactory) {
            throw new Error('Không thể lấy thông tin nhà máy sau khi cập nhật');
          }

          return updatedFactory;
        } catch (error) {
          // Handle error
          toast({
            title: 'Lỗi cập nhật nhà máy',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'error',
            duration: 3000,
          });
          throw error;
        }
      });
    },
    [updateFactoryMutation, fetchLatestFactory, invalidateRelevantCaches, manageOperation],
  );

  // Add manager with optimized operation tracking
  const handleAddManager = useCallback(
    async (factoryId: string, managerDTO: FactoryManagerDTO): Promise<void> => {
      return manageOperation(`add-manager-${factoryId}-${Date.now()}`, async () => {
        try {
          await addManagerMutation.mutateAsync({ factoryId, managerDTO });

          toast({
            title: 'Thêm quản lý thành công',
            description: `Quản lý đã được thêm vào nhà máy.`,
            duration: 2000,
          });

          await invalidateRelevantCaches(factoryId);
        } catch (error) {
          toast({
            title: 'Lỗi thêm quản lý',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'error',
            duration: 3000,
          });
          throw error;
        }
      });
    },
    [addManagerMutation, invalidateRelevantCaches, manageOperation],
  );

  // Remove manager with optimized operation tracking
  const handleRemoveManager = useCallback(
    async (factoryId: string, userId: string): Promise<void> => {
      return manageOperation(`remove-manager-${factoryId}-${userId}-${Date.now()}`, async () => {
        try {
          await removeManagerMutation.mutateAsync({ factoryId, userId });

          toast({
            title: 'Xóa quản lý thành công',
            description: `Quản lý đã được xóa khỏi nhà máy.`,
            duration: 2000,
          });

          await invalidateRelevantCaches(factoryId);
        } catch (error) {
          toast({
            title: 'Lỗi xóa quản lý',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'error',
            duration: 3000,
          });
          throw error;
        }
      });
    },
    [removeManagerMutation, invalidateRelevantCaches, manageOperation],
  );

  // Simplified pagination update
  const updatePagination = useCallback(
    (page: number, limit?: number) => {
      const currentPage = pagination.page;
      const currentLimit = pagination.limit;

      //  Only update if values changed
      if (page !== currentPage) {
        updateFilter('page' as keyof FactoryCondDTO, page);
      }

      if (limit !== undefined && limit !== currentLimit) {
        updateFilter('limit' as keyof FactoryCondDTO, limit);
      }
    },
    [pagination.page, pagination.limit, updateFilter],
  );

  // Reset error method
  const resetError = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  //  Batch delete factories with optimized cache handling
  const batchDeleteFactoriesMutation = useCallback(
    async (ids: string[]) => {
      return manageOperation(`batch-delete-factories-${Date.now()}`, async () => {
        try {
          await batchDeleteFactoriesParallel(ids);

          //  Invalidate all affected caches at once
          await Promise.all([
            //  Invalidate each factory ID cache
            ...ids.map(id => invalidateItemCache(id)),
            //  Invalidate list cache
            invalidateListCache(true),
          ]);

          toast({
            title: 'Xóa nhà máy thành công',
            description: `Đã xóa ${ids.length} nhà máy.`,
            duration: 2000,
          });
        } catch (error) {
          console.error('Error batch deleting factories:', error);

          toast({
            title: 'Lỗi xóa nhà máy',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'error',
            duration: 3000,
          });

          throw error;
        }
      });
    },
    [invalidateItemCache, invalidateListCache, manageOperation],
  );

  // Memoize context value
  const contextValue = useMemo<FactoryContextType>(
    () => ({
      listFactories,
      deleteFactoryMutation,
      setSelectedFactory,
      selectedFactory,
      loading,
      activeFilters,
      handleCreateFactory,
      handleUpdateFactory,
      handleAddManager,
      handleRemoveManager,
      resetError,
      updatePagination,
      batchDeleteFactoriesMutation,
    }),
    [
      listFactories,
      deleteFactoryMutation,
      setSelectedFactory,
      selectedFactory,
      loading,
      activeFilters,
      handleCreateFactory,
      handleUpdateFactory,
      handleAddManager,
      handleRemoveManager,
      resetError,
      updatePagination,
      batchDeleteFactoriesMutation,
    ],
  );

  return <FactoryContext.Provider value={contextValue}>{children}</FactoryContext.Provider>;
};

//Custom hook to use context
export const useFactoryContext = () => {
  const context = useContext(FactoryContext);
  if (context === undefined) {
    throw new Error('useFactoryContext must be used within a FactoryProvider');
  }
  return context;
};

export default FactoryContext;
