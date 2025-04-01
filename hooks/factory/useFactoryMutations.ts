import { useBaseMutations } from '../base/useBaseMutations';
import {
  createFactory,
  updateFactory,
  deleteFactory,
  addFactoryManager,
  removeFactoryManager,
  updateFactoryManager,
  linkFactoryWithDepartment
} from '@/apis/factory/factory.api';
import {
  Factory,
  FactoryCreateDTO,
  FactoryUpdateDTO,
  FactoryManagerDTO,
  FactoryManager,
  FactoryWithDetails
} from '@/common/interface/factory';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { BaseResponseData } from '../base/useBaseQueries';
import { useCallback } from 'react';

/**
 * Hook for Factory mutations with optimized cache handling
 */
export const useFactoryMutations = () => {
  const queryClient = useQueryClient();

  // Base factory mutations using useBaseMutations
  const factoryMutations = useBaseMutations<Factory, FactoryCreateDTO, FactoryUpdateDTO>(
    'factory',
    createFactory,
    updateFactory,
    deleteFactory
  );

  /**
   * Enhanced create factory mutation with optimistic updates
   */
  const createFactoryMutation = useMutation({
    mutationFn: (data: FactoryCreateDTO) => createFactory(data),
    onSuccess: (newFactory) => {
      // Vì createFactory trả về { id: string }, chúng ta cần dữ liệu đầy đủ để cập nhật cache
      // Do đó, chúng ta không thể cập nhật cache ở đây, mà sẽ dựa vào invalidation
      queryClient.invalidateQueries({ queryKey: ['factory-list'] });
    }
  });

  /**
   * Enhanced update factory mutation with optimistic updates
   */
  const updateFactoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FactoryUpdateDTO }) => updateFactory(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['factory', id] });
      
      // Snapshot previous values
      const previousFactory = queryClient.getQueryData<Factory>(['factory', id]);
      
      // Optimistically update the cache
      if (previousFactory) {
        const updatedFactory = {
          ...previousFactory,
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        // Update individual factory cache
        queryClient.setQueryData(['factory', id], updatedFactory);
        
        // Update factory in lists
        queryClient.setQueriesData({ queryKey: ['factory-list'] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map((factory: Factory) => 
              factory.id === id ? updatedFactory : factory
            )
          };
        });
        
        // Update factory in details cache
        queryClient.setQueryData(['factory', id, 'details'], (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, ...updatedFactory };
        });
      }
      
      return { previousFactory };
    },
    onError: (err, { id }, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousFactory) {
        queryClient.setQueryData(['factory', id], context.previousFactory);
        
        // Roll back factory in lists
        queryClient.setQueriesData({ queryKey: ['factory-list'] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map((factory: Factory) => 
              factory.id === id ? context.previousFactory : factory
            )
          };
        });
        
        // Roll back factory in details cache
        queryClient.setQueryData(['factory', id, 'details'], (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, ...context.previousFactory };
        });
      }
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['factory', id] });
      
      // Also update the factory in list without forcing refetch
      queryClient.invalidateQueries({ 
        queryKey: ['factory-list'],
        refetchType: 'none'
      });
    }
  });

  /**
   * Enhanced delete factory mutation with optimistic updates
   */
  const deleteFactoryMutation = useMutation({
    mutationFn: (id: string) => deleteFactory(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['factory', id] });
      await queryClient.cancelQueries({ queryKey: ['factory-list'] });
      
      // Snapshot previous values
      const previousFactory = queryClient.getQueryData<Factory>(['factory', id]);
      const previousList = queryClient.getQueryData<BaseResponseData<Factory>>(['factory-list']);
      
      // Optimistically remove from lists
      queryClient.setQueriesData({ queryKey: ['factory-list'] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((factory: Factory) => factory.id !== id),
          total: Math.max(0, (oldData.total || 0) - 1)
        };
      });
      
      // Remove from individual cache
      queryClient.removeQueries({ queryKey: ['factory', id] });
      queryClient.removeQueries({ queryKey: ['factory', id, 'details'] });
      queryClient.removeQueries({ queryKey: ['factory', id, 'managers'] });
      
      return { previousFactory, previousList };
    },
    onError: (err, id, context: any) => {
      // If the mutation fails, restore the previous data
      if (context?.previousFactory) {
        queryClient.setQueryData(['factory', id], context.previousFactory);
      }
      
      if (context?.previousList) {
        queryClient.setQueryData(['factory-list'], context.previousList);
      }
    },
    onSettled: () => {
      // Just invalidate the list to ensure correct state, but don't force refetch
      queryClient.invalidateQueries({ 
        queryKey: ['factory-list'],
        refetchType: 'none'
      });
    }
  });

  /**
   * Add factory manager mutation with optimistic updates
   */
  const addManagerMutation = useMutation({
    mutationFn: ({ factoryId, managerDTO }: { factoryId: string; managerDTO: FactoryManagerDTO }) => 
      addFactoryManager(factoryId, managerDTO),
    onMutate: async ({ factoryId, managerDTO }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['factory', factoryId, 'managers'] });
      await queryClient.cancelQueries({ queryKey: ['factory', factoryId, 'details'] });
      
      // Get previous managers
      const previousManagers = queryClient.getQueryData<FactoryManager[]>(['factory', factoryId, 'managers']) || [];
      
      // Create optimistic new manager
      const optimisticManager: any = {
        userId: managerDTO.userId,
        factoryId: factoryId,
        isPrimary: managerDTO.isPrimary || false,
        startDate: typeof managerDTO.startDate === 'string' 
          ? managerDTO.startDate 
          : managerDTO.startDate.toISOString(),
        endDate: managerDTO.endDate 
          ? (typeof managerDTO.endDate === 'string' 
              ? managerDTO.endDate 
              : managerDTO.endDate.toISOString())
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _optimistic: true // Mark as optimistic
      };
      
      // Update managers cache
      const updatedManagers = [...previousManagers, optimisticManager];
      queryClient.setQueryData(['factory', factoryId, 'managers'], updatedManagers);
      
      // Update details cache if it exists
      queryClient.setQueryData(['factory', factoryId, 'details'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          managers: updatedManagers
        };
      });
      
      return { previousManagers };
    },
    onError: (err, { factoryId }, context: any) => {
      // Revert to previous state
      if (context?.previousManagers) {
        queryClient.setQueryData(['factory', factoryId, 'managers'], context.previousManagers);
        
        // Update details cache
        queryClient.setQueryData(['factory', factoryId, 'details'], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            managers: context.previousManagers
          };
        });
      }
    },
    onSuccess: (result, { factoryId }) => {
      // Fetch the latest data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['factory', factoryId, 'managers'] });
      queryClient.invalidateQueries({ queryKey: ['factory', factoryId, 'details'] });
    }
  });

  /**
   * Remove factory manager mutation with optimistic updates
   */
  const removeManagerMutation = useMutation({
    mutationFn: ({ factoryId, userId }: { factoryId: string; userId: string }) => 
      removeFactoryManager(factoryId, userId),
    onMutate: async ({ factoryId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['factory', factoryId, 'managers'] });
      await queryClient.cancelQueries({ queryKey: ['factory', factoryId, 'details'] });
      
      // Get previous managers
      const previousManagers = queryClient.getQueryData<FactoryManager[]>(['factory', factoryId, 'managers']) || [];
      
      // Optimistically remove the manager
      const updatedManagers = previousManagers.filter(manager => manager.userId !== userId);
      queryClient.setQueryData(['factory', factoryId, 'managers'], updatedManagers);
      
      // Update details cache if it exists
      queryClient.setQueryData(['factory', factoryId, 'details'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          managers: updatedManagers
        };
      });
      
      return { previousManagers };
    },
    onError: (err, { factoryId }, context: any) => {
      // Revert to previous state
      if (context?.previousManagers) {
        queryClient.setQueryData(['factory', factoryId, 'managers'], context.previousManagers);
        
        // Update details cache
        queryClient.setQueryData(['factory', factoryId, 'details'], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            managers: context.previousManagers
          };
        });
      }
    },
    onSuccess: (result, { factoryId }) => {
      // Fetch the latest data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['factory', factoryId, 'managers'] });
      queryClient.invalidateQueries({ queryKey: ['factory', factoryId, 'details'] });
    }
  });

  /**
   * Update factory manager mutation with optimistic updates
   */
  const updateManagerMutation = useMutation({
    mutationFn: ({ 
      factoryId, 
      userId, 
      data 
    }: { 
      factoryId: string; 
      userId: string; 
      data: { isPrimary?: boolean; endDate?: Date | null } 
    }) => {
      // Chuyển đổi định dạng nếu cần thiết
      // Nếu endDate là null, giữ nguyên
      // Nếu endDate là Date, giữ nguyên
      return updateFactoryManager(factoryId, userId, data);
    },
    onMutate: async ({ factoryId, userId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['factory', factoryId, 'managers'] });
      await queryClient.cancelQueries({ queryKey: ['factory', factoryId, 'details'] });
      
      // Get previous managers
      const previousManagers = queryClient.getQueryData<FactoryManager[]>(['factory', factoryId, 'managers']) || [];
      
      // Optimistically update the manager
      const updatedManagers = previousManagers.map(manager => {
        if (manager.userId === userId) {
          return { 
            ...manager, 
            isPrimary: data.isPrimary !== undefined ? data.isPrimary : manager.isPrimary,
            endDate: data.endDate !== undefined ? 
              (data.endDate === null ? null : (
                typeof data.endDate === 'string' ? data.endDate : data.endDate.toISOString()
              )) : 
              manager.endDate,
            updatedAt: new Date().toISOString(),
            _optimistic: true 
          };
        }
        return manager;
      });
      
      queryClient.setQueryData(['factory', factoryId, 'managers'], updatedManagers);
      
      // Update details cache if it exists
      queryClient.setQueryData(['factory', factoryId, 'details'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          managers: updatedManagers
        };
      });
      
      return { previousManagers };
    },
    onError: (err, { factoryId }, context: any) => {
      // Revert to previous state
      if (context?.previousManagers) {
        queryClient.setQueryData(['factory', factoryId, 'managers'], context.previousManagers);
        
        // Update details cache
        queryClient.setQueryData(['factory', factoryId, 'details'], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            managers: context.previousManagers
          };
        });
      }
    },
    onSuccess: (result, { factoryId }) => {
      // Fetch the latest data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['factory', factoryId, 'managers'] });
      queryClient.invalidateQueries({ queryKey: ['factory', factoryId, 'details'] });
    }
  });

  /**
   * Link factory with department mutation
   */
  const linkDepartmentMutation = useMutation({
    mutationFn: ({ factoryId, departmentId }: { factoryId: string; departmentId: string }) => 
      linkFactoryWithDepartment(factoryId, departmentId),
    onMutate: async ({ factoryId, departmentId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['factory', factoryId] });
      
      // Get previous factory data
      const previousFactory = queryClient.getQueryData<Factory>(['factory', factoryId]);
      
      // Optimistically update the factory
      if (previousFactory) {
        const updatedFactory = {
          ...previousFactory,
          departmentId: departmentId,
          updatedAt: new Date().toISOString()
        };
        
        queryClient.setQueryData(['factory', factoryId], updatedFactory);
        
        // Update in lists
        queryClient.setQueriesData({ queryKey: ['factory-list'] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map((factory: Factory) => 
              factory.id === factoryId ? updatedFactory : factory
            )
          };
        });
        
        // Update details cache
        queryClient.setQueryData(['factory', factoryId, 'details'], (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, departmentId };
        });
      }
      
      return { previousFactory };
    },
    onError: (err, { factoryId }, context: any) => {
      // Revert to previous state
      if (context?.previousFactory) {
        queryClient.setQueryData(['factory', factoryId], context.previousFactory);
        
        // Update in lists
        queryClient.setQueriesData({ queryKey: ['factory-list'] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map((factory: Factory) => 
              factory.id === factoryId ? context.previousFactory : factory
            )
          };
        });
        
        // Update details cache
        queryClient.setQueryData(['factory', factoryId, 'details'], (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, ...context.previousFactory };
        });
      }
    },
    onSuccess: (result, { factoryId }) => {
      // Fetch the latest data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['factory', factoryId] });
    }
  });

  /**
   * Safely invalidate factory caches
   */
  const invalidateFactoryCaches = useCallback(async (factoryId: string, options?: { forceRefetch?: boolean }) => {
    if (!factoryId) return;
    
    const refetchType = options?.forceRefetch ? 'active' : 'none';
    
    // Invalidate factory data
    await queryClient.invalidateQueries({
      queryKey: ['factory', factoryId],
      refetchType
    });
    
    // Invalidate factory details
    await queryClient.invalidateQueries({
      queryKey: ['factory', factoryId, 'details'],
      refetchType
    });
    
    // Invalidate factory managers
    await queryClient.invalidateQueries({
      queryKey: ['factory', factoryId, 'managers'],
      refetchType
    });
    
    // Invalidate factory lists without forcing refetch
    await queryClient.invalidateQueries({
      queryKey: ['factory-list'],
      refetchType: 'none'
    });
  }, [queryClient]);

  return {
    // Enhanced factory mutations
    createFactoryMutation,
    updateFactoryMutation,
    deleteFactoryMutation,

    // Legacy mutations (for backward compatibility)
    legacyCreateFactoryMutation: factoryMutations.createMutation,
    legacyUpdateFactoryMutation: factoryMutations.updateMutation,
    legacyDeleteFactoryMutation: factoryMutations.deleteMutation,

    // Manager mutations
    addManagerMutation,
    removeManagerMutation,
    updateManagerMutation,
    
    // Other mutations
    linkDepartmentMutation,
    
    // Helper methods
    invalidateFactoryCaches
  };
};