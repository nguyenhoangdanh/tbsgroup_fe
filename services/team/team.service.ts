import { Team, TeamCondDTO, TeamCreateDTO, TeamUpdateDTO, TeamLeaderDTO } from '@/common/interface/team';
import { api } from '@/lib/api/api';
import { BaseService } from '@/lib/core/base-service';

import { TeamAdapter } from './team.adapter';

export class TeamService extends BaseService<
  Team,
  TeamCondDTO,
  TeamCreateDTO,
  TeamUpdateDTO
> {
  protected basePath = '/teams';
  protected adapter = TeamAdapter;

  // Add request deduplication to prevent multiple simultaneous requests
  private activeRequests = new Map<string, Promise<any>>();

  // Override getList with request deduplication
  async getList(params: TeamCondDTO = {} as TeamCondDTO) {
    const requestKey = `getList-${JSON.stringify(params)}`;
    
    console.log('[TeamService] getList called with params:', params);
    
    // If same request is already in progress, return that promise
    if (this.activeRequests.has(requestKey)) {
      console.log('[TeamService] Returning existing request for:', requestKey);
      return this.activeRequests.get(requestKey)!;
    }

    // Create new request
    console.log('[TeamService] Creating new request for:', requestKey);
    const requestPromise = super.getList(params);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      console.log('[TeamService] getList successful:', result);
      return result;
    } catch (error) {
      console.error('[TeamService] getList error:', error);
      throw error;
    } finally {
      // Clean up after request completes
      this.activeRequests.delete(requestKey);
      console.log('[TeamService] Request cleanup completed for:', requestKey);
    }
  }

  // Override update method with proper validation
  async update(id: string, data: TeamUpdateDTO): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Update data is required');
    }

    try {
      console.log('[TeamService] Updating team with ID:', id, 'and data:', data);
      
      // Validate required fields for update
      const validation = this.adapter.validateData ? this.adapter.validateData(data) : { valid: true, errors: [] };
      if (!validation.valid) {
        console.error('[TeamService] Validation failed:', validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      const updateRequest = this.adapter.toUpdateRequest(data);
      console.log('[TeamService] Processed update request:', updateRequest);
      
      // Ensure we don't send empty objects
      if (Object.keys(updateRequest).length === 0) {
        throw new Error('No valid update data provided');
      }
      
      const response = await api.patch(`${this.basePath}/${id}`, updateRequest);
      console.log('[TeamService] Update successful', response);
    } catch (error) {
      console.error(`[TeamService] update error:`, error);
      throw error;
    }
  }

  // Additional team-specific methods
  async getByLineId(lineId: string): Promise<Team[]> {
    try {
      if (!lineId) {
        throw new Error('Line ID is required');
      }

      const response = await api.get(`${this.basePath}/line/${lineId}`);
      const teams = response.data?.data || [];
      return Array.isArray(teams) 
        ? teams.map(team => this.adapter.toTeamType(team))
        : [];
    } catch (error) {
      console.error('[TeamService] getByLineId error:', error);
      throw error;
    }
  }

  async getAccessibleTeams(): Promise<Team[]> {
    try {
      const response = await api.get(`${this.basePath}/accessible`);
      const teams = response.data?.data || [];
      return Array.isArray(teams) 
        ? teams.map(team => this.adapter.toTeamType(team))
        : [];
    } catch (error) {
      console.error('[TeamService] getAccessibleTeams error:', error);
      throw error;
    }
  }

  async getTeamLeaders(teamId: string): Promise<any[]> {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }
      
      const response = await api.get(`${this.basePath}/${teamId}/leaders`);
      return response.data?.data || [];
    } catch (error) {
      console.error('[TeamService] getTeamLeaders error:', error);
      throw error;
    }
  }

  async addTeamLeader(teamId: string, leaderData: TeamLeaderDTO): Promise<void> {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }
      
      if (!leaderData) {
        throw new Error('Leader data is required');
      }

      await api.post(`${this.basePath}/${teamId}/leaders`, leaderData);
    } catch (error) {
      console.error('[TeamService] addTeamLeader error:', error);
      throw error;
    }
  }

  async updateTeamLeader(teamId: string, userId: string, data: { isPrimary?: boolean; endDate?: Date }): Promise<void> {
    try {
      if (!teamId || !userId) {
        throw new Error('Team ID and User ID are required');
      }

      await api.patch(`${this.basePath}/${teamId}/leaders/${userId}`, data);
    } catch (error) {
      console.error('[TeamService] updateTeamLeader error:', error);
      throw error;
    }
  }

  async removeTeamLeader(teamId: string, userId: string): Promise<void> {
    try {
      if (!teamId || !userId) {
        throw new Error('Team ID and User ID are required');
      }

      await api.delete(`${this.basePath}/${teamId}/leaders/${userId}`);
    } catch (error) {
      console.error('[TeamService] removeTeamLeader error:', error);
      throw error;
    }
  }

  async canManageTeam(teamId: string): Promise<boolean> {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const response = await api.get(`${this.basePath}/${teamId}/can-manage`);
      return response.data?.data || false;
    } catch (error) {
      console.error('[TeamService] canManageTeam error:', error);
      return false;
    }
  }
}

export const teamService = new TeamService();
export { TeamService as TeamServiceClass };
