import { BagProcess } from '@/common/interface/handbag';
import { BasePaginationParams, BaseResponseData } from '@/hooks/base/useBaseQueries';
import { fetchWithAuth } from '@/lib/fetcher';

// Define condition DTO interface for filtering bag processes
export interface BagProcessCondDTO {
  code?: string;
  name?: string;
  active?: boolean;
  search?: string;
  processType?: string;
}

// Define create DTO interface for creating a new bag process
export interface BagProcessCreateDTO {
  code: string;
  name: string;
  description?: string;
  orderIndex?: number;
  processType?: string;
  standardOutput?: number;
  cycleDuration?: number;
  machineType?: string;
}

// Define update DTO interface for updating a bag process
export interface BagProcessUpdateDTO {
  name?: string;
  description?: string;
  orderIndex?: number;
  processType?: string;
  standardOutput?: number;
  cycleDuration?: number;
  machineType?: string;
  active?: boolean;
}

/**
 * Get a list of bag processes based on filter conditions and pagination
 */
export const getBagProcessesList = async (
  params: BagProcessCondDTO & BasePaginationParams,
): Promise<BaseResponseData<BagProcess>> => {
  // Build query params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  if (params.code) queryParams.append('code', params.code);
  if (params.name) queryParams.append('name', params.name);
  if (params.processType) queryParams.append('processType', params.processType);
  if (params.active !== undefined) queryParams.append('active', params.active.toString());
  if (params.search) queryParams.append('search', params.search);

  const response = await fetchWithAuth(`/bag-processes?${queryParams.toString()}`);
  return response;
};

/**
 * Get details of a bag process by ID
 */
export const getBagProcessById = async (id: string): Promise<BagProcess> => {
  const response = await fetchWithAuth(`/bag-processes/${id}`);
  return response.data;
};

/**
 * Create a new bag process
 */
export const createBagProcess = async (data: BagProcessCreateDTO): Promise<{ id: string }> => {
  const response = await fetchWithAuth('/bag-processes', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { id: response.data.id };
};

/**
 * Update a bag process
 */
export const updateBagProcess = async (id: string, data: BagProcessUpdateDTO): Promise<void> => {
  const response = await fetchWithAuth(`/bag-processes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return response.data;
};

/**
 * Delete a bag process
 */
export const deleteBagProcess = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`/bag-processes/${id}`, {
    method: 'DELETE',
  });

  return response.data;
};

/**
 * Batch delete multiple bag processes in parallel
 */
export const batchDeleteBagProcessesParallel = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map(id => deleteBagProcess(id)));
};

/**
 * Get bag processes by process type
 */
export const getBagProcessesByType = async (processType: string): Promise<BagProcess[]> => {
  const response = await fetchWithAuth(`/rpc/bag-processes/by-process-type/${processType}`);
  return response.data;
};

/**
 * Get multiple bag processes by their IDs
 */
export const getBagProcessesByIds = async (ids: string[]): Promise<BagProcess[]> => {
  if (!ids || ids.length === 0) {
    return [];
  }

  const response = await fetchWithAuth('/rpc/bag-processes/list-by-ids', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });

  return response.data;
};
