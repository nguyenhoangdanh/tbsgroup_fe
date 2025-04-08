import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { Team, TeamCreateDTO, TeamUpdateDTO, TeamLeader, TeamLeaderDTO, TeamCondDTO } from '@/common/interface/team';
import { BasePaginationParams, BaseResponseData } from '@/hooks/base/useBaseQueries';
import { toast } from '@/hooks/use-toast';
import { useTeamQueries } from './useTeamQueries';
import { useTeamMutations } from './useTeamMutations';
import { getTeamById, getTeamsList } from '@/apis/team/team.api'; // Import trực tiếp từ API
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

// Define the context shape
interface TeamContextType {
    // State
    selectedTeam: Team | null;
    selectedTeamId: string | null;
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;

    // Team actions
    selectTeam: (team: Team | null) => void;
    selectTeamById: (id: string | null) => Promise<void>;
    createTeam: (data: TeamCreateDTO) => Promise<string | null>;
    updateTeam: (id: string, data: TeamUpdateDTO) => Promise<boolean>;
    deleteTeam: (id: string) => Promise<boolean>;
    batchDeleteTeams: (ids: string[]) => Promise<boolean>;

    // Team data fetching
    getTeam: (id: string) => Promise<Team | null>;
    getTeamWithDetails: (id: string, includeLeaders?: boolean) => Promise<Team | null>;
    getTeamsByLine: (lineId: string) => Promise<Team[]>;
    listTeams: (params: TeamCondDTO & BasePaginationParams) => Promise<BaseResponseData<Team> | undefined>;
    getAccessibleTeams: () => Promise<Team[]>;
    getAllTeams: () => UseQueryResult<Team[], Error>;

    // Team leaders management
    getTeamLeaders: (teamId: string) => Promise<TeamLeader[]>;
    addTeamLeader: (teamId: string, leaderDTO: TeamLeaderDTO) => Promise<boolean>;
    updateTeamLeader: (teamId: string, userId: string, data: { isPrimary?: boolean; endDate?: Date | null }) => Promise<boolean>;
    removeTeamLeader: (teamId: string, userId: string) => Promise<boolean>;

    // Cache management
    invalidateTeamCache: (teamId: string, forceRefetch?: boolean) => Promise<void>;
    prefetchTeamDetails: (teamId: string, includeLeaders?: boolean) => Promise<void>;

    // Direct access to queries for more complex use cases
    queries: ReturnType<typeof useTeamQueries>;
    mutations: ReturnType<typeof useTeamMutations>;
}

// Create the context
const TeamContext = createContext<TeamContextType | undefined>(undefined);

