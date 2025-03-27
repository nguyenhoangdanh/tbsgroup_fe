import { Group } from '@/common/interface/group';
import { BasePaginationParams, BaseResponseData } from '@/hooks/base/useBaseQueries';
import { fetchWithAuth } from '@/lib/fetcher';

// Define condition DTO interface for filtering groups
export interface GroupCondDTO {
  code?: string;
  name?: string;
  teamId?: string;
  search?: string;
}

// Define create DTO interface for creating a new group
export interface GroupCreateDTO {
  code: string;
  name: string;
  description?: string;
  teamId: string;
}

// Define update DTO interface for updating a group
export interface GroupUpdateDTO {
  name?: string;
  description?: string;
  teamId?: string;
}

/**
 * Get a list of groups based on filter conditions and pagination
 */
export const getGroupsList = async (
  params: GroupCondDTO & BasePaginationParams
): Promise<BaseResponseData<Group>> => {
  // Build query params
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  
  if (params.code) queryParams.append('code', params.code);
  if (params.name) queryParams.append('name', params.name);
  if (params.teamId) queryParams.append('teamId', params.teamId);
  if (params.search) queryParams.append('search', params.search);
  
  const response = await fetchWithAuth(`/groups?${queryParams.toString()}`);
  return response;
};

/**
 * Get details of a group by ID
 */
export const getGroupById = async (id: string): Promise<Group> => {
  const response = await fetchWithAuth(`/groups/${id}`);
  return response.data;
};

/**
 * Create a new group
 */
export const createGroup = async (
  data: GroupCreateDTO
): Promise<{ id: string }> => {
  const response = await fetchWithAuth('/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { id: response.data.id };
};

/**
 * Update a group
 */
export const updateGroup = async (
  id: string,
  data: GroupUpdateDTO
): Promise<void> => {
  const response = await fetchWithAuth(`/groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  
  return response.data;
};

/**
 * Delete a group
 */
export const deleteGroup = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`/groups/${id}`, {
    method: 'DELETE',
  });
  
  return response.data;
};

/**
 * Batch delete multiple groups in parallel
 */
export const batchDeleteGroupsParallel = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map(id => deleteGroup(id)));
};

/**
 * Get groups by team ID
 */
export const getGroupsByTeam = async (teamId: string): Promise<Group[]> => {
  const response = await fetchWithAuth(`/rpc/groups/by-team/${teamId}`);
  return response.data;
};

/**
 * Get multiple groups by their IDs
 */
export const getGroupsByIds = async (ids: string[]): Promise<Group[]> => {
  if (!ids || ids.length === 0) {
    return [];
  }
  
  const response = await fetchWithAuth('/rpc/groups/list-by-ids', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
  
  return response.data;
};