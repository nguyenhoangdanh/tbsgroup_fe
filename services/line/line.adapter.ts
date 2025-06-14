import { Line, LineCreateDTO, LineUpdateDTO, LineCondDTO } from '@/common/interface/line';

/**
 * Line data adapter for transforming between frontend and backend formats
 */
export class LineAdapter {
  /**
   * Transform backend line data to frontend Line type
   */
  static toLineType(backendLine: any): Line {
    if (!backendLine) {
      throw new Error('Backend line data is required');
    }

    const lineData = backendLine.data || backendLine;

    return {
      id: lineData.id || '',
      code: lineData.code || '',
      name: lineData.name || '',
      description: lineData.description || null,
      factoryId: lineData.factoryId || '',
      capacity: lineData.capacity || 0,
      status: lineData.status || 'ACTIVE',
      // FIX: Return Date objects instead of ISO strings to match BaseEntity
      createdAt: lineData.createdAt ? new Date(lineData.createdAt) : new Date(),
      updatedAt: lineData.updatedAt ? new Date(lineData.updatedAt) : new Date(),
      
      // Related entities
      factory: lineData.factory,
      managers: lineData.managers,
    };
  }

  /**
   * Transform frontend form data to backend create request
   */
  static toCreateRequest(formData: LineCreateDTO): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    return {
      code: formData.code?.trim() || '',
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || null,
      factoryId: formData.factoryId || '',
      capacity: formData.capacity || 0,
    };
  }

  /**
   * Transform frontend form data to backend update request
   */
  static toUpdateRequest(formData: LineUpdateDTO): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    console.log('[LineAdapter] Converting form data to update request:', formData);

    // Remove id from update request and handle undefined values
    const { id, ...updateData } = formData as any;
    
    const cleanedData = {
      code: updateData.code?.trim() || undefined,
      name: updateData.name?.trim() || undefined,
      description: updateData.description?.trim() || undefined,
      factoryId: updateData.factoryId || undefined,
      capacity: updateData.capacity !== undefined ? Number(updateData.capacity) : undefined,
      status: updateData.status || undefined,
    };

    // Remove undefined values to avoid sending them to backend
    const result = Object.fromEntries(
      Object.entries(cleanedData).filter(([key, value]) => value !== undefined)
    );

    console.log('[LineAdapter] Final update request:', result);
    return result;
  }

  /**
   * Transform frontend filter params to backend query params
   */
  static toBackendFilters(frontendFilters: LineCondDTO): Record<string, any> {
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
    if (frontendFilters.factoryId) params.factoryId = frontendFilters.factoryId;
    if (frontendFilters.status) params.status = frontendFilters.status;

    return params;
  }

  // Add method for base service compatibility
  static toEntityType(backendLine: any): Line {
    return this.toLineType(backendLine);
  }

  static validateData(lineData: any): { valid: boolean; errors: string[] } {
    return this.validateLineData(lineData);
  }

  /**
   * Validate line data before sending to backend
   */
  static validateLineData(lineData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!lineData) {
      errors.push('Dữ liệu dây chuyền là bắt buộc');
      return { valid: false, errors };
    }

    // Required fields validation
    if (!lineData.code || lineData.code.length < 2) {
      errors.push('Mã dây chuyền phải có ít nhất 2 ký tự');
    }

    if (!lineData.name || lineData.name.length < 2) {
      errors.push('Tên dây chuyền phải có ít nhất 2 ký tự');
    }

    if (!lineData.factoryId) {
      errors.push('Nhà máy là bắt buộc');
    }

    // Capacity validation (if provided)
    if (lineData.capacity !== undefined && lineData.capacity < 0) {
      errors.push('Công suất phải là số dương');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate default line data for forms
   */
  static getDefaultLineData(): LineCreateDTO {
    return {
      code: '',
      name: '',
      description: '',
      factoryId: '',
      capacity: 0,
    };
  }

  /**
   * Transform line data for display purposes
   */
  static formatLineForDisplay(line: Line): {
    displayName: string;
    displayCode: string;
    initials: string;
  } {
    if (!line) {
      return {
        displayName: 'Unknown Line',
        displayCode: 'N/A',
        initials: 'L',
      };
    }

    const displayName = line.name || 'Unknown Line';
    const displayCode = line.code || 'N/A';
    const initials = line.name
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
