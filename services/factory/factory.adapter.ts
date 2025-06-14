import { Factory, FactoryCreateDTO, FactoryUpdateDTO, FactoryCondDTO } from '@/common/interface/factory';

/**
 * Factory data adapter for transforming between frontend and backend formats
 */
export class FactoryAdapter {
  /**
   * Transform backend factory data to frontend Factory type
   */
  static toFactoryType(backendFactory: any): Factory {
    if (!backendFactory) {
      throw new Error('Backend factory data is required');
    }

    const factoryData = backendFactory.data || backendFactory;

    return {
      id: factoryData.id || '',
      code: factoryData.code || '',
      name: factoryData.name || '',
      description: factoryData.description || null,
      address: factoryData.address || null,
      departmentId: factoryData.departmentId || null,
      managingDepartmentId: factoryData.managingDepartmentId || null,
      // FIX: Return Date objects instead of ISO strings to match BaseEntity
      createdAt: factoryData.createdAt ? new Date(factoryData.createdAt) : new Date(),
      updatedAt: factoryData.updatedAt ? new Date(factoryData.updatedAt) : new Date(),
      
      // Related entities
      department: factoryData.department,
      managingDepartment: factoryData.managingDepartment,
    };
  }

  /**
   * Transform frontend form data to backend create request
   */
  static toCreateRequest(formData: FactoryCreateDTO): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    return {
      code: formData.code?.trim() || '',
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || null,
      address: formData.address?.trim() || null,
      phone: formData.phone?.trim() || null,
      departmentId: formData.departmentId || null,
      managingDepartmentId: formData.managingDepartmentId || null,
    };
  }

  /**
   * Transform frontend form data to backend update request
   */
  static toUpdateRequest(formData: FactoryUpdateDTO): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    console.log('[FactoryAdapter] Converting form data to update request:', formData);

    // Remove id from update request and handle undefined values
    const { id, ...updateData } = formData as any;
    
    const cleanedData = {
      name: updateData.name?.trim() || undefined,
      description: updateData.description?.trim() || undefined,
      address: updateData.address?.trim() || undefined,
      departmentId: updateData.departmentId || undefined,
      managingDepartmentId: updateData.managingDepartmentId || undefined,
    };

    // Remove undefined values to avoid sending them to backend
    const result = Object.fromEntries(
      Object.entries(cleanedData).filter(([key, value]) => value !== undefined)
    );

    console.log('[FactoryAdapter] Final update request:', result);
    return result;
  }

  /**
   * Transform frontend filter params to backend query params
   */
  static toBackendFilters(frontendFilters: FactoryCondDTO): Record<string, any> {
    if (!frontendFilters) {
      return {};
    }

    const params: Record<string, any> = {};

    // Pagination
    if (frontendFilters.page !== undefined) params.page = frontendFilters.page;
    if (frontendFilters.limit !== undefined) params.limit = frontendFilters.limit;
    if (frontendFilters.sortBy) params.sortBy = frontendFilters.sortBy;
    if (frontendFilters.sortOrder) params.sortOrder = frontendFilters.sortOrder;

    // Search conditions
    if (frontendFilters.search) params.search = frontendFilters.search;
    if (frontendFilters.code) params.code = frontendFilters.code;
    if (frontendFilters.name) params.name = frontendFilters.name;
    if (frontendFilters.departmentId) params.departmentId = frontendFilters.departmentId;
    if (frontendFilters.managingDepartmentId) params.managingDepartmentId = frontendFilters.managingDepartmentId;
    if (frontendFilters.departmentType) params.departmentType = frontendFilters.departmentType;

    return params;
  }

  // Add method for base service compatibility
  static toEntityType(backendFactory: any): Factory {
    return this.toFactoryType(backendFactory);
  }

  static validateData(factoryData: any): { valid: boolean; errors: string[] } {
    return this.validateFactoryData(factoryData);
  }

  /**
   * Validate factory data before sending to backend
   */
  static validateFactoryData(factoryData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!factoryData) {
      errors.push('Dữ liệu nhà máy là bắt buộc');
      return { valid: false, errors };
    }

    // Required fields validation
    if (!factoryData.code || factoryData.code.length < 2) {
      errors.push('Mã nhà máy phải có ít nhất 2 ký tự');
    }

    if (!factoryData.name || factoryData.name.length < 2) {
      errors.push('Tên nhà máy phải có ít nhất 2 ký tự');
    }

    // Phone validation (if provided)
    if (factoryData.phone && !/^[0-9+\-\s()]{10,15}$/.test(factoryData.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate default factory data for forms
   */
  static getDefaultFactoryData(): FactoryCreateDTO {
    return {
      code: '',
      name: '',
      description: '',
      address: '',
      phone: '',
      departmentId: '',
      managingDepartmentId: '',
    };
  }

  /**
   * Transform factory data for display purposes
   */
  static formatFactoryForDisplay(factory: Factory): {
    displayName: string;
    displayCode: string;
    initials: string;
  } {
    if (!factory) {
      return {
        displayName: 'Unknown Factory',
        displayCode: 'N/A',
        initials: 'F',
      };
    }

    const displayName = factory.name || 'Unknown Factory';
    const displayCode = factory.code || 'N/A';
    const initials = factory.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);

    return {
      displayName,
      displayCode,
      initials,
    };
  }
}
