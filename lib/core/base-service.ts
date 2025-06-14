import { api, PaginatedResponse } from '@/lib/api/api';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export abstract class BaseService<
  T extends BaseEntity,
  P extends ListParams,
  CreateData,
  UpdateData
> {
  protected abstract basePath: string;
  protected abstract adapter: any;

  // CRITICAL FIX: Add request deduplication
  private static activeRequests = new Map<string, Promise<any>>();

  private createRequestKey(method: string, path: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${method}:${path}:${paramsStr}`;
  }

  async getList(params: P = {} as P): Promise<ListResponse<T>> {
    // CRITICAL FIX: Implement request deduplication
    const requestKey = this.createRequestKey('GET', this.basePath, params);
    
    if (BaseService.activeRequests.has(requestKey)) {
      console.log(`[${this.constructor.name}] Deduplicating getList request:`, requestKey);
      return BaseService.activeRequests.get(requestKey)!;
    }

    const requestPromise = this.executeGetList(params);
    BaseService.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up after 100ms to allow for quick successive calls
      setTimeout(() => {
        BaseService.activeRequests.delete(requestKey);
      }, 100);
    }
  }

  private async executeGetList(params: P): Promise<ListResponse<T>> {
    try {
      console.log(`[${this.constructor.name}] getList called with params:`, params);
      
      const backendParams = this.adapter.toBackendFilters ? this.adapter.toBackendFilters(params) : params;
      console.log(`[${this.constructor.name}] Backend params:`, backendParams);
      
      const response = await api.get(`${this.basePath}`, backendParams);
      console.log(`[${this.constructor.name}] API response:`, response);
      
      if (Array.isArray(response.data)) {
        const result = {
          data: response.data.map((item: any) => this.adapter.toEntityType ? this.adapter.toEntityType(item) : item),
          total: response.data.length,
          page: params.page || 1,
          limit: params.limit || response.data.length,
          totalPages: 1,
        };
        console.log(`[${this.constructor.name}] Returning array response:`, result);
        return result;
      }

      const result = {
        data: response.data?.data ? response.data.data.map((item: any) => this.adapter.toEntityType ? this.adapter.toEntityType(item) : item) : [],
        total: response.data?.total || 0,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: Math.ceil((response.data?.total || 0) / (params.limit || 10)),
      };
      console.log(`[${this.constructor.name}] Returning paginated response:`, result);
      return result;
    } catch (error) {
      console.error(`[${this.constructor.name}] getList error:`, error);
      throw error;
    }
  }

  async getById(id: string): Promise<T> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }

    try {
      const response = await api.get(`${this.basePath}/${id}`);
      return this.adapter.toEntityType ? this.adapter.toEntityType(response.data) : response.data;
    } catch (error) {
      console.error(`[${this.constructor.name}] getById error:`, error);
      throw error;
    }
  }

  async create(data: CreateData): Promise<T> {
    if (!data || typeof data !== 'object') {
      throw new Error('Data is required');
    }

    try {
      const validation = this.adapter.validateData?.(data);
      if (validation && !validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const createRequest = this.adapter.toCreateRequest ? this.adapter.toCreateRequest(data) : data;
      const response = await api.post(this.basePath, createRequest);
      
      const entityData = response.data?.data || response.data;
      if (!entityData) {
        throw new Error('No data returned from server');
      }

      return this.adapter.toEntityType ? this.adapter.toEntityType(entityData) : entityData;
    } catch (error) {
      console.error(`[${this.constructor.name}] create error:`, error);
      throw error;
    }
  }

  async update(id: string, data: UpdateData): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Update data is required');
    }

    try {
      const updateRequest = this.adapter.toUpdateRequest ? this.adapter.toUpdateRequest(data) : data;
      await api.patch(`${this.basePath}/${id}`, updateRequest);
    } catch (error) {
      console.error(`[${this.constructor.name}] update error:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }

    try {
      await api.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`[${this.constructor.name}] delete error:`, error);
      throw error;
    }
  }

  async batchDelete(ids: string[]): Promise<void> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('IDs array is required and must not be empty');
    }

    try {
      await api.batchDelete(this.basePath, ids);
    } catch (error) {
      console.error(`[${this.constructor.name}] batchDelete error:`, error);
      throw error;
    }
  }
}
