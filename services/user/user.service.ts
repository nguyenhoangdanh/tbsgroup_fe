import { 
  UserType, 
  UserProfileType,
  UserListParams, 
  UserListResponse,
  UserUpdateRequest,
  UserProfileUpdateRequest,
  UserRoleAssignmentRequest,
  UserRoleResponse,
  ApiResponse,
  UserAccessResponse
} from '@/common/interface/user';
import { fetchWithAuth } from '@/lib/fetcher';
import { TUserSchema } from '@/schemas/user';
import { UserAdapter } from './user.adapter';

export const UserService = {
  // Profile management
  getProfile: async (): Promise<UserProfileType> => {
    const response = await fetchWithAuth('/users/profile');
    return UserAdapter.toUserProfileType(response.data);
  },

  updateProfile: async (data: UserProfileUpdateRequest): Promise<void> => {
    await fetchWithAuth('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // User management
  getList: async (params: UserListParams = {}): Promise<UserListResponse> => {
    const queryParams = new URLSearchParams();

    // Add pagination parameters
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // Add search conditions
    if (params.username) queryParams.append('username', params.username);
    if (params.fullName) queryParams.append('fullName', params.fullName);
    if (params.status) queryParams.append('status', params.status);
    if (params.factoryId) queryParams.append('factoryId', params.factoryId);
    if (params.lineId) queryParams.append('lineId', params.lineId);
    if (params.teamId) queryParams.append('teamId', params.teamId);
    if (params.groupId) queryParams.append('groupId', params.groupId);
    if (params.positionId) queryParams.append('positionId', params.positionId);
    if (params.roleId) queryParams.append('roleId', params.roleId);
    if (params.roleCode) queryParams.append('roleCode', params.roleCode);

    const response = await fetchWithAuth(`/users/list?${queryParams.toString()}`);
    return UserAdapter.toListResponse(response);
  },

  getById: async (id: string): Promise<UserProfileType> => {
    const response = await fetchWithAuth(`/users/${id}`);
    return UserAdapter.toUserProfileType(response.data);
  },

  update: async (id: string, data: UserUpdateRequest): Promise<void> => {
    await fetchWithAuth(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/users/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Role management
  getUserRoles: async (id: string): Promise<UserRoleResponse[]> => {
    const response = await fetchWithAuth(`/users/${id}/roles`);
    return response.data;
  },

  assignRole: async (id: string, data: UserRoleAssignmentRequest): Promise<void> => {
    await fetchWithAuth(`/users/${id}/roles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  removeRole: async (id: string, roleId: string, scope?: string): Promise<void> => {
    const body = scope ? { scope } : {};
    await fetchWithAuth(`/users/${id}/roles/${roleId}`, {
      method: 'DELETE',
      body: JSON.stringify(body),
    });
  },

  // Access control
  checkAccess: async (entityType: string, entityId: string): Promise<UserAccessResponse> => {
    const response = await fetchWithAuth(`/users/access/${entityType}/${entityId}`);
    return { hasAccess: response.data };
  },

  // Legacy methods for backward compatibility
  getAll: async (): Promise<UserProfileType[]> => {
    const response = await UserService.getList({ page: 1, limit: 1000 });
    return response.data;
  },

  create: async (data: Omit<TUserSchema, 'id'>): Promise<UserType> => {
    // Validate data before sending
    const validation = UserAdapter.validateUserData(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Transform to backend format
    const createRequest = UserAdapter.toCreateRequest(data);
    
    // This should go through auth/register endpoint
    const response = await fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(createRequest),
    });
    
    return UserAdapter.toUserType(response.data || response);
  },
};
