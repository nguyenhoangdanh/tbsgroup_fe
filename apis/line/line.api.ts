import {
  Line,
  LineCondDTO,
  LineCreateDTO,
  LineUpdateDTO,
  LineManagerDTO,
} from '@/common/interface/line';
import { BasePaginationParams, BaseResponseData } from '@/hooks/base/useBaseQueries';
import { fetchWithAuth } from '@/lib/fetcher';

// === LINE API FUNCTIONS ===

/**
 * Lấy danh sách dây chuyền theo điều kiện lọc và phân trang
 */
export const getLinesList = async (
  params: LineCondDTO & BasePaginationParams,
): Promise<BaseResponseData<Line>> => {
  // Build query params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  if (params.code) queryParams.append('code', params.code);
  if (params.name) queryParams.append('name', params.name);
  if (params.factoryId) queryParams.append('factoryId', params.factoryId);
  if (params.search) queryParams.append('search', params.search);

  const response = await fetchWithAuth(`/lines?${queryParams.toString()}`);
  return response;
};

/**
 * Lấy chi tiết một dây chuyền theo ID
 */
export const getLineById = async (id: string): Promise<Line> => {
  const response = await fetchWithAuth(`/lines/${id}`);
  return response.data;
};

/**
 * Kiểm tra quyền quản lý dây chuyền
 */
export const checkCanManageLine = async (lineId: string): Promise<boolean> => {
  const response = await fetchWithAuth(`/lines/${lineId}/can-manage`);
  return response.data;
};

/**
 * Lấy danh sách dây chuyền có thể truy cập
 */
export const getAccessibleLines = async (): Promise<Line[]> => {
  const response = await fetchWithAuth('/lines/accessible');
  return response.data;
};

/**
 * Lấy danh sách dây chuyền theo nhà máy
 */
export const getLinesByFactory = async (factoryId: string): Promise<Line[]> => {
  const response = await fetchWithAuth(`/lines/factory/${factoryId}`);
  return response.data;
};

/**
 * Tạo mới một dây chuyền
 */
export const createLine = async (data: LineCreateDTO): Promise<{ id: string }> => {
  const response = await fetchWithAuth('/lines', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { id: response.data.id };
};

/**
 * Cập nhật thông tin dây chuyền
 */
export const updateLine = async (id: string, data: LineUpdateDTO): Promise<void> => {
  const response = await fetchWithAuth(`/lines/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return response.data;
};

/**
 * Xóa một dây chuyền
 */
export const deleteLine = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`/lines/${id}`, {
    method: 'DELETE',
  });

  return response.data;
};

/**
 * Lấy danh sách quản lý của dây chuyền
 */
export const getLineManagers = async (
  lineId: string,
): Promise<
  {
    userId: string;
    isPrimary: boolean;
    startDate: string;
    endDate: string | null;
    user?: {
      id: string;
      fullName: string;
      avatar?: string | null;
    };
  }[]
> => {
  const response = await fetchWithAuth(`/lines/${lineId}/managers`);
  return response.data;
};

/**
 * Thêm quản lý vào dây chuyền
 */
export const addLineManager = async (lineId: string, managerDTO: LineManagerDTO): Promise<void> => {
  const response = await fetchWithAuth(`/lines/${lineId}/managers`, {
    method: 'POST',
    body: JSON.stringify(managerDTO),
  });

  return response.data;
};

/**
 * Cập nhật thông tin quản lý dây chuyền
 */
export const updateLineManager = async (
  lineId: string,
  userId: string,
  data: {
    isPrimary?: boolean;
    endDate?: Date | string | null; // Cập nhật để phù hợp với LineManagerDTO
  },
): Promise<void> => {
  const response = await fetchWithAuth(`/lines/${lineId}/managers/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return response.data;
};

/**
 * Xóa quản lý khỏi dây chuyền
 */
export const removeLineManager = async (lineId: string, userId: string): Promise<void> => {
  const response = await fetchWithAuth(`/lines/${lineId}/managers/${userId}`, {
    method: 'DELETE',
  });

  return response.data;
};

// Batch delete multiple lines in parallel
export const batchDeleteLinesParallel = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map(id => deleteLine(id)));
};
