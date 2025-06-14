import { Team, TeamCreateDTO, TeamUpdateDTO, TeamCondDTO } from '@/common/interface/team';

export class TeamAdapter {
  static toTeamType(backendTeam: any): Team {
    if (!backendTeam) {
      throw new Error('Backend team data is required');
    }

    const teamData = backendTeam.data || backendTeam;

    return {
      id: teamData.id || '',
      code: teamData.code || '',
      name: teamData.name || '',
      description: teamData.description || '',
      lineId: teamData.lineId || '',
      createdAt: teamData.createdAt ? new Date(teamData.createdAt) : new Date(),
      updatedAt: teamData.updatedAt ? new Date(teamData.updatedAt) : new Date(),
      
      // Related entities
      line: teamData.line,
      leaders: teamData.leaders || [],
      groups: teamData.groups || [],
    };
  }

  static toCreateRequest(formData: TeamCreateDTO): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    return {
      code: formData.code?.trim() || '',
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || '',
      lineId: formData.lineId || '',
    };
  }

  static toUpdateRequest(formData: TeamUpdateDTO): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    const { id, ...updateData } = formData as any;
    
    const cleanedData = {
      name: updateData.name?.trim() || undefined,
      description: updateData.description?.trim() || undefined,
      lineId: updateData.lineId || undefined,
    };

    return Object.fromEntries(
      Object.entries(cleanedData).filter(([key, value]) => value !== undefined)
    );
  }

  static toBackendFilters(frontendFilters: TeamCondDTO): Record<string, any> {
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
    if (frontendFilters.lineId) params.lineId = frontendFilters.lineId;

    return params;
  }

  static toEntityType(backendTeam: any): Team {
    return this.toTeamType(backendTeam);
  }

  static validateData(teamData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!teamData) {
      errors.push('Dữ liệu tổ là bắt buộc');
      return { valid: false, errors };
    }

    if (!teamData.code || teamData.code.length < 2) {
      errors.push('Mã tổ phải có ít nhất 2 ký tự');
    }

    if (!teamData.name || teamData.name.length < 2) {
      errors.push('Tên tổ phải có ít nhất 2 ký tự');
    }

    if (!teamData.lineId) {
      errors.push('Dây chuyền là bắt buộc');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
