// src/apis/permission/permission.api.ts
" use server"
import { AssignPermissionsDTO, ClientAccessResponse, CreatePermissionDTO, PaginationDTO, PermissionCondDTO, PermissionDTO, PermissionListResponse, UpdatePermissionDTO, UserPermissionsQueryDTO, UserPermissionsResponse } from '@/common/types/permission';
import { fetchWithAuth } from '@/lib/fetcher';
import { isValidUUID, validateUUIDOrShowError, uuidArraySchema, uuidSchema } from '@/utils/uuid-utils';



// API endpoints cho quản lý Permission

// CRUD Permission
export const createPermissionApi = async (data: CreatePermissionDTO): Promise<{ id: string }> => {
  const response = await fetchWithAuth('/permissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
};

export const getPermissionListApi = async (
  params: PermissionCondDTO & PaginationDTO = {}
): Promise<PermissionListResponse> => {
  const queryParams = new URLSearchParams();
  
  // Thêm các tham số vào URL nếu có
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.code) queryParams.append('code', params.code);
  if (params.name) queryParams.append('name', params.name);
  if (params.type) queryParams.append('type', params.type);
  if (params.module) queryParams.append('module', params.module);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  
  const response = await fetchWithAuth(`/permissions?${queryParams.toString()}`);
  return response;
};

export const getPermissionByIdApi = async (id: string): Promise<PermissionDTO> => {
  try {
    // Validate UUID format using Zod
    uuidSchema.parse(id);
    
    const response = await fetchWithAuth(`/permissions/${id}`);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Invalid UUID format: ${id}`);
  }
};

export const getPermissionByCodeApi = async (code: string): Promise<any> => {
  const response = await fetchWithAuth(`/permissions/code/${code}`);
  return response;
};

export const updatePermissionApi = async (id: string, data: UpdatePermissionDTO): Promise<{ message: string }> => {
  try {
    // Validate UUID format using Zod
    uuidSchema.parse(id);
    
    const response = await fetchWithAuth(`/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Invalid UUID format: ${id}`);
  }
};

export const deletePermissionApi = async (id: string): Promise<{ message: string }> => {
  try {
    // Validate UUID format using Zod
    uuidSchema.parse(id);
    
    const response = await fetchWithAuth(`/permissions/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Invalid UUID format: ${id}`);
  }
};

export const batchDeletePermissionApi = async (ids: string[]): Promise<void> => {
  const results = await Promise.allSettled(ids.map(id => deletePermissionApi(id)));
  const failedIds = results
    .map((result, index) => (result.status === 'rejected' ? ids[index] : null))
    .filter(id => id !== null);
  if (failedIds.length > 0) {
    throw new Error(`Không thể xóa các quyền: ${failedIds.join(', ')}`);
  }
};

// Role Permissions
export const getPermissionsByRoleApi = async (roleId: string): Promise<{ data: PermissionDTO[] }> => {
  try {
    // Validate UUID format using Zod
    uuidSchema.parse(roleId);
    
    const response = await fetchWithAuth(`/permissions/role/${roleId}`);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Invalid UUID format: ${roleId}`);
  }
};

export const assignPermissionsToRoleApi = async (
  roleId: string, 
  data: AssignPermissionsDTO
): Promise<{ message: string }> => {
  try {
    // Validate UUID format before making API call using Zod
    uuidSchema.parse(roleId);
    
    // Validate all permission IDs in the array
    uuidArraySchema.parse(data.permissionIds);
    
    const response = await fetchWithAuth(`/permissions/role/${roleId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Invalid UUID format in request`);
  }
};

export const removePermissionsFromRoleApi = async (
  roleId: string, 
  data: AssignPermissionsDTO
): Promise<{ message: string }> => {
  try {
    // Validate UUID format before making API call using Zod
    uuidSchema.parse(roleId);
    
    // Validate all permission IDs in the array
    uuidArraySchema.parse(data.permissionIds);
    
    const response = await fetchWithAuth(`/permissions/role/${roleId}/remove`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Invalid UUID format in request`);
  }
};

// User Permissions
export const getUserPermissionsApi = async (
  params: UserPermissionsQueryDTO = {}
): Promise<{ success: boolean; data: UserPermissionsResponse }> => {
  const queryParams = new URLSearchParams();
  
  try {
    // Validate userId if present using Zod
    if (params.userId) {
      uuidSchema.parse(params.userId);
      queryParams.append('userId', params.userId);
    }
    
    if (params.includeInactive !== undefined) queryParams.append('includeInactive', params.includeInactive.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.module) queryParams.append('module', params.module);
    
    const response = await fetchWithAuth(`/permissions/user?${queryParams.toString()}`);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Invalid parameters for user permissions');
  }
};

export const checkUserHasPermissionApi = async (
  permissionCode: string
): Promise<{ success: boolean; data: { hasPermission: boolean } }> => {
  const response = await fetchWithAuth(`/permissions/user/check/${permissionCode}`);
  return response;
};

// Client Access Permissions
export const getClientAccessPermissionsApi = async (): Promise<{ success: boolean; data: ClientAccessResponse }> => {
  const response = await fetchWithAuth('/permissions/client-access');
  return response;
};