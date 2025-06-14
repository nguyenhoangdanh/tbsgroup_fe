import { Group, GroupCondDTO, GroupCreateDTO, GroupUpdateDTO, GroupLeaderCreateDTO, GroupLeaderUpdateDTO, GroupPerformance } from '@/common/interface/group';
import { api } from '@/lib/api/api';
import { BaseService } from '@/lib/core/base-service';

import { GroupAdapter } from './group.adapter';

export class GroupService extends BaseService<
  Group,
  GroupCondDTO,
  GroupCreateDTO,
  GroupUpdateDTO
> {
  protected basePath = '/groups';
  protected adapter = GroupAdapter;

  // Add request deduplication to prevent multiple simultaneous requests
  private activeRequests = new Map<string, Promise<any>>();

  // Override getList with request deduplication
  async getList(params: GroupCondDTO = {} as GroupCondDTO) {
    const requestKey = `getList-${JSON.stringify(params)}`;
    
    console.log('[GroupService] getList called with params:', params);
    
    // If same request is already in progress, return that promise
    if (this.activeRequests.has(requestKey)) {
      console.log('[GroupService] Returning existing request for:', requestKey);
      return this.activeRequests.get(requestKey)!;
    }

    // Create new request
    console.log('[GroupService] Creating new request for:', requestKey);
    const requestPromise = super.getList(params);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      console.log('[GroupService] getList successful:', result);
      return result;
    } catch (error) {
      console.error('[GroupService] getList error:', error);
      throw error;
    } finally {
      // Clean up after request completes
      this.activeRequests.delete(requestKey);
      console.log('[GroupService] Request cleanup completed for:', requestKey);
    }
  }

  // Override update method with proper validation
  async update(id: string, data: GroupUpdateDTO): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Update data is required');
    }

    try {
      console.log('[GroupService] Updating group with ID:', id, 'and data:', data);
      
      // Validate required fields for update
      const validation = this.adapter.validateData ? this.adapter.validateData(data) : { valid: true, errors: [] };
      if (!validation.valid) {
        console.error('[GroupService] Validation failed:', validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      const updateRequest = this.adapter.toUpdateRequest(data);
      console.log('[GroupService] Processed update request:', updateRequest);
      
      // Ensure we don't send empty objects
      if (Object.keys(updateRequest).length === 0) {
        throw new Error('No valid update data provided');
      }
      
      const response = await api.patch(`${this.basePath}/${id}`, updateRequest);
      console.log('[GroupService] Update successful', response);
    } catch (error) {
      console.error(`[GroupService] update error:`, error);
      throw error;
    }
  }

  // Additional group-specific methods
  async addUsersToGroup(groupId: string, userIds: string[]): Promise<{ success: number; failed: number }> {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }

      if (!userIds || userIds.length === 0) {
        throw new Error('User IDs are required');
      }

      const response = await api.post(`${this.basePath}/${groupId}/users`, { userIds });
      return response.data?.data || { success: 0, failed: userIds.length };
    } catch (error) {
      console.error('[GroupService] addUsersToGroup error:', error);
      throw error;
    }
  }

  async getGroupUsers(groupId: string): Promise<any[]> {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }

      const response = await api.get(`${this.basePath}/${groupId}/users`);
      return response.data?.data || [];
    } catch (error) {
      console.error('[GroupService] getGroupUsers error:', error);
      throw error;
    }
  }

  // Group leader methods
  async assignGroupLeader(leaderData: GroupLeaderCreateDTO): Promise<void> {
    try {
      if (!leaderData) {
        throw new Error('Leader data is required');
      }

      await api.post(`${this.basePath}/leaders`, leaderData);
    } catch (error) {
      console.error('[GroupService] assignGroupLeader error:', error);
      throw error;
    }
  }

  async getGroupLeaders(groupId: string): Promise<any[]> {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      
      const response = await api.get(`${this.basePath}/${groupId}/leaders`);
      return response.data?.data || [];
    } catch (error) {
      console.error('[GroupService] getGroupLeaders error:', error);
      throw error;
    }
  }

  async updateGroupLeader(groupId: string, userId: string, data: GroupLeaderUpdateDTO): Promise<void> {
    try {
      if (!groupId || !userId) {
        throw new Error('Group ID and User ID are required');
      }

      await api.patch(`${this.basePath}/${groupId}/leaders/${userId}`, data);
    } catch (error) {
      console.error('[GroupService] updateGroupLeader error:', error);
      throw error;
    }
  }

  async removeGroupLeader(groupId: string, userId: string): Promise<void> {
    try {
      if (!groupId || !userId) {
        throw new Error('Group ID and User ID are required');
      }

      await api.delete(`${this.basePath}/${groupId}/leaders/${userId}`);
    } catch (error) {
      console.error('[GroupService] removeGroupLeader error:', error);
      throw error;
    }
  }

  // Performance methods
  async getGroupPerformance(groupId: string): Promise<GroupPerformance> {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }

      const response = await api.get(`${this.basePath}/${groupId}/performance`);
      return response.data?.data || {};
    } catch (error) {
      console.error('[GroupService] getGroupPerformance error:', error);
      throw error;
    }
  }

  async listGroupsWithPerformance(params: GroupCondDTO = {}): Promise<any> {
    try {
      const backendParams = this.adapter.toBackendFilters ? this.adapter.toBackendFilters(params) : params;
      const response = await api.get(`${this.basePath}/performance/list`, backendParams);
      
      return {
        data: response.data?.data || [],
        total: response.data?.total || 0,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: Math.ceil((response.data?.total || 0) / (params.limit || 10)),
      };
    } catch (error) {
      console.error('[GroupService] listGroupsWithPerformance error:', error);
      throw error;
    }
  }
}

export const groupService = new GroupService();
export { GroupService as GroupServiceClass };
