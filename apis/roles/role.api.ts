import { fetchWithAuth } from '@/lib/fetcher';
import { TRoleSchema } from '@/schemas/role';

/**
 * Fetch all roles
 * @returns List of all roles
 */
export const fetchRoles = async () => {
  const response = await fetchWithAuth('/roles');

  return response.data;
};

/**
 * Fetch role by ID
 * @param id - Role ID
 * @returns Role details
 */
export const fetchRoleById = async (id: string) => {
  const response = await fetchWithAuth(`/roles/${id}`);
  return response.data;
};

/**
 * Fetch role by code
 * @param code - Role code
 * @returns Role details
 */
export const fetchRoleByCode = async (code: string) => {
  const response = await fetchWithAuth(`/roles/code/${code}`);
  return response.data;
};

/**
 * Fetch role with relations
 * @param id - Role ID
 * @returns Role with its relations
 */
export const fetchRoleWithRelations = async (id: string) => {
  const response = await fetchWithAuth(`/roles/${id}/relations`);
  return response.data;
};

/**
 * Interface for role list parameters
 */
export interface RoleListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  code?: string;
  name?: string;
  level?: number;
  isSystem?: boolean;
}

/**
 * Fetch roles list with filtering and pagination
 * @param params - Query parameters
 * @returns Paginated list of roles
 */
export const fetchRolesList = async (params: RoleListParams = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  if (params.code) queryParams.append('code', params.code);
  if (params.name) queryParams.append('name', params.name);
  if (params.level !== undefined) queryParams.append('level', params.level.toString());
  if (params.isSystem !== undefined) queryParams.append('isSystem', params.isSystem.toString());

  const response = await fetchWithAuth(`/roles?${queryParams.toString()}`);
  return response.data;
};

/**
 * Create a new role
 * @param data - Role data
 * @returns Created role response
 */
export const createRole = async (data: Omit<TRoleSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
  const response = await fetchWithAuth('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
};

/**
 * Update an existing role
 * @param id - Role ID
 * @param data - Updated role data
 * @returns Update response
 */
export const updateRole = async ({
  id,
  data,
}: {
  id: string;
  data: Omit<TRoleSchema, 'id' | 'createdAt' | 'updatedAt'>;
}) => {
  const response = await fetchWithAuth(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
};

/**
 * Delete a role
 * @param id - Role ID
 * @returns Delete response
 */
export const deleteRole = async (id: string) => {
  const response = await fetchWithAuth(`/roles/${id}`, {
    method: 'DELETE',
  });
  return response.data;
};

export type RoleType = Awaited<ReturnType<typeof fetchRoles>>[0];
export type RoleItemType = Awaited<ReturnType<typeof fetchRoleById>>;
export type RoleWithRelationsType = Awaited<ReturnType<typeof fetchRoleWithRelations>>;
export type RoleListResponse = Awaited<ReturnType<typeof fetchRolesList>>;
