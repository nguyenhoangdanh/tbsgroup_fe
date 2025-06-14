import { Factory, FactoryCondDTO, FactoryCreateDTO, FactoryUpdateDTO } from '@/common/interface/factory';
import { api } from '@/lib/api/api';
import { BaseService } from '@/lib/core/base-service';

import { FactoryAdapter } from './factory.adapter';

export class FactoryService extends BaseService<
  Factory,
  FactoryCondDTO,
  FactoryCreateDTO,
  FactoryUpdateDTO
> {
  protected basePath = '/factories';
  protected adapter = FactoryAdapter;

  // Add request deduplication to prevent multiple simultaneous requests
  private activeRequests = new Map<string, Promise<any>>();

  // Override getList with request deduplication and enhanced logging
  async getList(params: FactoryCondDTO = {} as FactoryCondDTO) {
    const requestKey = `getList-${JSON.stringify(params)}`;
    
    console.log('[FactoryService] getList called with params:', params);
    console.log('[FactoryService] Request key:', requestKey);
    
    // If same request is already in progress, return that promise
    if (this.activeRequests.has(requestKey)) {
      console.log('[FactoryService] Returning existing request for:', requestKey);
      return this.activeRequests.get(requestKey)!;
    }

    // Create new request
    console.log('[FactoryService] Creating new request for:', requestKey);
    const requestPromise = super.getList(params);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      console.log('[FactoryService] getList successful:', result);
      return result;
    } catch (error) {
      console.error('[FactoryService] getList error:', error);
      throw error;
    } finally {
      // Clean up after request completes
      this.activeRequests.delete(requestKey);
      console.log('[FactoryService] Request cleanup completed for:', requestKey);
    }
  }

  // Override update method with proper validation
  async update(id: string, data: FactoryUpdateDTO): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Update data is required');
    }

    try {
      console.log('[FactoryService] Updating factory with ID:', id, 'and data:', data);
      
      // Validate required fields for update
      const validation = this.adapter.validateData ? this.adapter.validateData(data) : { valid: true, errors: [] };
      if (!validation.valid) {
        console.error('[FactoryService] Validation failed:', validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      const updateRequest = this.adapter.toUpdateRequest(data);
      console.log('[FactoryService] Processed update request:', updateRequest);
      
      // Ensure we don't send empty objects
      if (Object.keys(updateRequest).length === 0) {
        throw new Error('No valid update data provided');
      }
      
      const response = await api.patch(`${this.basePath}/${id}`, updateRequest);
      console.log('[FactoryService] Update successful', response);
    } catch (error) {
      console.error(`[FactoryService] update error:`, error);
      throw error;
    }
  }

  // Additional factory-specific methods
  async getAccessibleFactories(): Promise<Factory[]> {
    try {
      const response = await api.get(`${this.basePath}/accessible`);
      const factories = response.data || [];
      return Array.isArray(factories) 
        ? factories.map(factory => this.adapter.toFactoryType(factory))
        : [];
    } catch (error) {
      console.error('[FactoryService] getAccessibleFactories error:', error);
      throw error;
    }
  }

  async getFactoryManagers(factoryId: string): Promise<any[]> {
    try {
      if (!factoryId) {
        throw new Error('Factory ID is required');
      }
      
      const response = await api.get(`${this.basePath}/${factoryId}/managers`);
      return response.data || [];
    } catch (error) {
      console.error('[FactoryService] getFactoryManagers error:', error);
      throw error;
    }
  }

  async addFactoryManager(factoryId: string, managerData: any): Promise<void> {
    try {
      if (!factoryId) {
        throw new Error('Factory ID is required');
      }
      
      if (!managerData) {
        throw new Error('Manager data is required');
      }

      await api.post(`${this.basePath}/${factoryId}/managers`, managerData);
    } catch (error) {
      console.error('[FactoryService] addFactoryManager error:', error);
      throw error;
    }
  }

  async removeFactoryManager(factoryId: string, userId: string): Promise<void> {
    try {
      if (!factoryId || !userId) {
        throw new Error('Factory ID and User ID are required');
      }

      await api.delete(`${this.basePath}/${factoryId}/managers/${userId}`);
    } catch (error) {
      console.error('[FactoryService] removeFactoryManager error:', error);
      throw error;
    }
  }

  async getFactoriesByDepartment(departmentId: string): Promise<Factory[]> {
    try {
      if (!departmentId) {
        throw new Error('Department ID is required');
      }

      const response = await api.get(`${this.basePath}/by-department/${departmentId}`);
      const factories = response.data || [];
      return Array.isArray(factories) 
        ? factories.map(factory => this.adapter.toFactoryType(factory))
        : [];
    } catch (error) {
      console.error('[FactoryService] getFactoriesByDepartment error:', error);
      throw error;
    }
  }

  async toggleFactoryStatus(id: string): Promise<Factory> {
    try {
      if (!id) {
        throw new Error('Factory ID is required');
      }

      const response = await api.patch(`${this.basePath}/${id}/toggle-status`);
      return this.adapter.toFactoryType(response.data);
    } catch (error) {
      console.error('[FactoryService] toggleFactoryStatus error:', error);
      throw error;
    }
  }
}

// Export single instance
export const factoryService = new FactoryService();

// Also export the class for compatibility
export { FactoryService as FactoryServiceClass };
