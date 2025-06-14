import { Line, LineCondDTO, LineCreateDTO, LineUpdateDTO, LineManagerDTO } from '@/common/interface/line';
import { api } from '@/lib/api/api';
import { BaseService } from '@/lib/core/base-service';

import { LineAdapter } from './line.adapter';

export class LineService extends BaseService<
  Line,
  LineCondDTO,
  LineCreateDTO,
  LineUpdateDTO
> {
  protected basePath = '/lines';
  protected adapter = LineAdapter;

  // Add request deduplication to prevent multiple simultaneous requests
  private activeRequests = new Map<string, Promise<any>>();

  // Override getList with request deduplication
  async getList(params: LineCondDTO = {} as LineCondDTO) {
    const requestKey = `getList-${JSON.stringify(params)}`;
    
    console.log('[LineService] getList called with params:', params);
    
    // If same request is already in progress, return that promise
    if (this.activeRequests.has(requestKey)) {
      console.log('[LineService] Returning existing request for:', requestKey);
      return this.activeRequests.get(requestKey)!;
    }

    // Create new request
    console.log('[LineService] Creating new request for:', requestKey);
    const requestPromise = super.getList(params);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      console.log('[LineService] getList successful:', result);
      return result;
    } catch (error) {
      console.error('[LineService] getList error:', error);
      throw error;
    } finally {
      // Clean up after request completes
      this.activeRequests.delete(requestKey);
      console.log('[LineService] Request cleanup completed for:', requestKey);
    }
  }

  // Override update method with proper validation
  async update(id: string, data: LineUpdateDTO): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Update data is required');
    }

    try {
      console.log('[LineService] Updating line with ID:', id, 'and data:', data);
      
      // Validate required fields for update
      const validation = this.adapter.validateData ? this.adapter.validateData(data) : { valid: true, errors: [] };
      if (!validation.valid) {
        console.error('[LineService] Validation failed:', validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      const updateRequest = this.adapter.toUpdateRequest(data);
      console.log('[LineService] Processed update request:', updateRequest);
      
      // Ensure we don't send empty objects
      if (Object.keys(updateRequest).length === 0) {
        throw new Error('No valid update data provided');
      }
      
      const response = await api.patch(`${this.basePath}/${id}`, updateRequest);
      console.log('[LineService] Update successful', response);
    } catch (error) {
      console.error(`[LineService] update error:`, error);
      throw error;
    }
  }

  // Additional line-specific methods
  async getByFactoryId(factoryId: string): Promise<Line[]> {
    try {
      if (!factoryId) {
        throw new Error('Factory ID is required');
      }

      const response = await api.get(`${this.basePath}/factory/${factoryId}`);
      const lines = response.data?.data || [];
      return Array.isArray(lines) 
        ? lines.map(line => this.adapter.toLineType(line))
        : [];
    } catch (error) {
      console.error('[LineService] getByFactoryId error:', error);
      throw error;
    }
  }

  async getAccessibleLines(): Promise<Line[]> {
    try {
      const response = await api.get(`${this.basePath}/accessible`);
      const lines = response.data?.data || [];
      return Array.isArray(lines) 
        ? lines.map(line => this.adapter.toLineType(line))
        : [];
    } catch (error) {
      console.error('[LineService] getAccessibleLines error:', error);
      throw error;
    }
  }

  async getLineManagers(lineId: string): Promise<any[]> {
    try {
      if (!lineId) {
        throw new Error('Line ID is required');
      }
      
      const response = await api.get(`${this.basePath}/${lineId}/managers`);
      return response.data?.data || [];
    } catch (error) {
      console.error('[LineService] getLineManagers error:', error);
      throw error;
    }
  }

  async addLineManager(lineId: string, managerData: LineManagerDTO): Promise<void> {
    try {
      if (!lineId) {
        throw new Error('Line ID is required');
      }
      
      if (!managerData) {
        throw new Error('Manager data is required');
      }

      await api.post(`${this.basePath}/${lineId}/managers`, managerData);
    } catch (error) {
      console.error('[LineService] addLineManager error:', error);
      throw error;
    }
  }

  async removeLineManager(lineId: string, userId: string): Promise<void> {
    try {
      if (!lineId || !userId) {
        throw new Error('Line ID and User ID are required');
      }

      await api.delete(`${this.basePath}/${lineId}/managers/${userId}`);
    } catch (error) {
      console.error('[LineService] removeLineManager error:', error);
      throw error;
    }
  }

  async canManageLine(lineId: string): Promise<boolean> {
    try {
      if (!lineId) {
        throw new Error('Line ID is required');
      }

      const response = await api.get(`${this.basePath}/${lineId}/can-manage`);
      return response.data?.data || false;
    } catch (error) {
      console.error('[LineService] canManageLine error:', error);
      return false;
    }
  }
}

export const lineService = new LineService();
export { LineService as LineServiceClass };
