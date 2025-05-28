import {
  getHandBagsList,
  getHandBagById,
  getHandBagFullDetails,
  createHandBag,
  updateHandBag,
  deleteHandBag,
} from '@/apis/handbag/handbag.api';
import {
  HandBag,
  HandBagCondDTO,
  HandBagCreateDTO,
  HandBagUpdateDTO,
} from '@/common/interface/handbag';
import { BasePaginationParams, BaseResponseData } from '@/hooks/base/useBaseQueries';
import { HandBagWithDetails } from '@/hooks/handbag/useHandBagDetails';

interface HandBagFilters {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  category?: string;
  code?: string;
  name?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const handbagService = {
  /**
   * Lấy danh sách handbag theo filter
   */
  async listHandBags(filters: HandBagFilters): Promise<BaseResponseData<HandBag>> {
    const params: HandBagCondDTO & BasePaginationParams = {
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      active: filters.active,
      category: filters.category,
      code: filters.code,
      name: filters.name,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder as 'asc' | 'desc' | undefined,
    };

    return getHandBagsList(params);
  },

  /**
   * Lấy chi tiết một handbag
   */
  async getHandBag(id: string): Promise<HandBag> {
    return getHandBagById(id);
  },

  /**
   * Lấy chi tiết đầy đủ của handbag bao gồm các màu và công đoạn
   */
  async getHandBagFullDetails(id: string): Promise<HandBagWithDetails> {
    return getHandBagFullDetails(id);
  },

  /**
   * Tạo handbag mới
   */
  async createHandBag(data: HandBagCreateDTO): Promise<{ id: string }> {
    return createHandBag(data);
  },

  /**
   * Cập nhật thông tin handbag
   */
  async updateHandBag(id: string, data: HandBagUpdateDTO): Promise<void> {
    return updateHandBag(id, data);
  },

  /**
   * Xóa handbag
   */
  async deleteHandBag(id: string): Promise<void> {
    return deleteHandBag(id);
  },
};
