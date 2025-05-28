import {useCallback} from 'react';

import {useQueryClient, useMutation} from '@tanstack/react-query';

import {
  Team,
  TeamCreateDTO,
  TeamUpdateDTO,
  TeamLeaderDTO,
} from '@/common/interface/team';

import {
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamLeader,
  removeTeamLeader,
  updateTeamLeader,
  batchDeleteTeamsParallel,
} from '@/apis/team/team.api';

import {useBaseMutations} from '../base/useBaseMutations';
import {BaseResponseData} from '../base/useBaseQueries';
import {TeamWithDetails} from './useTeamQueries';

/**
 * Hook for Team mutations with optimized cache handling
 */
export const useTeamMutations = () => {
  const queryClient = useQueryClient();

  Base team mutations using useBaseMutations
  const teamMutations = useBaseMutations<Team, TeamCreateDTO, TeamUpdateDTO>(
    'team',
    createTeam,
    updateTeam,
    deleteTeam,
  );

  /**
   * Enhanced create team mutation with optimistic updates
   */
  const createTeamMutation = useMutation({
    mutationFn: (data: TeamCreateDTO) => createTeam(data),
    onSuccess: (newTeam, variables) => {
      Get line ID from the mutation data
      const lineId = variables.lineId;

      Invalidate relevant caches
      queryClient.invalidateQueries({queryKey: ['line', lineId, 'teams']});
      queryClient.invalidateQueries({queryKey: ['team-list']});
    },
  });

  /**
   * Enhanced update team mutation with optimistic updates
   */
  const updateTeamMutation = useMutation({
    mutationFn: (data: TeamUpdateDTO & {id: string}) =>
      updateTeam(data.id, data),
    onMutate: async data => {
      Cancel any outgoing refetches
      await queryClient.cancelQueries({queryKey: ['team', data.id]});

      Snapshot previous values
      const previousTeam = queryClient.getQueryData<Team>(['team', data.id]);

      Optimistically update the cache
      if (previousTeam) {
        const updatedTeam = {
          ...previousTeam,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        Update individual team cache
        queryClient.setQueryData(['team', data.id], updatedTeam);

        Update team in line teams list
        if (previousTeam.lineId) {
          queryClient.setQueriesData(
            {queryKey: ['line', previousTeam.lineId, 'teams']},
            (oldData: Team[] | undefined) => {
              if (!oldData) return oldData;

              return oldData.map((team: Team) =>
                team.id === data.id ? updatedTeam : team,
              );
            },
          );
        }

        Update team in lists
        queryClient.setQueriesData(
          {queryKey: ['team-list']},
          (oldData: any) => {
            if (!oldData || !oldData.data) return oldData;

            return {
              ...oldData,
              data: oldData.data.map((team: Team) =>
                team.id === data.id ? updatedTeam : team,
              ),
            };
          },
        );
      }

      return {previousTeam};
    },
    onError: (err, data, context: any) => {
      If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTeam) {
        queryClient.setQueryData(['team', data.id], context.previousTeam);

        Roll back team in line teams list
        if (context.previousTeam.lineId) {
          queryClient.setQueriesData(
            {queryKey: ['line', context.previousTeam.lineId, 'teams']},
            (oldData: Team[] | undefined) => {
              if (!oldData) return oldData;

              return oldData.map((team: Team) =>
                team.id === data.id ? context.previousTeam : team,
              );
            },
          );
        }

        Roll back team in lists
        queryClient.setQueriesData(
          {queryKey: ['team-list']},
          (oldData: any) => {
            if (!oldData || !oldData.data) return oldData;

            return {
              ...oldData,
              data: oldData.data.map((team: Team) =>
                team.id === data.id ? context.previousTeam : team,
              ),
            };
          },
        );
      }
    },
    onSettled: (result, error, data) => {
      Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({queryKey: ['team', data.id]});

      Get line ID from cache if available
      const teamData = queryClient.getQueryData<Team>(['team', data.id]);

      If we have line ID, invalidate line teams
      if (teamData?.lineId) {
        queryClient.invalidateQueries({
          queryKey: ['line', teamData.lineId, 'teams'],
          refetchType: 'none', // Don't force refetch
        });
      }

      Also update the team in list without forcing refetch
      queryClient.invalidateQueries({
        queryKey: ['team-list'],
        refetchType: 'none',
      });
    },
  });

  /**
   * Enhanced delete team mutation with optimistic updates
   */
  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) => deleteTeam(teamId),
    onMutate: async teamId => {
      Cancel any outgoing refetches
      await queryClient.cancelQueries({queryKey: ['team', teamId]});

      Snapshot previous values
      const previousTeam = queryClient.getQueryData<Team>(['team', teamId]);
      const lineId = previousTeam?.lineId;

      If we have line ID, optimistically remove from line's teams list
      if (lineId) {
        Cancel any outgoing line teams refetches
        await queryClient.cancelQueries({queryKey: ['line', lineId, 'teams']});

        Snapshot previous line teams
        const previousLineTeams = queryClient.getQueryData<Team[]>([
          'line',
          lineId,
          'teams',
        ]);

        Optimistically update the cache
        if (previousLineTeams) {
          queryClient.setQueryData(
            ['line', lineId, 'teams'],
            previousLineTeams.filter(team => team.id !== teamId),
          );
        }

        Also update the teams list if it exists
        queryClient.setQueriesData(
          {queryKey: ['team-list']},
          (oldData: any) => {
            if (!oldData || !oldData.data) return oldData;

            return {
              ...oldData,
              data: oldData.data.filter((team: Team) => team.id !== teamId),
              total: oldData.total ? Math.max(0, oldData.total - 1) : undefined,
            };
          },
        );

        Remove from individual team cache
        queryClient.removeQueries({queryKey: ['team', teamId]});

        return {previousTeam, previousLineTeams, lineId};
      }

      return {previousTeam};
    },
    onError: (err, teamId, context: any) => {
      If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTeam) {
        queryClient.setQueryData(['team', teamId], context.previousTeam);
      }

      if (context?.lineId && context?.previousLineTeams) {
        queryClient.setQueryData(
          ['line', context.lineId, 'teams'],
          context.previousLineTeams,
        );
      }

      Roll back teams list if needed
      if (context?.previousTeam) {
        queryClient.setQueriesData(
          {queryKey: ['team-list']},
          (oldData: any) => {
            if (!oldData || !oldData.data) return oldData;

            Check if team exists in the current data
            const teamExists = oldData.data.some(
              (team: Team) => team.id === teamId,
            );

            if (!teamExists) {
              return {
                ...oldData,
                data: [...oldData.data, context.previousTeam],
                total: (oldData.total || 0) + 1,
              };
            }

            return oldData;
          },
        );
      }
    },
    onSettled: (result, error, teamId, context) => {
      Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({queryKey: ['team', teamId]});

      If we have line ID, invalidate line teams
      if (context?.lineId) {
        queryClient.invalidateQueries({
          queryKey: ['line', context.lineId, 'teams'],
          refetchType: 'none', // Don't force refetch
        });
      }

      Also update the team list without forcing refetch
      queryClient.invalidateQueries({
        queryKey: ['team-list'],
        refetchType: 'none',
      });
    },
  });

  /**
   * Add team leader mutation with optimistic updates
   */
  const addLeaderMutation = useMutation({
    mutationFn: ({
      teamId,
      leaderDTO,
    }: {
      teamId: string;
      leaderDTO: TeamLeaderDTO;
    }) => addTeamLeader(teamId, leaderDTO),
    onMutate: async ({teamId, leaderDTO}) => {
      Cancel outgoing refetches
      await queryClient.cancelQueries({queryKey: ['team', teamId, 'leaders']});
      await queryClient.cancelQueries({queryKey: ['team', teamId, 'details']});

      Get previous leaders
      const previousLeaders =
        queryClient.getQueryData<any[]>(['team', teamId, 'leaders']) || [];

      Create optimistic new leader
      const optimisticLeader: any = {
        userId: leaderDTO.userId,
        teamId: teamId,
        isPrimary: leaderDTO.isPrimary || false,
        startDate:
          typeof leaderDTO.startDate === 'string'
            ? leaderDTO.startDate
            : leaderDTO.startDate.toISOString(),
        endDate: leaderDTO.endDate
          ? typeof leaderDTO.endDate === 'string'
            ? leaderDTO.endDate
            : leaderDTO.endDate.toISOString()
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _optimistic: true, // Mark as optimistic
      };

      Update leaders cache
      const updatedLeaders = [...previousLeaders, optimisticLeader];
      queryClient.setQueryData(['team', teamId, 'leaders'], updatedLeaders);

      Update details cache if it exists
      queryClient.setQueryData(['team', teamId, 'details'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          leaders: updatedLeaders,
        };
      });

      return {previousLeaders};
    },
    onError: (err, {teamId}, context: any) => {
      Revert to previous state
      if (context?.previousLeaders) {
        queryClient.setQueryData(
          ['team', teamId, 'leaders'],
          context.previousLeaders,
        );

        Update details cache
        queryClient.setQueryData(
          ['team', teamId, 'details'],
          (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              leaders: context.previousLeaders,
            };
          },
        );
      }
    },
    onSuccess: (result, {teamId}) => {
      Fetch the latest data after successful mutation
      queryClient.invalidateQueries({queryKey: ['team', teamId, 'leaders']});
      queryClient.invalidateQueries({queryKey: ['team', teamId, 'details']});
    },
  });

  /**
   * Remove team leader mutation with optimistic updates
   */
  const removeLeaderMutation = useMutation({
    mutationFn: ({teamId, userId}: {teamId: string; userId: string}) =>
      removeTeamLeader(teamId, userId),
    onMutate: async ({teamId, userId}) => {
      Cancel outgoing refetches
      await queryClient.cancelQueries({queryKey: ['team', teamId, 'leaders']});
      await queryClient.cancelQueries({queryKey: ['team', teamId, 'details']});

      Get previous leaders
      const previousLeaders =
        queryClient.getQueryData<any[]>(['team', teamId, 'leaders']) || [];

      Optimistically remove the leader
      const updatedLeaders = previousLeaders.filter(
        leader => leader.userId !== userId,
      );
      queryClient.setQueryData(['team', teamId, 'leaders'], updatedLeaders);

      Update details cache if it exists
      queryClient.setQueryData(['team', teamId, 'details'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          leaders: updatedLeaders,
        };
      });

      return {previousLeaders};
    },
    onError: (err, {teamId}, context: any) => {
      Revert to previous state
      if (context?.previousLeaders) {
        queryClient.setQueryData(
          ['team', teamId, 'leaders'],
          context.previousLeaders,
        );

        Update details cache
        queryClient.setQueryData(
          ['team', teamId, 'details'],
          (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              leaders: context.previousLeaders,
            };
          },
        );
      }
    },
    onSuccess: (result, {teamId}) => {
      Fetch the latest data after successful mutation
      queryClient.invalidateQueries({queryKey: ['team', teamId, 'leaders']});
      queryClient.invalidateQueries({queryKey: ['team', teamId, 'details']});
    },
  });

  /**
   * Update team leader mutation with optimistic updates
   */
  const updateLeaderMutation = useMutation({
    mutationFn: ({
      teamId,
      userId,
      data,
    }: {
      teamId: string;
      userId: string;
      data: {isPrimary?: boolean; endDate?: Date | null};
    }) => {
      return updateTeamLeader(teamId, userId, data);
    },
    onMutate: async ({teamId, userId, data}) => {
      Cancel outgoing refetches
      await queryClient.cancelQueries({queryKey: ['team', teamId, 'leaders']});
      await queryClient.cancelQueries({queryKey: ['team', teamId, 'details']});

      Get previous leaders
      const previousLeaders =
        queryClient.getQueryData<any[]>(['team', teamId, 'leaders']) || [];

      Optimistically update the leader
      const updatedLeaders = previousLeaders.map(leader => {
        if (leader.userId === userId) {
          return {
            ...leader,
            isPrimary:
              data.isPrimary !== undefined ? data.isPrimary : leader.isPrimary,
            endDate:
              data.endDate !== undefined
                ? data.endDate === null
                  ? null
                  : typeof data.endDate === 'string'
                    ? data.endDate
                    : data.endDate.toISOString()
                : leader.endDate,
            updatedAt: new Date().toISOString(),
            _optimistic: true,
          };
        }
        return leader;
      });

      queryClient.setQueryData(['team', teamId, 'leaders'], updatedLeaders);

      Update details cache if it exists
      queryClient.setQueryData(['team', teamId, 'details'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          leaders: updatedLeaders,
        };
      });

      return {previousLeaders};
    },
    onError: (err, {teamId}, context: any) => {
      Revert to previous state
      if (context?.previousLeaders) {
        queryClient.setQueryData(
          ['team', teamId, 'leaders'],
          context.previousLeaders,
        );

        Update details cache
        queryClient.setQueryData(
          ['team', teamId, 'details'],
          (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              leaders: context.previousLeaders,
            };
          },
        );
      }
    },
    onSuccess: (result, {teamId}) => {
      Fetch the latest data after successful mutation
      queryClient.invalidateQueries({queryKey: ['team', teamId, 'leaders']});
      queryClient.invalidateQueries({queryKey: ['team', teamId, 'details']});
    },
  });

  /**
   * Batch delete teams mutation with optimized cache handling
   */
  const batchDeleteTeamsMutation = useMutation({
    mutationFn: (teamIds: string[]) => batchDeleteTeamsParallel(teamIds),
    onMutate: async teamIds => {
      Store line IDs to update later
      const lineIds = new Set<string>();
      const snapshotData: {
        teamId: string;
        team: Team | undefined;
        lineId: string | undefined;
      }[] = [];

      Process each team
      for (const teamId of teamIds) {
        Cancel any outgoing refetches
        await queryClient.cancelQueries({queryKey: ['team', teamId]});

        Snapshot previous team data
        const previousTeam = queryClient.getQueryData<Team>(['team', teamId]);
        const lineId = previousTeam?.lineId;

        if (lineId) {
          lineIds.add(lineId);
        }

        snapshotData.push({teamId, team: previousTeam, lineId});

        Remove from individual team cache
        queryClient.removeQueries({queryKey: ['team', teamId]});
      }

      For each line, update its teams list
      Array.from(lineIds).forEach(async lineId => {
        Cancel any outgoing line teams refetches
        await queryClient.cancelQueries({queryKey: ['line', lineId, 'teams']});

        Snapshot previous line teams
        const previousLineTeams = queryClient.getQueryData<Team[]>([
          'line',
          lineId,
          'teams',
        ]);

        if (previousLineTeams) {
          Store for potential rollback
          snapshotData.push({
            teamId: 'line-teams',
            team: undefined,
            lineId,
            lineTeams: previousLineTeams,
          } as any);

          Optimistically update line teams
          queryClient.setQueryData(
            ['line', lineId, 'teams'],
            previousLineTeams.filter(team => !teamIds.includes(team.id)),
          );
        }
      });

      Update global team list
      queryClient.setQueriesData({queryKey: ['team-list']}, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.filter((team: Team) => !teamIds.includes(team.id)),
          total: Math.max(0, (oldData.total || 0) - teamIds.length),
        };
      });

      return {snapshotData, lineIds};
    },
    onError: (err, teamIds, context: any) => {
      Restore all snapshot data
      if (context?.snapshotData) {
        for (const snapshot of context.snapshotData) {
          Restore individual team data
          if (snapshot.team) {
            queryClient.setQueryData(['team', snapshot.teamId], snapshot.team);
          }

          Restore line teams
          if (snapshot.lineTeams && snapshot.lineId) {
            queryClient.setQueryData(
              ['line', snapshot.lineId, 'teams'],
              snapshot.lineTeams,
            );
          }
        }
      }

      Restore teams list
      if (context?.snapshotData?.length) {
        queryClient.setQueriesData(
          {queryKey: ['team-list']},
          (oldData: any) => {
            if (!oldData || !oldData.data) return oldData;

            const teamsToRestore = context.snapshotData
              .filter((snapshot: any) => snapshot.team)
              .map((snapshot: any) => snapshot.team);

            if (teamsToRestore.length) {
              Get the existing team IDs to avoid duplicates
              const existingIds = new Set(
                oldData.data.map((team: Team) => team.id),
              );
              const newTeamsToAdd = teamsToRestore.filter(
                (team: Team) => !existingIds.has(team.id),
              );

              return {
                ...oldData,
                data: [...oldData.data, ...newTeamsToAdd],
                total: (oldData.total || 0) + newTeamsToAdd.length,
              };
            }

            return oldData;
          },
        );
      }
    },
    onSettled: (data, error, teamIds, context) => {
      Invalidate individual team queries
      for (const teamId of teamIds) {
        queryClient.invalidateQueries({queryKey: ['team', teamId]});
      }

      Invalidate line team lists
      if (context?.lineIds) {
        Array.from(context.lineIds).forEach(lineId => {
          queryClient.invalidateQueries({
            queryKey: ['line', lineId, 'teams'],
            refetchType: 'none', // Don't force refetch
          });
        });
      }

      Update global team list without forcing refetch
      queryClient.invalidateQueries({
        queryKey: ['team-list'],
        refetchType: 'none',
      });
    },
  });

  /**
   * Safely invalidate team caches
   */
  const invalidateTeamCaches = useCallback(
    async (teamId: string, options?: {forceRefetch?: boolean}) => {
      if (!teamId) return;

      const refetchType = options?.forceRefetch ? 'active' : 'none';

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['team', teamId],
          refetchType,
        }),
        queryClient.invalidateQueries({
          queryKey: ['team', teamId, 'details'],
          refetchType,
        }),
        queryClient.invalidateQueries({
          queryKey: ['team', teamId, 'leaders'],
          refetchType,
        }),
      ]);

      Get line ID from cache if available
      const teamData = queryClient.getQueryData<Team>(['team', teamId]);

      if (teamData?.lineId) {
        Invalidate line teams lists without forcing refetch
        await queryClient.invalidateQueries({
          queryKey: ['line', teamData.lineId, 'teams'],
          refetchType: 'none',
        });
      }

      Invalidate team lists without forcing refetch
      await queryClient.invalidateQueries({
        queryKey: ['team-list'],
        refetchType: 'none',
      });
    },
    [queryClient],
  );

  return {
    Enhanced team mutations
    createTeamMutation,
    updateTeamMutation,
    deleteTeamMutation,
    batchDeleteTeamsMutation,

    Legacy mutations (for backward compatibility)
    legacyCreateTeamMutation: teamMutations.createMutation,
    legacyUpdateTeamMutation: teamMutations.updateMutation,
    legacyDeleteTeamMutation: teamMutations.deleteMutation,

    Leader mutations
    addLeaderMutation,
    removeLeaderMutation,
    updateLeaderMutation,

    Helper methods
    invalidateTeamCaches,
  };
};
