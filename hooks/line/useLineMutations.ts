import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useBaseMutations } from '../base/useBaseMutations';

import {
  createLine,
  updateLine,
  deleteLine,
  addLineManager,
  removeLineManager,
  updateLineManager,
  batchDeleteLinesParallel,
} from '@/apis/line/line.api';
import { Line, LineCreateDTO, LineUpdateDTO, LineManagerDTO } from '@/common/interface/line';

/**
 * Hook for Line mutations with optimized cache handling
 */
export const useLineMutations = () => {
  const queryClient = useQueryClient();

  // Base line mutations using useBaseMutations
  const lineMutations = useBaseMutations<Line, LineCreateDTO, LineUpdateDTO>(
    'line',
    createLine,
    updateLine,
    deleteLine,
  );

  /**
   * Enhanced create line mutation with optimistic updates
   */
  const createLineMutation = useMutation({
    mutationFn: (data: LineCreateDTO) => createLine(data),
    onSuccess: (newLine, variables) => {
      // Get factory ID from the mutation data
      const factoryId = variables.factoryId;

      //  Invalidate relevant caches
      queryClient.invalidateQueries({
        queryKey: ['factory', factoryId, 'lines'],
      });
      queryClient.invalidateQueries({ queryKey: ['line-list'] });
    },
  });

  /**
   * Enhanced update line mutation with optimistic updates
   */
  const updateLineMutation = useMutation({
    mutationFn: (data: LineUpdateDTO & { id: string }) => updateLine(data.id, data),
    onMutate: async data => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['line', data.id] });

      // Snapshot previous values
      const previousLine = queryClient.getQueryData<Line>(['line', data.id]);

      // Optimistically update the cache
      if (previousLine) {
        const updatedLine = {
          ...previousLine,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        // Update individual line cache
        queryClient.setQueryData(['line', data.id], updatedLine);

        // Update line in factory lines list
        if (previousLine.factoryId) {
          queryClient.setQueriesData(
            { queryKey: ['factory', previousLine.factoryId, 'lines'] },
            (oldData: Line[] | undefined) => {
              if (!oldData) return oldData;

              return oldData.map((line: Line) => (line.id === data.id ? updatedLine : line));
            },
          );
        }

        // Update line in lists
        queryClient.setQueriesData({ queryKey: ['line-list'] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((line: Line) => (line.id === data.id ? updatedLine : line)),
          };
        });
      }

      return { previousLine };
    },
    onError: (err, data, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLine) {
        queryClient.setQueryData(['line', data.id], context.previousLine);

        // Roll back line in factory lines list
        if (context.previousLine.factoryId) {
          queryClient.setQueriesData(
            { queryKey: ['factory', context.previousLine.factoryId, 'lines'] },
            (oldData: Line[] | undefined) => {
              if (!oldData) return oldData;

              return oldData.map((line: Line) =>
                line.id === data.id ? context.previousLine : line,
              );
            },
          );
        }

        // Roll back line in lists
        queryClient.setQueriesData({ queryKey: ['line-list'] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((line: Line) =>
              line.id === data.id ? context.previousLine : line,
            ),
          };
        });
      }
    },
    onSettled: (result, error, data) => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['line', data.id] });

      // Get factory ID from cache if available
      const lineData = queryClient.getQueryData<Line>(['line', data.id]);

      // If we have factory ID, invalidate factory lines
      if (lineData?.factoryId) {
        queryClient.invalidateQueries({
          queryKey: ['factory', lineData.factoryId, 'lines'],
          refetchType: 'none', // Don't force refetch
        });
      }

      //  Also update the line in list without forcing refetch
      queryClient.invalidateQueries({
        queryKey: ['line-list'],
        refetchType: 'none',
      });
    },
  });

  /**
   * Enhanced delete line mutation with optimistic updates
   */
  const deleteLineMutation = useMutation({
    mutationFn: (lineId: string) => deleteLine(lineId),
    onMutate: async lineId => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['line', lineId] });

      // Snapshot previous values
      const previousLine = queryClient.getQueryData<Line>(['line', lineId]);
      const factoryId = previousLine?.factoryId;

      // If we have factory ID, optimistically remove from factory's lines list
      if (factoryId) {
        // Cancel any outgoing factory lines refetches
        await queryClient.cancelQueries({
          queryKey: ['factory', factoryId, 'lines'],
        });

        //  Snapshot previous factory lines
        const previousFactoryLines = queryClient.getQueryData<Line[]>([
          'factory',
          factoryId,
          'lines',
        ]);

        // Optimistically update the cache
        if (previousFactoryLines) {
          queryClient.setQueryData(
            ['factory', factoryId, 'lines'],
            previousFactoryLines.filter(line => line.id !== lineId),
          );
        }

        // Also update the lines list if it exists
        queryClient.setQueriesData({ queryKey: ['line-list'] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.filter((line: Line) => line.id !== lineId),
            total: oldData.total ? Math.max(0, oldData.total - 1) : undefined,
          };
        });

        // Remove from individual line cache
        queryClient.removeQueries({ queryKey: ['line', lineId] });

        return { previousLine, previousFactoryLines, factoryId };
      }

      return { previousLine };
    },
    onError: (err, lineId, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLine) {
        queryClient.setQueryData(['line', lineId], context.previousLine);
      }

      if (context?.factoryId && context?.previousFactoryLines) {
        queryClient.setQueryData(
          ['factory', context.factoryId, 'lines'],
          context.previousFactoryLines,
        );
      }

      // Roll back lines list if needed
      if (context?.previousLine) {
        queryClient.setQueriesData({ queryKey: ['line-list'] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          // Check if line exists in the current data
          const lineExists = oldData.data.some((line: Line) => line.id === lineId);

          if (!lineExists) {
            return {
              ...oldData,
              data: [...oldData.data, context.previousLine],
              total: (oldData.total || 0) + 1,
            };
          }

          return oldData;
        });
      }
    },
    onSettled: (result, error, lineId, context) => {
      //  Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['line', lineId] });

      // If we have factory ID, invalidate factory lines
      if (context?.factoryId) {
        queryClient.invalidateQueries({
          queryKey: ['factory', context.factoryId, 'lines'],
          refetchType: 'none', // Don't force refetch
        });
      }

      // Also update the line list without forcing refetch
      queryClient.invalidateQueries({
        queryKey: ['line-list'],
        refetchType: 'none',
      });
    },
  });

  /**
   * Add line manager mutation with optimistic updates
   */
  const addManagerMutation = useMutation({
    mutationFn: ({ lineId, managerDTO }: { lineId: string; managerDTO: LineManagerDTO }) =>
      addLineManager(lineId, managerDTO),
    onMutate: async ({ lineId, managerDTO }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['line', lineId, 'managers'] });
      await queryClient.cancelQueries({ queryKey: ['line', lineId, 'details'] });

      // Get previous managers
      const previousManagers = queryClient.getQueryData<any[]>(['line', lineId, 'managers']) || [];

      // Create optimistic new manager
      const optimisticManager: any = {
        userId: managerDTO.userId,
        lineId: lineId,
        isPrimary: managerDTO.isPrimary || false,
        startDate:
          typeof managerDTO.startDate === 'string'
            ? managerDTO.startDate
            : managerDTO.startDate.toISOString(),
        endDate: managerDTO.endDate
          ? typeof managerDTO.endDate === 'string'
            ? managerDTO.endDate
            : managerDTO.endDate.toISOString()
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _optimistic: true, // Mark as optimistic
      };

      // Update managers cache
      const updatedManagers = [...previousManagers, optimisticManager];
      queryClient.setQueryData(['line', lineId, 'managers'], updatedManagers);

      // Update details cache if it exists
      queryClient.setQueryData(['line', lineId, 'details'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          managers: updatedManagers,
        };
      });

      return { previousManagers };
    },
    onError: (err, { lineId }, context: any) => {
      // Revert to previous state
      if (context?.previousManagers) {
        queryClient.setQueryData(['line', lineId, 'managers'], context.previousManagers);

        // Update details cache
        queryClient.setQueryData(['line', lineId, 'details'], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            managers: context.previousManagers,
          };
        });
      }
    },
    onSuccess: (result, { lineId }) => {
      // Fetch the latest data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['line', lineId, 'managers'] });
      queryClient.invalidateQueries({ queryKey: ['line', lineId, 'details'] });
    },
  });

  /**
   * Remove line manager mutation with optimistic updates
   */
  const removeManagerMutation = useMutation({
    mutationFn: ({ lineId, userId }: { lineId: string; userId: string }) =>
      removeLineManager(lineId, userId),
    onMutate: async ({ lineId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['line', lineId, 'managers'] });
      await queryClient.cancelQueries({ queryKey: ['line', lineId, 'details'] });

      //  Get previous managers
      const previousManagers = queryClient.getQueryData<any[]>(['line', lineId, 'managers']) || [];

      // Optimistically remove the manager
      const updatedManagers = previousManagers.filter(manager => manager.userId !== userId);
      queryClient.setQueryData(['line', lineId, 'managers'], updatedManagers);

      // Update details cache if it exists
      queryClient.setQueryData(['line', lineId, 'details'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          managers: updatedManagers,
        };
      });

      return { previousManagers };
    },
    onError: (err, { lineId }, context: any) => {
      // Revert to previous state
      if (context?.previousManagers) {
        queryClient.setQueryData(['line', lineId, 'managers'], context.previousManagers);

        // Update details cache
        queryClient.setQueryData(['line', lineId, 'details'], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            managers: context.previousManagers,
          };
        });
      }
    },
    onSuccess: (result, { lineId }) => {
      // Fetch the latest data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['line', lineId, 'managers'] });
      queryClient.invalidateQueries({ queryKey: ['line', lineId, 'details'] });
    },
  });

  /**
   * Update line manager mutation with optimistic updates
   */
  const updateManagerMutation = useMutation({
    mutationFn: ({
      lineId,
      userId,
      data,
    }: {
      lineId: string;
      userId: string;
      data: { isPrimary?: boolean; endDate?: Date | null };
    }) => {
      return updateLineManager(lineId, userId, data);
    },
    onMutate: async ({ lineId, userId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['line', lineId, 'managers'] });
      await queryClient.cancelQueries({ queryKey: ['line', lineId, 'details'] });

      // Get previous managers
      const previousManagers = queryClient.getQueryData<any[]>(['line', lineId, 'managers']) || [];

      // Optimistically update the manager
      const updatedManagers = previousManagers.map(manager => {
        if (manager.userId === userId) {
          return {
            ...manager,
            isPrimary: data.isPrimary !== undefined ? data.isPrimary : manager.isPrimary,
            endDate:
              data.endDate !== undefined
                ? data.endDate === null
                  ? null
                  : typeof data.endDate === 'string'
                    ? data.endDate
                    : data.endDate.toISOString()
                : manager.endDate,
            updatedAt: new Date().toISOString(),
            _optimistic: true,
          };
        }
        return manager;
      });

      queryClient.setQueryData(['line', lineId, 'managers'], updatedManagers);

      // Update details cache if it exists
      queryClient.setQueryData(['line', lineId, 'details'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          managers: updatedManagers,
        };
      });

      return { previousManagers };
    },
    onError: (err, { lineId }, context: any) => {
      // Revert to previous state
      if (context?.previousManagers) {
        queryClient.setQueryData(['line', lineId, 'managers'], context.previousManagers);

        // Update details cache
        queryClient.setQueryData(['line', lineId, 'details'], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            managers: context.previousManagers,
          };
        });
      }
    },
    onSuccess: (result, { lineId }) => {
      // Fetch the latest data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['line', lineId, 'managers'] });
      queryClient.invalidateQueries({ queryKey: ['line', lineId, 'details'] });
    },
  });

  /**
   * Batch delete lines mutation with optimized cache handling
   */
  const batchDeleteLinesMutation = useMutation({
    mutationFn: (lineIds: string[]) => batchDeleteLinesParallel(lineIds),
    onMutate: async lineIds => {
      // Store factory IDs to update later
      const factoryIds = new Set<string>();
      const snapshotData: {
        lineId: string;
        line: Line | undefined;
        factoryId: string | undefined;
      }[] = [];

      // Process each line
      for (const lineId of lineIds) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['line', lineId] });

        // Snapshot previous line data
        const previousLine = queryClient.getQueryData<Line>(['line', lineId]);
        const factoryId = previousLine?.factoryId;

        if (factoryId) {
          factoryIds.add(factoryId);
        }

        snapshotData.push({ lineId, line: previousLine, factoryId });

        // Remove from individual line cache
        queryClient.removeQueries({ queryKey: ['line', lineId] });
      }

      // For each factory, update its lines list
      Array.from(factoryIds).forEach(async factoryId => {
        // Cancel any outgoing factory lines refetches
        await queryClient.cancelQueries({
          queryKey: ['factory', factoryId, 'lines'],
        });

        // Snapshot previous factory lines
        const previousFactoryLines = queryClient.getQueryData<Line[]>([
          'factory',
          factoryId,
          'lines',
        ]);

        if (previousFactoryLines) {
          // Store for potential rollback
          snapshotData.push({
            lineId: 'factory-lines',
            line: undefined,
            factoryId,
            factoryLines: previousFactoryLines,
          } as any);

          // Optimistically update factory lines
          queryClient.setQueryData(
            ['factory', factoryId, 'lines'],
            previousFactoryLines.filter(line => !lineIds.includes(line.id)),
          );
        }
      });

      // Update global line list
      queryClient.setQueriesData({ queryKey: ['line-list'] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.filter((line: Line) => !lineIds.includes(line.id)),
          total: Math.max(0, (oldData.total || 0) - lineIds.length),
        };
      });

      return { snapshotData, factoryIds };
    },
    onError: (err, lineIds, context: any) => {
      // Restore all snapshot data
      if (context?.snapshotData) {
        for (const snapshot of context.snapshotData) {
          //  Restore individual line data
          if (snapshot.line) {
            queryClient.setQueryData(['line', snapshot.lineId], snapshot.line);
          }

          // Restore factory lines
          if (snapshot.factoryLines && snapshot.factoryId) {
            queryClient.setQueryData(
              ['factory', snapshot.factoryId, 'lines'],
              snapshot.factoryLines,
            );
          }
        }
      }

      // Restore lines list
      if (context?.snapshotData?.length) {
        queryClient.setQueriesData({ queryKey: ['line-list'] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          const linesToRestore = context.snapshotData
            .filter((snapshot: any) => snapshot.line)
            .map((snapshot: any) => snapshot.line);

          if (linesToRestore.length) {
            // Get the existing line IDs to avoid duplicates
            const existingIds = new Set(oldData.data.map((line: Line) => line.id));
            const newLinesToAdd = linesToRestore.filter((line: Line) => !existingIds.has(line.id));

            return {
              ...oldData,
              data: [...oldData.data, ...newLinesToAdd],
              total: (oldData.total || 0) + newLinesToAdd.length,
            };
          }

          return oldData;
        });
      }
    },
    onSettled: (data, error, lineIds, context) => {
      // Invalidate individual line queries
      for (const lineId of lineIds) {
        queryClient.invalidateQueries({ queryKey: ['line', lineId] });
      }

      // Invalidate factory line lists
      if (context?.factoryIds) {
        Array.from(context.factoryIds).forEach(factoryId => {
          queryClient.invalidateQueries({
            queryKey: ['factory', factoryId, 'lines'],
            refetchType: 'none', // Don't force refetch
          });
        });
      }

      // Update global line list without forcing refetch
      queryClient.invalidateQueries({
        queryKey: ['line-list'],
        refetchType: 'none',
      });
    },
  });

  /**
   * Safely invalidate line caches
   */
  const invalidateLineCaches = useCallback(
    async (lineId: string, options?: { forceRefetch?: boolean }) => {
      if (!lineId) return;

      const refetchType = options?.forceRefetch ? 'active' : 'none';

      // Invalidate line data
      await queryClient.invalidateQueries({
        queryKey: ['line', lineId],
        refetchType,
      });

      // Invalidate line details
      await queryClient.invalidateQueries({
        queryKey: ['line', lineId, 'details'],
        refetchType,
      });

      //  Invalidate line managers
      await queryClient.invalidateQueries({
        queryKey: ['line', lineId, 'managers'],
        refetchType,
      });

      // Get factory ID from cache if available
      const lineData = queryClient.getQueryData<Line>(['line', lineId]);

      if (lineData?.factoryId) {
        // Invalidate factory lines lists without forcing refetch
        await queryClient.invalidateQueries({
          queryKey: ['factory', lineData.factoryId, 'lines'],
          refetchType: 'none',
        });
      }

      // Invalidate line lists without forcing refetch
      await queryClient.invalidateQueries({
        queryKey: ['line-list'],
        refetchType: 'none',
      });
    },
    [queryClient],
  );

  return {
    //  Enhanced line mutations
    createLineMutation,
    updateLineMutation,
    deleteLineMutation,
    batchDeleteLinesMutation,

    // Legacy mutations (for backward compatibility)
    legacyCreateLineMutation: lineMutations.createMutation,
    legacyUpdateLineMutation: lineMutations.updateMutation,
    legacyDeleteLineMutation: lineMutations.deleteMutation,

    // Manager mutations
    addManagerMutation,
    removeManagerMutation,
    updateManagerMutation,

    //  Helper methods
    invalidateLineCaches,
  };
};
