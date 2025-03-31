import { BagGroupRate } from '@/common/interface/bag-group-rate';
import { BaseResponseData } from '@/hooks/base/useBaseQueries';
import { fetchWithAuth } from '@/lib/fetcher';

// Types
export interface BagGroupRateCondDTO {
  handBagId?: string;
  groupId?: string;
  active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BagGroupRateCreateDTO {
  handBagId: string;
  groupId: string;
  outputRate: number;
  notes?: string;
  active?: boolean;
}

export interface BagGroupRateUpdateDTO {
  outputRate?: number;
  notes?: string;
  active?: boolean;
}

export interface GroupRateItem {
  groupId: string;
  outputRate: number;
  notes?: string;
}

export interface BatchCreateBagGroupRateDTO {
  handBagId: string;
  groupRates: GroupRateItem[];
}

export interface ProductivityAnalysisResponse {
  handBag: any;
  groups: any[];
  averageOutputRate: number;
  highestOutputRate: number;
  lowestOutputRate: number;
}

// API Endpoints

/**
 * Lấy danh sách năng suất túi theo nhóm với bộ lọc và phân trang
 */
export const getBagGroupRatesList = async (
  params: BagGroupRateCondDTO
): Promise<BaseResponseData<BagGroupRate>> => {
  // Build query params
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  
  if (params.handBagId) queryParams.append('handBagId', params.handBagId);
  if (params.groupId) queryParams.append('groupId', params.groupId);
  if (params.active !== undefined) queryParams.append('active', params.active.toString());

  const response = await fetchWithAuth(`/bag-group-rates?${queryParams.toString()}`);

  return response;
};

/**
 * Lấy chi tiết năng suất túi theo nhóm bằng ID
 */
export const getBagGroupRateById = async (id: string): Promise<BagGroupRate> => {
  const response = await fetchWithAuth(`/bag-group-rates/${id}`);
  return response.data;
};

/**
 * Lấy danh sách năng suất túi cho một túi xách cụ thể
 */
export const getBagGroupRatesForHandBag = async (handBagId: string): Promise<BagGroupRate[]> => {
  const response = await fetchWithAuth(`/bag-group-rates/hand-bag/${handBagId}`);
  return response.data;
};

/**
 * Lấy danh sách năng suất túi cho một nhóm cụ thể
 */
export const getBagGroupRatesForGroup = async (groupId: string): Promise<BagGroupRate[]> => {
  const response = await fetchWithAuth(`/bag-group-rates/group/${groupId}`);
  return response.data;
};

/**
 * Tạo một năng suất túi theo nhóm mới
 */
export const createBagGroupRate = async (data: BagGroupRateCreateDTO): Promise<{ id: string }> => {
  const response = await fetchWithAuth('/bag-group-rates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  return { id: response.data.id };
};

/**
 * Tạo hoặc cập nhật hàng loạt năng suất túi theo nhóm
 */
export const batchCreateBagGroupRates = async (data: BatchCreateBagGroupRateDTO): Promise<string[]> => {
  const response = await fetchWithAuth('/bag-group-rates/batch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  return response.data.ids;
};

/**
 * Cập nhật năng suất túi theo nhóm
 */
export const updateBagGroupRate = async (id: string, data: BagGroupRateUpdateDTO): Promise<void> => {
  const response = await fetchWithAuth(`/bag-group-rates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  
  return response.data;
};

/**
 * Xóa năng suất túi theo nhóm
 */
export const deleteBagGroupRate = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`/bag-group-rates/${id}`, {
    method: 'DELETE',
  });
  
  return response.data;
};

/**
 * Lấy phân tích năng suất cho một túi xách cụ thể
 */
export const getProductivityAnalysisForHandBag = async (handBagId: string): Promise<ProductivityAnalysisResponse> => {
  const response = await fetchWithAuth(`/bag-group-rates/analysis/hand-bag/${handBagId}`);
  return response.data;
};

/**
 * Batch delete multiple bag group rates in parallel
 */
export const batchDeleteBagGroupRatesParallel = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map(id => deleteBagGroupRate(id)));
};






/**
 * Lấy danh sách túi đã được nhóm theo handBag
 */
export const getGroupedBagGroupRates = async (): Promise<{ handBags: HandBagWithStats[] }> => {
  const response = await fetchWithAuth('/bag-group-rates/group-by-hand-bags');
  return response.data;
};

/**
 * Lấy chi tiết tất cả các nhóm cho một handBag
 */
export const getHandBagGroupRatesDetailsApi = async (handBagId: string): Promise<HandBagDetailsResponse> => {
  const response = await fetchWithAuth(`/bag-group-rates/hand-bag/${handBagId}/details`);
  return response.data;
};

// Interface định nghĩa dữ liệu trả về
export interface HandBagWithStats {
  id: string;
  code: string;
  name: string;
  imageUrl?: string;
  totalGroups: number;
  averageOutputRate: number;
  lowestOutputRate: number;
  highestOutputRate: number;
}

export interface HandBagDetailsResponse {
  handBag: {
    id: string;
    code: string;
    name: string;
    imageUrl?: string;
    description?: string;
    material?: string;
    dimensions?: string;
  };
  groups: any[];
  statistics: {
    totalGroups: number;
    averageOutputRate: number;
    highestOutputRate: number;
    lowestOutputRate: number;
  };
}