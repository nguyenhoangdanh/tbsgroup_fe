import {
  BagColor,
  BagColorCondDTO,
  BagColorCreateDTO,
  BagColorProcess,
  BagColorProcessCondDTO,
  BagColorProcessCreateDTO,
  BagColorProcessUpdateDTO,
  BagColorUpdateDTO,
  HandBag,
  HandBagCondDTO,
  HandBagCreateDTO,
  HandBagUpdateDTO,
} from '@/common/interface/handbag';
import { BasePaginationParams, BaseResponseData } from '@/hooks/base/useBaseQueries';
import { HandBagWithDetails } from '@/hooks/handbag/useHandBagDetails';
import { fetchWithAuth } from '@/lib/fetcher';

// === HANDBAG API FUNCTIONS ===

/**
 * Lấy danh sách túi theo điều kiện lọc và phân trang
 */
export const getHandBagsList = async (
  params: HandBagCondDTO & BasePaginationParams,
): Promise<BaseResponseData<HandBag>> => {
  // Build query params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  if (params.code) queryParams.append('code', params.code);
  if (params.name) queryParams.append('name', params.name);
  if (params.category) queryParams.append('category', params.category);
  if (params.active !== undefined) queryParams.append('active', params.active.toString());
  if (params.search) queryParams.append('search', params.search);

  const response = await fetchWithAuth(`/handbags?${queryParams.toString()}`);
  return response;
};

/**
 * Lấy chi tiết một túi theo ID
 */
export const getHandBagById = async (id: string): Promise<HandBag> => {
  const response = await fetchWithAuth(`/handbags/${id}`);
  return response.data;
};

/**
 * Lấy chi tiết đầy đủ của túi bao gồm các màu và công đoạn
 */
export const getHandBagFullDetails = async (id: string): Promise<HandBagWithDetails> => {
  const response = await fetchWithAuth(`/handbags/${id}/full-details`);
  return response.data;
};

/**
 * Tạo mới một túi
 */
export const createHandBag = async (data: HandBagCreateDTO): Promise<{ id: string }> => {
  const response = await fetchWithAuth('/handbags', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { id: response.data.id };
};

/**
 * Cập nhật thông tin túi
 */
export const updateHandBag = async (id: string, data: HandBagUpdateDTO): Promise<void> => {
  const response = await fetchWithAuth(`/handbags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return response.data;
};

/**
 * Xóa một túi
 */
export const deleteHandBag = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`/handbags/${id}`, {
    method: 'DELETE',
  });

  return response.data;
};

// === BAGCOLOR API FUNCTIONS ===

/**
 * Lấy danh sách màu túi theo điều kiện lọc và phân trang
 */
export const getBagColorsList = async (
  params: BagColorCondDTO & BasePaginationParams,
): Promise<BaseResponseData<BagColor>> => {
  // Build query params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  if (params.handBagId) queryParams.append('handBagId', params.handBagId);
  if (params.colorCode) queryParams.append('colorCode', params.colorCode);
  if (params.colorName) queryParams.append('colorName', params.colorName);
  if (params.active !== undefined) queryParams.append('active', params.active.toString());
  if (params.search) queryParams.append('search', params.search);

  const response = await fetchWithAuth(`handbags/colors?${queryParams.toString()}`);
  return response;
};

/**
 * Lấy chi tiết một màu túi theo ID
 */
export const getBagColorById = async (id: string): Promise<BagColor> => {
  const response = await fetchWithAuth(`/handbags/colors/${id}`);
  return response.data;
};

/**
 * Tạo mới một màu túi
 */
export const createBagColor = async (data: BagColorCreateDTO): Promise<{ id: string }> => {
  const response = await fetchWithAuth('/handbags/colors', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { id: response.data.id };
};

/**
 * Cập nhật thông tin màu túi
 */
export const updateBagColor = async (id: string, data: BagColorUpdateDTO): Promise<void> => {
  const response = await fetchWithAuth(`/handbags/colors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return response.data;
};

/**
 * Xóa một màu túi
 */
export const deleteBagColor = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`/handbags/colors/${id}`, {
    method: 'DELETE',
  });

  return response.data;
};

// === BAGCOLORPROCESS API FUNCTIONS ===

/**
 * Lấy danh sách công đoạn màu túi theo điều kiện lọc và phân trang
 */
export const getBagColorProcessesList = async (
  params: BagColorProcessCondDTO & BasePaginationParams,
): Promise<BaseResponseData<BagColorProcess>> => {
  // Build query params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  if (params.bagColorId) queryParams.append('bagColorId', params.bagColorId);
  if (params.bagProcessId) queryParams.append('bagProcessId', params.bagProcessId);

  const response = await fetchWithAuth(`/handbags/processes?${queryParams.toString()}`);
  return response;
};

/**
 * Lấy chi tiết một công đoạn màu túi theo ID
 */
export const getBagColorProcessById = async (id: string): Promise<BagColorProcess> => {
  const response = await fetchWithAuth(`/handbags/processes/${id}`);
  return response.data;
};

/**
 * Tạo mới một công đoạn màu túi
 */
export const createBagColorProcess = async (
  data: BagColorProcessCreateDTO,
): Promise<{ id: string }> => {
  const response = await fetchWithAuth('/handbags/processes', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { id: response.data.id };
};

/**
 * Cập nhật thông tin công đoạn màu túi
 */
export const updateBagColorProcess = async (
  id: string,
  data: BagColorProcessUpdateDTO,
): Promise<void> => {
  const response = await fetchWithAuth(`/handbags/processes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return response.data;
};

/**
 * Xóa một công đoạn màu túi
 */
export const deleteBagColorProcess = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`/handbags/processes/${id}`, {
    method: 'DELETE',
  });

  return response.data;
};

export const batchDeleteBagColorsParallel = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map(id => deleteBagColor(id)));
};

// Alternatively, if you don't have a batch delete endpoint, you can implement it like this:
// This uses Promise.all to delete multiple items in parallel
export const batchDeleteHandBagsParallel = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map(id => deleteHandBag(id)));
};
