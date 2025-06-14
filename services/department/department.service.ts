import { Department, DepartmentCondDTO, DepartmentCreateDTO, DepartmentUpdateDTO, DepartmentTreeNode } from '@/common/interface/department';
import { api } from '@/lib/api/api';
import { BaseService } from '@/lib/core/base-service';

import { DepartmentAdapter } from './department.adapter';

export class DepartmentService extends BaseService<
  Department,
  DepartmentCondDTO,
  DepartmentCreateDTO,
  DepartmentUpdateDTO
> {
  protected basePath = '/departments';
  protected adapter = DepartmentAdapter;

  // Enhanced request deduplication with specific keys
  private activeRequests = new Map<string, Promise<any>>();

  // Cache for organization tree specifically
  private organizationTreeCache: {
    data: DepartmentTreeNode[] | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0,
  };

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Clear cache method
  clearCache() {
    this.organizationTreeCache.data = null;
    this.organizationTreeCache.timestamp = 0;
    this.activeRequests.clear();
  }

  // Override getList with enhanced request deduplication
  async getList(params: DepartmentCondDTO = {} as DepartmentCondDTO) {
    const requestKey = `getList-${JSON.stringify(params)}`;
    
    console.log('[DepartmentService] getList called with params:', params);
    
    if (this.activeRequests.has(requestKey)) {
      console.log('[DepartmentService] Returning existing request for:', requestKey);
      return this.activeRequests.get(requestKey)!;
    }

    const requestPromise = super.getList(params);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      console.log('[DepartmentService] getList successful:', result);
      return result;
    } catch (error) {
      console.error('[DepartmentService] getList error:', error);
      throw error;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  // Override update method with proper validation
  async update(id: string, data: DepartmentUpdateDTO): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Update data is required');
    }

    try {
      console.log('[DepartmentService] Updating department with ID:', id, 'and data:', data);
      
      const validation = this.adapter.validateData ? this.adapter.validateData(data) : { valid: true, errors: [] };
      if (!validation.valid) {
        console.error('[DepartmentService] Validation failed:', validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      const updateRequest = this.adapter.toUpdateRequest(data);
      console.log('[DepartmentService] Processed update request:', updateRequest);
      
      if (Object.keys(updateRequest).length === 0) {
        throw new Error('No valid update data provided');
      }
      
      const response = await api.patch(`${this.basePath}/${id}`, updateRequest);
      console.log('[DepartmentService] Update successful', response);
    } catch (error) {
      console.error(`[DepartmentService] update error:`, error);
      throw error;
    }
  }

  // Department-specific methods
  async getDepartmentByCode(code: string): Promise<Department | null> {
    try {
      if (!code) {
        throw new Error('Department code is required');
      }
      
      const response = await api.get(`${this.basePath}/code/${code}`);
      return response.data ? this.adapter.toDepartmentType(response.data) : null;
    } catch (error) {
      console.error('[DepartmentService] getDepartmentByCode error:', error);
      throw error;
    }
  }

  // Enhanced organization tree with caching
  async getOrganizationTree(): Promise<DepartmentTreeNode[]> {
    const requestKey = 'organizationTree';
    
    // Check cache first
    const now = Date.now();
    if (this.organizationTreeCache.data && 
        (now - this.organizationTreeCache.timestamp) < this.CACHE_DURATION) {
      console.log('[DepartmentService] Returning cached organization tree');
      return this.organizationTreeCache.data;
    }

    // Check for active request
    if (this.activeRequests.has(requestKey)) {
      console.log('[DepartmentService] Returning existing organization tree request');
      return this.activeRequests.get(requestKey)!;
    }

    console.log('[DepartmentService] Fetching organization tree from API...');
    const requestPromise = (async () => {
      try {
        const response = await api.get(`${this.basePath}/tree/organization`);
        const data = response.data || [];
        
        // Update cache
        this.organizationTreeCache.data = data;
        this.organizationTreeCache.timestamp = now;
        
        console.log('[DepartmentService] Organization tree fetched and cached:', data.length);
        return data;
      } catch (error) {
        console.error('[DepartmentService] getOrganizationTree error:', error);
        throw error;
      }
    })();

    this.activeRequests.set(requestKey, requestPromise);

    try {
      return await requestPromise;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  // Enhanced getRootDepartments with deduplication
  async getRootDepartments(): Promise<Department[]> {
    const requestKey = 'rootDepartments';
    
    if (this.activeRequests.has(requestKey)) {
      console.log('[DepartmentService] Returning existing root departments request');
      return this.activeRequests.get(requestKey)!;
    }

    console.log('[DepartmentService] Fetching root departments...');
    const requestPromise = this.getList({ parentId: null }).then(response => response.data || []);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      console.log('[DepartmentService] Root departments fetched:', result.length);
      return result;
    } catch (error) {
      console.error('[DepartmentService] getRootDepartments error:', error);
      throw error;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  async getDepartmentHierarchy(id: string): Promise<Department[]> {
    try {
      if (!id) {
        throw new Error('Department ID is required');
      }
      
      const response = await api.get(`${this.basePath}/${id}/hierarchy`);
      const departments = response.data || [];
      return Array.isArray(departments) 
        ? departments.map(dept => this.adapter.toDepartmentType(dept))
        : [];
    } catch (error) {
      console.error('[DepartmentService] getDepartmentHierarchy error:', error);
      throw error;
    }
  }

  // Enhanced getDepartmentsByType with deduplication
  async getDepartmentsByType(type: 'HEAD_OFFICE' | 'FACTORY_OFFICE'): Promise<Department[]> {
    const requestKey = `departmentsByType-${type}`;
    
    if (this.activeRequests.has(requestKey)) {
      console.log('[DepartmentService] Returning existing departments by type request for:', type);
      return this.activeRequests.get(requestKey)!;
    }

    console.log('[DepartmentService] Fetching departments by type:', type);
    const requestPromise = this.getList({ departmentType: type }).then(response => response.data || []);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      console.log('[DepartmentService] Departments by type fetched:', type, result.length);
      return result;
    } catch (error) {
      console.error('[DepartmentService] getDepartmentsByType error:', error);
      throw error;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  async getChildDepartments(parentId: string): Promise<Department[]> {
    try {
      if (!parentId) {
        throw new Error('Parent ID is required');
      }

      const response = await this.getList({ parentId });
      return response.data || [];
    } catch (error) {
      console.error('[DepartmentService] getChildDepartments error:', error);
      throw error;
    }
  }
}

// Export single instance
export const departmentService = new DepartmentService();

// Also export the class for compatibility
export { DepartmentService as DepartmentServiceClass };
