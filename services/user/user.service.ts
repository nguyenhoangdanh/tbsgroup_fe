import { TUserSchema } from '@/schemas/user';
import { UserType, UserListParams, UserListResponse } from '@/common/interface/user';
import { fetchWithAuth } from '@/lib/fetcher';

export const UserService = {
  getAll: async (): Promise<UserType[]> => {
    const response = await fetchWithAuth('/users');
    return response;
  },
  
  getById: async (id: string): Promise<UserType> => {
    const response = await fetchWithAuth(`/users/${id}`);
    return response.data;
  },
  
  getList: async (params: UserListParams = {}): Promise<UserListResponse> => {
    const queryParams = new URLSearchParams();
    
    // Add parameters to URL if they exist
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.username) queryParams.append('username', params.username);
    if (params.fullName) queryParams.append('fullName', params.fullName);
    if (params.role) queryParams.append('role', params.role);
    if (params.status) queryParams.append('status', params.status);
    
    const response = await fetchWithAuth(`/users/list?${queryParams.toString()}`);
    return response;
  },
  
  create: async (data: Omit<TUserSchema, 'id'>): Promise<UserType> => {
    const response = await fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },
  
  update: async (id: string, data: Partial<TUserSchema>): Promise<UserType> => {
    const response = await fetchWithAuth(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response;
  },
  
  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};