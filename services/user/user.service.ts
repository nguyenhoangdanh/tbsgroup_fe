import { UserProfileType, UserListParams, UserUpdateRequest } from '@/common/interface/user';
import { api } from '@/lib/api/api';
import { BaseService } from '@/lib/core/base-service';
import { TUserSchema } from '@/schemas/user';

import { UserAdapter } from './user.adapter';

export class UserService extends BaseService<
  UserProfileType,
  UserListParams,
  Omit<TUserSchema, 'id'>,
  UserUpdateRequest
> {
  protected basePath = '/users';
  protected adapter = UserAdapter;

  // Override update method with proper ID validation and data filtering
  async update(id: string, data: UserUpdateRequest): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Update data is required');
    }

    try {
      // Convert to Record<string, unknown> for adapter compatibility
      const dataAsRecord: Record<string, unknown> = Object.keys(data).reduce((acc, key) => {
        acc[key] = data[key as keyof UserUpdateRequest];
        return acc;
      }, {} as Record<string, unknown>);
      
      const validation = this.adapter.validateData ? this.adapter.validateData(dataAsRecord) : { valid: true, errors: [] };
      if (!validation.valid) {
        console.error('[UserService] Validation failed:', validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      const updateRequest = this.adapter.toUpdateRequest(dataAsRecord);
      
      // Ensure we don't send empty objects
      if (Object.keys(updateRequest).length === 0) {
        throw new Error('No valid update data provided');
      }
      
      await api.patch(`${this.basePath}/${id}`, updateRequest);
    } catch (error) {
      console.error(`[UserService] update error:`, error);
      throw error;
    }
  }

  // Override create method to use auth/register endpoint
  async create(data: Omit<TUserSchema, 'id'>): Promise<UserProfileType> {
    if (!data || typeof data !== 'object') {
      throw new Error('User data is required');
    }

    try {
      // Convert to Record<string, unknown> for adapter compatibility
      const dataAsRecord: Record<string, unknown> = Object.keys(data).reduce((acc, key) => {
        acc[key] = data[key as keyof typeof data];
        return acc;
      }, {} as Record<string, unknown>);
      
      const validation = this.adapter.validateUserData(dataAsRecord);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const createRequest = this.adapter.toCreateRequest(data);
      const response = await api.post('/auth/register', createRequest);
      
      const userData = response.data?.user || response.data;
      if (!userData) {
        throw new Error('No user data returned from server');
      }

      return this.adapter.toUserProfileType(userData);
    } catch (error) {
      console.error('[UserService] create error:', error);
      throw error;
    }
  }

  // Add missing methods to match interface
  async getProfile(): Promise<UserProfileType> {
    try {
      const response = await api.get('/users/profile');
      return this.adapter.toUserProfileType(response.data);
    } catch (error) {
      console.error('[UserService] getProfile error:', error);
      throw error;
    }
  }

  async updateProfile(data: UserUpdateRequest): Promise<UserProfileType> {
    try {
      // Convert to Record<string, unknown> for adapter compatibility
      const dataAsRecord: Record<string, unknown> = Object.keys(data).reduce((acc, key) => {
        acc[key] = data[key as keyof UserUpdateRequest];
        return acc;
      }, {} as Record<string, unknown>);
      
      const updateRequest = this.adapter.toUpdateRequest(dataAsRecord);
      const response = await api.patch('/users/profile', updateRequest);
      return this.adapter.toUserProfileType(response.data);
    } catch (error) {
      console.error('[UserService] updateProfile error:', error);
      throw error;
    }
  }

  async getUserRoles(userId: string): Promise<any[]> {
    try {
      const response = await api.get(`/users/${userId}/roles`);
      return response.data;
    } catch (error) {
      console.error('[UserService] getUserRoles error:', error);
      throw error;
    }
  }

  async assignRole(userId: string, data: any): Promise<void> {
    try {
      await api.post(`/users/${userId}/roles`, data);
    } catch (error) {
      console.error('[UserService] assignRole error:', error);
      throw error;
    }
  }

  async removeRole(userId: string, roleId: string, scope?: string): Promise<void> {
    try {
      await api.delete(`/users/${userId}/roles/${roleId}`);
    } catch (error) {
      console.error('[UserService] removeRole error:', error);
      throw error;
    }
  }
}

// Export single instance
export const userService = new UserService();

// Also export the class for compatibility
export { UserService as UserServiceClass };
