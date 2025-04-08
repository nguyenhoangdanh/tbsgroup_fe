
import { UserListParams, UserListResponse } from '@/common/interface/user';
import { fetchWithAuth } from '@/lib/fetcher';
import { TUserSchema } from '@/schemas/user';

// Tạo kiểu dữ liệu cho các API request
export type LoginType = {
  username: string;
  password: string;
};

export type ResetPasswordType = {
  resetToken?: string;
  username?: string;
  password: string;
  confirmPassword: string;
};

export type VerifyDataType = {
  employeeId: string;
  cardId: string;
};

// Auth API endpoints
export const loginMutationFn = async (data: LoginType) =>
  fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const registerMutationFn = async (data: Omit<TUserSchema, 'id'>) =>
  fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const verifyMutationFn = async (data: VerifyDataType) =>
  fetchWithAuth('/auth/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const resetPasswordMutationFn = async (data: ResetPasswordType) =>
  fetchWithAuth('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const requestResetPasswordMutationFn = async (data: {
  employeeId: string;
  cardId: string;
}) =>
  fetchWithAuth('/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const logoutMutationFn = async () =>
  fetchWithAuth('/auth/logout', {
    method: 'POST',
  });

// User profile API endpoints
export const getUserProfileQueryFn = async () => { return await fetchWithAuth('/profile') };

export const updateStatusMutationFn = async (data: { status: string }) =>
  fetchWithAuth('/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// User management API endpoints
export const getAllUsersQueryFn = async () => {
  return await fetchWithAuth('/users');
};

export const getUserByIdQueryFn = async (id: string) => {
  const response = await fetchWithAuth(`/users/${id}`);
  return response.data;
};

export const createUserMutationFn = async (data: Omit<TUserSchema, 'id'>) => {
  const response = await fetchWithAuth('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
};

export const updateUserMutationFn = async ({ id, data }: { 
  id: string; 
  data: Partial<TUserSchema> 
}) => {
  const response = await fetchWithAuth(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response;
};

export const deleteUserMutationFn = async (id: string) => {
  const response = await fetchWithAuth(`/users/${id}`, {
    method: 'DELETE',
  });
  return response;
};

export const getUsersListQueryFn = async (params: UserListParams = {}): Promise<UserListResponse> => {
  const queryParams = new URLSearchParams();
  
  // Thêm các tham số vào URL nếu chúng tồn tại
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.username) queryParams.append('username', params.username);
  if (params.fullName) queryParams.append('fullName', params.fullName);
  if (params.role) queryParams.append('role', params.role);
  if (params.status) queryParams.append('status', params.status);
  
  const response = await fetchWithAuth(`/users/list?${queryParams.toString()}`);
  return response;
};

