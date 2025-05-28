import { UseQueryResult, useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useBaseQueries, BasePaginationParams, BaseResponseData } from '../base/useBaseQueries';

import {
  getTeamsList,
  getTeamById,
  getTeamLeaders,
  getTeamsByLine,
  getAccessibleTeams,
  checkCanManageTeam,
} from '@/apis/team/team.api';
import { Team, TeamCondDTO, TeamLeader } from '@/common/interface/team';
import { toast } from 'react-toast-kit';

/**
 * Interface for Team with additional details
 */
export interface TeamWithDetails extends Team {
  leaders: TeamLeader[];
  // Add additional related data here as needed
}

/**
 * Hook for Team queries with optimized cache handling
 */
export const useTeamQueries = () => {
  const queryClient = useQueryClient();

  /**
   * Handle query errors with toast notifications
   */
  const handleQueryError = useCallback((error: any, queryName: string) => {
    //  Extract message safely
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
      variant: 'error',
      duration: 3000,
    });
  }, []);

  // Use base hook for Team queries
  const teamQueries = useBaseQueries<Team, TeamCondDTO>(
    'team',
    getTeamsList,
    getTeamById,
    undefined,
    handleQueryError,
  );

  /**
   * Get team leaders with performance optimizations
   */
  const getLeadersByTeamId = (
    teamId?: string,
    options?: {
      enabled?: boolean;
      staleTime?: number;
      refetchOnWindowFocus?: boolean;
    },
  ): UseQueryResult<TeamLeader[], Error> => {
    return useQuery<TeamLeader[], Error>({
      queryKey: ['team', teamId, 'leaders'],
      queryFn: async () => {
        if (!teamId) throw new Error('Team ID is required');

        try {
          const leaders = await getTeamLeaders(teamId);

          // Transform string dates to Date objects
          return leaders.map(leader => ({
            ...leader,
            startDate: new Date(leader.startDate),
            endDate: leader.endDate ? new Date(leader.endDate) : null,
          }));
        } catch (error) {
          handleQueryError(error, 'quản lý tổ');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: !!teamId && options?.enabled !== false,
      staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
      refetchOnReconnect: false,
      refetchOnMount: true,
    });
  };

  /**
   * Get teams by line ID with optimized caching
   */
  const getTeamsByLineId = (
    lineId?: string,
    options?: {
      enabled?: boolean;
      staleTime?: number;
      refetchOnWindowFocus?: boolean;
      retry?: number | boolean;
      suspense?: boolean;
      placeholderData?: Team[] | (() => Team[]);
    },
  ): UseQueryResult<Team[], Error> => {
    return useQuery<Team[], Error>({
      queryKey: ['line', lineId, 'teams'],
      queryFn: async ({ signal }) => {
        if (!lineId) throw new Error('Line ID is required');

        try {
          return await getTeamsByLine(lineId);
        } catch (error) {
          if (
            error &&
            typeof error === 'object' &&
            'response' in error &&
            (error as any).response?.status === 404
          ) {
            throw new Error(`Không tìm thấy dây chuyền với ID: ${lineId}`);
          }
          handleQueryError(error, 'tổ của dây chuyền');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: !!lineId && options?.enabled !== false,

      // Optimized caching strategy
      staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes

      // Performance optimizations
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
      refetchOnReconnect: false,
      refetchOnMount: true,

      //Better error handling with retry logic
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
   * Get accessible teams with optimizations
   */
  const getAccessibleTeamsForUser = (options?: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    staleTime?: number;
  }): UseQueryResult<Team[], Error> => {
    return useQuery<Team[], Error>({
      queryKey: ['teams', 'accessible'],
      queryFn: async () => {
        try {
          return await getAccessibleTeams();
        } catch (error) {
          handleQueryError(error, 'tổ có quyền truy cập');
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
   * Check if user can manage team with better caching
   */
  const canManageTeam = (
    teamId?: string,
    options?: { enabled?: boolean; staleTime?: number },
  ): UseQueryResult<boolean, Error> => {
    return useQuery<boolean, Error>({
      queryKey: ['team', teamId, 'can-manage'],
      queryFn: async () => {
        if (!teamId) return false;
        try {
          return await checkCanManageTeam(teamId);
        } catch (error) {
          handleQueryError(error, 'quyền quản lý tổ');
          return false;
        }
      },
      enabled: !!teamId && options?.enabled !== false,
      staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  };

  /**
   * Get team with details - high performance implementation
   */
  const getTeamWithDetails = (
    teamId?: string,
    options?: {
      enabled?: boolean;
      includeLeaders?: boolean;
      refetchOnWindowFocus?: boolean;
      staleTime?: number;
    },
  ): UseQueryResult<Partial<TeamWithDetails>, Error> => {
    const includeLeaders = options?.includeLeaders !== false;

    return useQuery<Partial<TeamWithDetails>, Error>({
      queryKey: ['team', teamId, 'details', { includeLeaders }],
      queryFn: async () => {
        if (!teamId) throw new Error('Team ID is required');

        try {
          // Get basic team data
          const teamPromise = getTeamById(teamId);

          // If leaders requested, fetch them in parallel
          const leadersPromise = includeLeaders
            ? getTeamLeaders(teamId)
                .then(leaders =>
                  leaders.map(leader => ({
                    ...leader,
                    startDate: new Date(leader.startDate),
                    endDate: leader.endDate ? new Date(leader.endDate) : null,
                  })),
                )
                .catch(error => {
                  console.error('Error fetching team leaders:', error);
                  return [];
                })
            : Promise.resolve([]);

          // Wait for parallel requests to complete
          const [teamData, leadersData] = await Promise.all([teamPromise, leadersPromise]);

          // Combine into a single response
          const teamWithDetails: Partial<TeamWithDetails> = {
            ...teamData,
            leaders: includeLeaders ? leadersData : [],
          };

          // Cache individual data pieces for reuse
          if (includeLeaders) {
            queryClient.setQueryData(['team', teamId, 'leaders'], leadersData);
          }

          queryClient.setQueryData(['team', teamId], teamData);

          return teamWithDetails;
        } catch (error) {
          handleQueryError(error, 'chi tiết tổ');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: !!teamId && options?.enabled !== false,
      staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    });
  };

  /**
   * Smart invalidation that minimizes refetches
   */
  const invalidateTeamDetailsCache = useCallback(
    async (
      teamId: string,
      options?: {
        forceRefetch?: boolean;
      },
    ) => {
      if (!teamId) return;

      const refetchType = options?.forceRefetch ? 'active' : 'none';

      // Invalidate all team-related queries for this ID
      await queryClient.invalidateQueries({
        queryKey: ['team', teamId, 'details'],
        refetchType,
      });

      await queryClient.invalidateQueries({
        queryKey: ['team', teamId, 'leaders'],
        refetchType,
      });

      await queryClient.invalidateQueries({
        queryKey: ['team', teamId],
        refetchType,
      });

      //  Get team data to find line ID
      const teamData = queryClient.getQueryData<Team>(['team', teamId]);

      if (teamData && teamData.lineId) {
        // Invalidate line teams cache without forcing refetch
        await queryClient.invalidateQueries({
          queryKey: ['line', teamData.lineId, 'teams'],
          refetchType: 'none',
        });
      }

      // Mark team lists as stale, but don't refetch
      await queryClient.invalidateQueries({
        queryKey: ['team-list'],
        refetchType: 'none',
      });
    },
    [queryClient],
  );

  /**
   * Smart prefetching with deduplication
   */
  const prefetchTeamDetails = useCallback(
    async (
      teamId: string,
      options?: {
        includeLeaders?: boolean;
        staleTime?: number;
      },
    ) => {
      if (!teamId) return;

      const includeLeaders = options?.includeLeaders !== false;
      const staleTime = options?.staleTime || 5 * 60 * 1000;

      try {
        // Cache key for details query
        const detailsQueryKey: QueryKey = ['team', teamId, 'details', { includeLeaders }];

        // Check if we already have fresh data
        const cachedDetailsState = queryClient.getQueryState(detailsQueryKey);
        if (
          cachedDetailsState &&
          cachedDetailsState.data &&
          cachedDetailsState.dataUpdatedAt > Date.now() - staleTime
        ) {
          // Data is fresh, no need to prefetch
          return;
        }

        // Prefetch team details
        await queryClient.prefetchQuery({
          queryKey: detailsQueryKey,
          queryFn: async () => {
            //  Fetch in parallel for better performance
            const [teamData, leadersData] = await Promise.all([
              getTeamById(teamId),
              includeLeaders
                ? getTeamLeaders(teamId)
                    .then(leaders =>
                      leaders.map(leader => ({
                        ...leader,
                        startDate: new Date(leader.startDate),
                        endDate: leader.endDate ? new Date(leader.endDate) : null,
                      })),
                    )
                    .catch(() => [])
                : Promise.resolve([]),
            ]);

            const result: Partial<TeamWithDetails> = {
              ...teamData,
              leaders: leadersData,
            };

            // Update individual caches for component queries
            queryClient.setQueryData(['team', teamId], teamData);

            if (includeLeaders) {
              queryClient.setQueryData(['team', teamId, 'leaders'], leadersData);
            }

            return result;
          },
          staleTime,
        });
      } catch (error) {
        console.error('Error prefetching team details:', error);
      }
    },
    [queryClient],
  );

  /**
   * Invalidate leaders cache optimized
   */
  const invalidateLeadersCache = useCallback(
    async (teamId: string, forceRefetch = false) => {
      if (!teamId) return;

      const refetchType = forceRefetch ? 'active' : 'none';

      // Only invalidate the specific leaders cache
      await queryClient.invalidateQueries({
        queryKey: ['team', teamId, 'leaders'],
        refetchType,
      });

      // Also invalidate related details cache but don't force refetch
      await queryClient.invalidateQueries({
        queryKey: ['team', teamId, 'details'],
        refetchType: 'none',
      });
    },
    [queryClient],
  );

  /**
   * Prefetch team leaders for smoother UX
   */
  const prefetchTeamLeaders = useCallback(
    async (teamId: string) => {
      if (!teamId) return;

      // Check if already in cache
      const cachedLeaders = queryClient.getQueryData(['team', teamId, 'leaders']);
      if (cachedLeaders) return;

      // Prefetch leaders
      await queryClient.prefetchQuery({
        queryKey: ['team', teamId, 'leaders'],
        queryFn: () => getTeamLeaders(teamId),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient],
  );

  /**
   * Prefetch team list with specific parameters
   */
  const prefetchTeamList = useCallback(
    async (params?: TeamCondDTO & BasePaginationParams) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['team-list', params],
          queryFn: () => getTeamsList(params || { page: 1, limit: 10 }),
          staleTime: 5 * 60 * 1000,
        });
      } catch (error) {
        console.error('Error prefetching team list:', error);
      }
    },
    [queryClient],
  );

  /**
   * Update team data in cache
   */
  const updateTeamCache = useCallback(
    (teamId: string, updatedData: Partial<Team>) => {
      // Don't update if no ID
      if (!teamId) return;

      // Update basic team data
      queryClient.setQueryData(['team', teamId], (oldData: Team | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          ...updatedData,
          updatedAt: new Date().toISOString(),
        };
      });

      // Get line ID from existing data or updated data
      const existingData = queryClient.getQueryData<Team>(['team', teamId]);
      const lineId = updatedData.lineId || existingData?.lineId;

      if (lineId) {
        // Update team in line teams list
        queryClient.setQueriesData<Team[]>({ queryKey: ['line', lineId, 'teams'] }, oldData => {
          if (!oldData) return oldData;

          return oldData.map((team: Team) =>
            team.id === teamId
              ? { ...team, ...updatedData, updatedAt: new Date().toISOString() }
              : team,
          );
        });
      }

      // Update team in lists
      queryClient.setQueriesData(
        { queryKey: ['team-list'] },
        (oldData: BaseResponseData<Team> | undefined) => {
          if (!oldData || !oldData.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((team: Team) =>
              team.id === teamId
                ? { ...team, ...updatedData, updatedAt: new Date().toISOString() }
                : team,
            ),
          };
        },
      );

      //  Update team in details view
      queryClient.setQueryData(
        ['team', teamId, 'details'],
        (oldData: Partial<TeamWithDetails> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            ...updatedData,
            updatedAt: new Date().toISOString(),
          };
        },
      );
    },
    [queryClient],
  );

  /**
   * Batch prefetch multiple teams
   */
  const batchPrefetchTeams = useCallback(
    async (teamIds: string[], includeLeaders = false) => {
      if (!teamIds || teamIds.length === 0) return;

      // Limit concurrency to avoid overwhelming the server
      const batchSize = 3;

      for (let i = 0; i < teamIds.length; i += batchSize) {
        const batch = teamIds.slice(i, i + batchSize);

        // Create a batch of promises but limit concurrency
        await Promise.all(batch.map(id => prefetchTeamDetails(id, { includeLeaders })));

        // Small delay between batches to be nice to the server
        if (i + batchSize < teamIds.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    },
    [prefetchTeamDetails],
  );

  const prefetchTeamsByLine = useCallback(
    async (lineId: string, options?: { staleTime?: number }) => {
      if (!lineId) return;

      // Check if we already have fresh data
      const queryKey = ['line', lineId, 'teams'];
      const cachedState = queryClient.getQueryState(queryKey);
      const staleTime = options?.staleTime || 5 * 60 * 1000;

      if (cachedState?.data && cachedState.dataUpdatedAt > Date.now() - staleTime) {
        // Data is fresh, no need to prefetch
        return;
      }

      // Prefetch teams for this line
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: () => getTeamsByLine(lineId),
        staleTime,
      });
    },
    [queryClient],
  );

  // Return object with added queryClient and fetchQuery methods for direct use
  return {
    // Base team queries
    ...teamQueries,
    listTeams: teamQueries.listItems,

    // Additional specialized queries
    getLeadersByTeamId,
    getTeamsByLineId,
    getAccessibleTeamsForUser,
    canManageTeam,
    getTeamWithDetails,

    // Cache management
    invalidateTeamDetailsCache,
    prefetchTeamDetails,
    invalidateLeadersCache,
    prefetchTeamLeaders,
    prefetchTeamList,
    updateTeamCache,
    batchPrefetchTeams,
    prefetchTeamsByLine,

    // Expose queryClient and internal methods needed by TeamContext
    queries: queryClient,
    fetchQuery: queryClient.fetchQuery,
  };
};
