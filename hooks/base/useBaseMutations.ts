import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../use-toast';

/**
 * Hook cơ sở cho mutations, có thể tái sử dụng cho bất kỳ module nào
 */
export const useBaseMutations = <T, CreateDTO, UpdateDTO>(
  resourceName: string,
  createFn: (data: CreateDTO) => Promise<{ id: string }>,
  updateFn: (id: string, data: UpdateDTO) => Promise<void>,
  deleteFn: (id: string) => Promise<void>,
  getTempId: () => string = () => `temp-${Date.now()}`,
) => {
  const queryClient = useQueryClient();

  /**
   * Create a new item with optimistic update
   */
  const createMutation = useMutation({
    mutationFn: (data: CreateDTO) => createFn(data),
    onMutate: async (newData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: [`${resourceName}-list`] });

      // Find and store the current query data for list
      const queries = queryClient.getQueriesData({ queryKey: [`${resourceName}-list`] });
      const previousListData = Array.from(queries).map(([queryKey, queryData]) => ({
        queryKey,
        queryData,
      }));

      // Create a temporary ID for the optimistic update
      const tempId = getTempId();

      // We need to cast the data since we don't know its exact shape at compile time
      const optimisticItem = {
        id: tempId,
        ...newData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as T;

      // Update each list query with optimistic data
      for (const { queryKey } of previousListData) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          return {
            ...oldData,
            data: [optimisticItem, ...oldData.data],
            total: oldData.total + 1,
          };
        });
      }

      return { previousListData, tempId };
    },
    onSuccess: async (result) => {
      // Show success toast
      toast({
        title: `${resourceName} đã được tạo thành công`,
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: [`${resourceName}-list`],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: [`${resourceName}-infinite`],
        refetchType: 'none',
      });

      if (result?.id) {
        queryClient.invalidateQueries({
          queryKey: [resourceName, result.id],
          refetchType: 'none',
        });
      }
    },
    onError: (error, _, context) => {
      toast({
        title: `Không thể tạo ${resourceName}`,
        description: (error as Error).message,
        variant: 'destructive',
        duration: 2000,
      });

      // Rollback to the previous state
      if (context?.previousListData) {
        for (const { queryKey, queryData } of context.previousListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Update an existing item with optimistic update
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDTO }) => updateFn(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`${resourceName}-list`] });
      await queryClient.cancelQueries({ queryKey: [resourceName, id] });

      // Get current data
      const previousItem = queryClient.getQueryData([resourceName, id]);

      // Find and store the current query data for list
      const queries = queryClient.getQueriesData({ queryKey: [`${resourceName}-list`] });
      const previousListData = Array.from(queries).map(([queryKey, queryData]) => ({
        queryKey,
        queryData,
      }));

      // Update each list query optimistically
      for (const { queryKey } of previousListData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          
          return {
            ...old,
            data: old.data.map((item: any) =>
              item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
            ),
          };
        });
      }

      // Update individual item cache if it exists
      if (previousItem) {
        queryClient.setQueryData([resourceName, id], (old: any) => ({
          ...old,
          ...data,
          updatedAt: new Date().toISOString(),
        }));
      }

      return { previousItem, previousListData };
    },
    onSuccess: async (_, variables) => {
      // Show success toast
      toast({
        title: `${resourceName} đã được cập nhật thành công`,
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: [`${resourceName}-list`],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: [resourceName, variables.id],
        refetchType: 'none',
      });
    },
    onError: (error, variables, context) => {
      toast({
        title: `Không thể cập nhật ${resourceName}`,
        description: (error as Error).message,
        variant: 'destructive',
        duration: 2000,
      });

      // Rollback
      if (context?.previousItem) {
        queryClient.setQueryData([resourceName, variables.id], context.previousItem);
      }

      // Restore all list queries
      if (context?.previousListData) {
        for (const { queryKey, queryData } of context.previousListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Delete an item with optimistic update
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`${resourceName}-list`] });

      // Find and store the current query data for list
      const queries = queryClient.getQueriesData({ queryKey: [`${resourceName}-list`] });
      const previousListData = Array.from(queries).map(([queryKey, queryData]) => ({
        queryKey,
        queryData,
      }));

      // Get the current item data
      const previousItem = queryClient.getQueryData([resourceName, id]);

      // Update each list query optimistically
      for (const { queryKey } of previousListData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          
          return {
            ...old,
            data: old.data.filter((item: any) => item.id !== id),
            total: Math.max(0, old.total - 1),
          };
        });
      }

      return { previousListData, previousItem };
    },
    onSuccess: async (_, id) => {
      // Show success toast
      toast({
        title: `${resourceName} đã được xóa thành công`,
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: [`${resourceName}-list`],
        refetchType: 'none',
      });

      // Remove the item from cache
      queryClient.removeQueries({ queryKey: [resourceName, id] });
    },
    onError: (error, id, context) => {
      toast({
        title: `Không thể xóa ${resourceName}`,
        description: (error as Error).message,
        variant: 'destructive',
        duration: 2000,
      });

      // Restore all list queries
      if (context?.previousListData) {
        for (const { queryKey, queryData } of context.previousListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }

      // Restore the item if it existed
      if (context?.previousItem) {
        queryClient.setQueryData([resourceName, id], context.previousItem);
      }
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
};