// Provider component
interface TeamProviderProps {
    children: ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ children }) => {
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    // Initialize hooks
    const teamQueries = useTeamQueries();
    const teamMutations = useTeamMutations();

    // Destructure the needed queries and mutations
    const {
        listTeams,
        getTeamWithDetails,
        getTeamsByLineId,
        getLeadersByTeamId,
        getAccessibleTeamsForUser,
        invalidateTeamDetailsCache,
        prefetchTeamDetails: prefetchDetails,
        queries, // QueryClient exposed by useTeamQueries
        fetchQuery
    } = teamQueries;

    const {
        createTeamMutation,
        updateTeamMutation,
        deleteTeamMutation,
        batchDeleteTeamsMutation,
        addLeaderMutation,
        updateLeaderMutation,
        removeLeaderMutation,
        invalidateTeamCaches
    } = teamMutations;

    // Mutation loading states
    const isCreating = createTeamMutation.isPending;
    const isUpdating = updateTeamMutation.isPending;
    const isDeleting = deleteTeamMutation.isPending || batchDeleteTeamsMutation.isPending;
    const isLoading = isCreating || isUpdating || isDeleting;

    // Team selection
    const selectTeam = useCallback((team: Team | null) => {
        setSelectedTeam(team);
        setSelectedTeamId(team?.id || null);
    }, []);

    // Get a single team by ID
    const getTeam = useCallback(async (id: string): Promise<Team | null> => {
        try {
            // Use the queryClient directly through teamQueries to get cached data or fetch if needed
            const queryKey = ['team', id];
            const cachedTeam = queries.getQueryData<Team>(queryKey);

            if (cachedTeam) {
                return cachedTeam;
            }

            // Fetch the team data directly using the imported API function
            const team = await fetchQuery({
                queryKey,
                queryFn: () => getTeamById(id)
            });

            return team || null;
        } catch (error) {
            console.error('Error fetching team:', error);
            toast({
                title: 'Không thể tải thông tin tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải thông tin tổ',
                variant: 'destructive',
            });
            return null;
        }
    }, [queries, fetchQuery]);

    const selectTeamById = useCallback(async (id: string | null) => {
        if (!id) {
            setSelectedTeam(null);
            setSelectedTeamId(null);
            return;
        }

        setSelectedTeamId(id);
        try {
            const team = await getTeam(id);
            setSelectedTeam(team);
        } catch (error) {
            console.error('Error selecting team by ID:', error);
            toast({
                title: 'Không thể tải thông tin tổ',
                description: 'Đã xảy ra lỗi khi tải thông tin tổ',
                variant: 'destructive',
            });
        }
    }, [getTeam]);

    // Team mutations with error handling
    const createTeam = useCallback(async (data: TeamCreateDTO): Promise<string | null> => {
        try {
            const result = await createTeamMutation.mutateAsync(data);
            if (result?.id) {
                toast({
                    title: 'Thành công',
                    description: 'Đã tạo tổ mới thành công',
                    variant: 'default',
                });
                return result.id;
            }
            return null;
        } catch (error) {
            console.error('Error creating team:', error);
            toast({
                title: 'Không thể tạo tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tạo tổ mới',
                variant: 'destructive',
            });
            return null;
        }
    }, [createTeamMutation]);

    const updateTeam = useCallback(async (id: string, data: TeamUpdateDTO): Promise<boolean> => {
        try {
            await updateTeamMutation.mutateAsync({ id, ...data });
            toast({
                title: 'Thành công',
                description: 'Đã cập nhật thông tin tổ thành công',
                variant: 'default',
            });

            // Update selected team if it's the one being updated
            if (selectedTeamId === id) {
                const updated = await getTeam(id);
                setSelectedTeam(updated);
            }

            return true;
        } catch (error) {
            console.error('Error updating team:', error);
            toast({
                title: 'Không thể cập nhật tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi cập nhật thông tin tổ',
                variant: 'destructive',
            });
            return false;
        }
    }, [updateTeamMutation, selectedTeamId, getTeam]);

    const deleteTeam = useCallback(async (id: string): Promise<boolean> => {
        try {
            await deleteTeamMutation.mutateAsync(id);
            toast({
                title: 'Thành công',
                description: 'Đã xóa tổ thành công',
                variant: 'default',
            });

            // Clear selected team if it's the one being deleted
            if (selectedTeamId === id) {
                setSelectedTeam(null);
                setSelectedTeamId(null);
            }

            return true;
        } catch (error) {
            console.error('Error deleting team:', error);
            toast({
                title: 'Không thể xóa tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa tổ',
                variant: 'destructive',
            });
            return false;
        }
    }, [deleteTeamMutation, selectedTeamId]);

    const batchDeleteTeams = useCallback(async (ids: string[]): Promise<boolean> => {
        try {
            await batchDeleteTeamsMutation.mutateAsync(ids);
            toast({
                title: 'Thành công',
                description: `Đã xóa ${ids.length} tổ thành công`,
                variant: 'default',
            });

            // Clear selected team if it's among those being deleted
            if (selectedTeamId && ids.includes(selectedTeamId)) {
                setSelectedTeam(null);
                setSelectedTeamId(null);
            }

            return true;
        } catch (error) {
            console.error('Error batch deleting teams:', error);
            toast({
                title: 'Không thể xóa các tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa các tổ',
                variant: 'destructive',
            });
            return false;
        }
    }, [batchDeleteTeamsMutation, selectedTeamId]);

    // Team leader mutations
    const getTeamLeaders = useCallback(async (teamId: string): Promise<TeamLeader[]> => {
        try {
            // Use the queryClient directly through teamQueries
            const queryKey = ['team', teamId, 'leaders'];
            const cachedLeaders = queries.getQueryData<TeamLeader[]>(queryKey);

            if (cachedLeaders) {
                return cachedLeaders;
            }

            // Fetch leaders data
            const leaders = await fetchQuery({
                queryKey,
                queryFn: () => getLeadersByTeamId(teamId).data
            });

            return leaders || [];
        } catch (error) {
            console.error('Error fetching team leaders:', error);
            toast({
                title: 'Không thể tải danh sách tổ trưởng',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách tổ trưởng',
                variant: 'destructive',
            });
            return [];
        }
    }, [queries, fetchQuery, getLeadersByTeamId]);

    const addTeamLeader = useCallback(async (teamId: string, leaderDTO: TeamLeaderDTO): Promise<boolean> => {
        try {
            await addLeaderMutation.mutateAsync({ teamId, leaderDTO });
            toast({
                title: 'Thành công',
                description: 'Đã thêm tổ trưởng thành công',
                variant: 'default',
            });
            return true;
        } catch (error) {
            console.error('Error adding team leader:', error);
            toast({
                title: 'Không thể thêm tổ trưởng',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi thêm tổ trưởng',
                variant: 'destructive',
            });
            return false;
        }
    }, [addLeaderMutation]);

    const updateTeamLeader = useCallback(async (
        teamId: string,
        userId: string,
        data: { isPrimary?: boolean; endDate?: Date | null }
    ): Promise<boolean> => {
        try {
            await updateLeaderMutation.mutateAsync({ teamId, userId, data });
            toast({
                title: 'Thành công',
                description: 'Đã cập nhật thông tin tổ trưởng thành công',
                variant: 'default',
            });
            return true;
        } catch (error) {
            console.error('Error updating team leader:', error);
            toast({
                title: 'Không thể cập nhật tổ trưởng',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi cập nhật thông tin tổ trưởng',
                variant: 'destructive',
            });
            return false;
        }
    }, [updateLeaderMutation]);

    const removeTeamLeader = useCallback(async (teamId: string, userId: string): Promise<boolean> => {
        try {
            await removeLeaderMutation.mutateAsync({ teamId, userId });
            toast({
                title: 'Thành công',
                description: 'Đã xóa tổ trưởng thành công',
                variant: 'default',
            });
            return true;
        } catch (error) {
            console.error('Error removing team leader:', error);
            toast({
                title: 'Không thể xóa tổ trưởng',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa tổ trưởng',
                variant: 'destructive',
            });
            return false;
        }
    }, [removeLeaderMutation]);

    // Data fetching helpers that avoid hook usage outside of component body
    const getTeamWithDetailsAsync = useCallback(async (id: string, includeLeaders = true) => {
        try {
            // Use the queryClient directly to get or fetch data
            const queryKey = ['team', id, 'details', { includeLeaders }];
            const cachedTeamDetails = queries.getQueryData(queryKey);

            if (cachedTeamDetails) {
                return cachedTeamDetails as Team | null;
            }

            // Fetch team details
            const teamDetails = await fetchQuery({
                queryKey,
                queryFn: () => getTeamWithDetails(id, { includeLeaders }).data
            });

            return teamDetails as Team | null;
        } catch (error) {
            console.error('Error fetching team with details:', error);
            toast({
                title: 'Không thể tải chi tiết tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải chi tiết tổ',
                variant: 'destructive',
            });
            return null;
        }
    }, [queries, fetchQuery, getTeamWithDetails]);

    const getTeamsByLine = useCallback(async (lineId: string): Promise<Team[]> => {
        try {
            // Use the queryClient directly
            const queryKey = ['line', lineId, 'teams'];
            const cachedTeams = queries.getQueryData<Team[]>(queryKey);

            if (cachedTeams) {
                return cachedTeams;
            }

            // Fetch teams for this line
            const teams = await fetchQuery({
                queryKey,
                queryFn: () => getTeamsByLineId(lineId).data
            });

            return teams || [];
        } catch (error) {
            console.error('Error fetching teams by line:', error);
            toast({
                title: 'Không thể tải danh sách tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách tổ theo dây chuyền',
                variant: 'destructive',
            });
            return [];
        }
    }, [queries, fetchQuery, getTeamsByLineId]);

    const getAccessibleTeams = useCallback(async (): Promise<Team[]> => {
        try {
            // Use the queryClient directly
            const queryKey = ['teams', 'accessible'];
            const cachedTeams = queries.getQueryData<Team[]>(queryKey);

            if (cachedTeams) {
                return cachedTeams;
            }

            // Fetch accessible teams
            const teams = await fetchQuery({
                queryKey,
                queryFn: () => getAccessibleTeamsForUser().data
            });

            return teams || [];
        } catch (error) {
            console.error('Error fetching accessible teams:', error);
            toast({
                title: 'Không thể tải danh sách tổ có quyền truy cập',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách tổ có quyền truy cập',
                variant: 'destructive',
            });
            return [];
        }
    }, [queries, fetchQuery, getAccessibleTeamsForUser]);

    const listTeamsAsync = useCallback(async (params: TeamCondDTO & BasePaginationParams): Promise<BaseResponseData<Team> | undefined> => {
        try {
            // Use the queryClient directly
            const queryKey = ['team-list', params];
            const cachedTeamList = queries.getQueryData<BaseResponseData<Team>>(queryKey);

            if (cachedTeamList) {
                return cachedTeamList;
            }

            // Fetch team list with params
            const teamsList = await fetchQuery({
                queryKey,
                queryFn: () => listTeams(params).data
            });

            return teamsList;
        } catch (error) {
            console.error('Error listing teams:', error);
            toast({
                title: 'Không thể tải danh sách tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách tổ',
                variant: 'destructive',
            });
            return undefined;
        }
    }, [queries, fetchQuery, listTeams]);

    // Cache management
    const invalidateTeamCache = useCallback(async (teamId: string, forceRefetch = false) => {
        await invalidateTeamCaches(teamId, { forceRefetch });
    }, [invalidateTeamCaches]);

    const prefetchTeamDetails = useCallback(async (teamId: string, includeLeaders = true) => {
        await prefetchDetails(teamId, { includeLeaders });
    }, [prefetchDetails]);


    /**
 * Get all teams as a simple array
 */
    /**
  * Get all teams as a simple array
  */
    /**
 * Get all teams as a simple array
 */
    const getAllTeams = (
        options?: {
            enabled?: boolean,
            refetchOnWindowFocus?: boolean,
            staleTime?: number
        }
    ): UseQueryResult<Team[], Error> => {
        return useQuery<Team[], Error>({
            queryKey: ['teams', 'all'],
            queryFn: async (): Promise<Team[]> => {
                try {
                    // Use your existing API function
                    const response = await getTeamsList({
                        page: 1,
                        limit: 1000 // Set a high limit to get all teams
                    });

                    // Return just the teams array from the response
                    return response.data || [];
                } catch (error) {
                    console.error('Error fetching all teams:', error);
                    toast({
                        title: 'Không thể tải danh sách tổ',
                        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách tổ',
                        variant: 'destructive',
                    });
                    return []; // Return empty array on error
                }
            },
            enabled: options?.enabled !== false,
            staleTime: options?.staleTime || 10 * 60 * 1000, // 10 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes
            refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        });
    };

    // Context value
    const contextValue = useMemo(() => ({
        // State
        selectedTeam,
        selectedTeamId,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,

        // Team actions
        selectTeam,
        selectTeamById,
        createTeam,
        updateTeam,
        deleteTeam,
        batchDeleteTeams,

        // Team data fetching
        getTeam,
        getTeamWithDetails: getTeamWithDetailsAsync,
        getTeamsByLine,
        listTeams: listTeamsAsync,
        getAccessibleTeams,
        getAllTeams,

        // Team leaders management
        getTeamLeaders,
        addTeamLeader,
        updateTeamLeader,
        removeTeamLeader,

        // Cache management
        invalidateTeamCache,
        prefetchTeamDetails,

        // Direct access to hooks for more complex use cases
        queries: teamQueries,
        mutations: teamMutations
    }), [
        selectedTeam,
        selectedTeamId,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        selectTeam,
        selectTeamById,
        createTeam,
        updateTeam,
        deleteTeam,
        batchDeleteTeams,
        getTeam,
        getTeamWithDetailsAsync,
        getTeamsByLine,
        listTeamsAsync,
        getAllTeams,
        getAccessibleTeams,
        getTeamLeaders,
        addTeamLeader,
        updateTeamLeader,
        removeTeamLeader,
        invalidateTeamCache,
        prefetchTeamDetails,
        teamQueries,
        teamMutations
    ]);

    return (
        <TeamContext.Provider value={contextValue}>
            {children}
        </TeamContext.Provider>
    );
};

// Custom hook to use the team context
export const useTeam = () => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};