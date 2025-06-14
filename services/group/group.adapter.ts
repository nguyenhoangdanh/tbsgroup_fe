import { Group, GroupCreateDTO, GroupUpdateDTO, GroupCondDTO } from '@/common/interface/group';

export class GroupAdapter {
  static toGroupType(backendGroup: any): Group {
    if (!backendGroup) {
      throw new Error('Backend group data is required');
    }

    const groupData = backendGroup.data || backendGroup;

    return {
      id: groupData.id || '',
      code: groupData.code || '',
      name: groupData.name || '',
      description: groupData.description || '',
      teamId: groupData.teamId || '',
      createdAt: groupData.createdAt ? new Date(groupData.createdAt) : new Date(),
      updatedAt: groupData.updatedAt ? new Date(groupData.updatedAt) : new Date(),
      
      // Related entities
      team: groupData.team,
      leaders: groupData.leaders || [],
      users: groupData.users || [],
    };
  }

  static toCreateRequest(formData: GroupCreateDTO): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    return {
      code: formData.code?.trim() || '',
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || '',
      teamId: formData.teamId || '',
      userIds: formData.userIds || [],
    };
  }

  static toUpdateRequest(formData: GroupUpdateDTO): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    const { id, ...updateData } = formData as any;
    
    const cleanedData = {
      name: updateData.name?.trim() || undefined,
      description: updateData.description?.trim() || undefined,
      teamId: updateData.teamId || undefined,
    };

    return Object.fromEntries(
      Object.entries(cleanedData).filter(([key, value]) => value !== undefined)
    );
  }

  static toBackendFilters(frontendFilters: GroupCondDTO): Record<string, any> {
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
    if (frontendFilters.teamId) params.teamId = frontendFilters.teamId;

    return params;
  }

  static toEntityType(backendGroup: any): Group {
    return this.toGroupType(backendGroup);
  }

  static validateData(groupData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!groupData) {
      errors.push('Dữ liệu nhóm là bắt buộc');
      return { valid: false, errors };
    }

    if (!groupData.code || groupData.code.length < 2) {
      errors.push('Mã nhóm phải có ít nhất 2 ký tự');
    }

    if (!groupData.name || groupData.name.length < 2) {
      errors.push('Tên nhóm phải có ít nhất 2 ký tự');
    }

    if (!groupData.teamId) {
      errors.push('Tổ là bắt buộc');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
