import { Department, DepartmentCreateDTO, DepartmentUpdateDTO, DepartmentCondDTO } from '@/common/interface/department';

/**
 * Department data adapter for transforming between frontend and backend formats
 */
export class DepartmentAdapter {
  /**
   * Transform backend department data to frontend Department type
   */
  static toDepartmentType(backendDepartment: any): Department {
    if (!backendDepartment) {
      throw new Error('Backend department data is required');
    }

    const departmentData = backendDepartment.data || backendDepartment;

    return {
      id: departmentData.id || '',
      code: departmentData.code || '',
      name: departmentData.name || '',
      description: departmentData.description || null,
      departmentType: departmentData.departmentType || departmentData.department_type || 'HEAD_OFFICE',
      parentId: departmentData.parentId || departmentData.parent_id || null,
      createdAt: departmentData.createdAt ? new Date(departmentData.createdAt) : new Date(),
      updatedAt: departmentData.updatedAt ? new Date(departmentData.updatedAt) : new Date(),
    };
  }

  /**
   * Transform frontend form data to backend create request
   */
  static toCreateRequest(formData: DepartmentCreateDTO): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    return {
      code: formData.code?.trim() || '',
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || null,
      departmentType: formData.departmentType || 'HEAD_OFFICE',
      parentId: formData.parentId || null,
    };
  }

  /**
   * Transform frontend form data to backend update request
   */
  static toUpdateRequest(formData: DepartmentUpdateDTO): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    console.log('[DepartmentAdapter] Converting form data to update request:', formData);

    const { ...updateData } = formData as any;
    
    const cleanedData = {
      name: updateData.name?.trim() || undefined,
      description: updateData.description?.trim() || undefined,
      departmentType: updateData.departmentType || undefined,
      parentId: updateData.parentId || undefined,
    };

    // Remove undefined values
    const result = Object.fromEntries(
      Object.entries(cleanedData).filter(([key, value]) => value !== undefined)
    );

    console.log('[DepartmentAdapter] Final update request:', result);
    return result;
  }

  /**
   * Transform frontend filter params to backend query params
   */
  static toBackendFilters(frontendFilters: DepartmentCondDTO): Record<string, any> {
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
    if (frontendFilters.departmentType) params.departmentType = frontendFilters.departmentType;
    if (frontendFilters.parentId !== undefined) params.parentId = frontendFilters.parentId;

    return params;
  }

  // Add method for base service compatibility
  static toEntityType(backendDepartment: any): Department {
    return this.toDepartmentType(backendDepartment);
  }

  static validateData(departmentData: any): { valid: boolean; errors: string[] } {
    return this.validateDepartmentData(departmentData);
  }

  /**
   * Validate department data before sending to backend
   */
  static validateDepartmentData(departmentData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!departmentData) {
      errors.push('Dữ liệu phòng ban là bắt buộc');
      return { valid: false, errors };
    }

    // Required fields validation
    if (!departmentData.code || departmentData.code.length < 2) {
      errors.push('Mã phòng ban phải có ít nhất 2 ký tự');
    }

    if (!departmentData.name || departmentData.name.length < 3) {
      errors.push('Tên phòng ban phải có ít nhất 3 ký tự');
    }

    // Department type validation
    if (!departmentData.departmentType || !['HEAD_OFFICE', 'FACTORY_OFFICE'].includes(departmentData.departmentType)) {
      errors.push('Loại phòng ban không hợp lệ');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate default department data for forms
   */
  static getDefaultDepartmentData(): DepartmentCreateDTO {
    return {
      code: '',
      name: '',
      description: '',
      departmentType: 'HEAD_OFFICE',
      parentId: null,
    };
  }

  /**
   * Transform department data for display purposes
   */
  static formatDepartmentForDisplay(department: Department): {
    displayName: string;
    displayCode: string;
    initials: string;
    typeText: string;
  } {
    if (!department) {
      return {
        displayName: 'Unknown Department',
        displayCode: 'N/A',
        initials: 'D',
        typeText: 'N/A',
      };
    }

    const displayName = department.name || 'Unknown Department';
    const displayCode = department.code || 'N/A';
    const initials = department.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    const typeText = department.departmentType === 'HEAD_OFFICE' ? 'Văn phòng điều hành' : 'Văn phòng nhà máy';

    return {
      displayName,
      displayCode,
      initials,
      typeText,
    };
  }
}
