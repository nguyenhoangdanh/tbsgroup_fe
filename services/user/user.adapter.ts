import { UserStatusEnum } from '@/common/enum';
import { UserType, UserProfileType, UserListParams, UserUpdateRequest, UserListResponse } from '@/common/interface/user';

/**
 * User data adapter for transforming between frontend and backend formats
 */
export class UserAdapter {
  /**
   * Transform backend user data to frontend UserType
   */
  static toUserType(backendUser: any): UserType {
    if (!backendUser) {
      throw new Error('Backend user data is required');
    }

    // Handle case where response might be nested in a data property
    const userData = backendUser.data || backendUser;

    return {
      id: userData.id || '',
      username: userData.username || '',
      password: userData.password, // Only present in create/update contexts
      salt: userData.salt,
      avatar: userData.avatar,
      fullName: userData.fullName || '',
      email: userData.email,
      phone: userData.phone,
      cardId: userData.cardId,
      employeeId: userData.employeeId,
      status: userData.status as UserStatusEnum || UserStatusEnum.PENDING_ACTIVATION,
      factoryId: userData.factoryId,
      lineId: userData.lineId,
      teamId: userData.teamId,
      groupId: userData.groupId,
      positionId: userData.positionId,
      roleId: userData.roleId,
      role: userData.role, // Role code from backend
      passwordResetToken: userData.passwordResetToken,
      passwordResetExpiry: userData.passwordResetExpiry ? new Date(userData.passwordResetExpiry) : undefined,
      lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined,
      createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
      updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date(),
      
      // Related entities
      factory: userData.factory,
      line: userData.line,
      team: userData.team,
      group: userData.group,
      position: userData.position,
      roleEntity: userData.roleEntity || userData.role,
    };
  }

  /**
   * Transform backend user data to frontend UserProfileType
   */
  static toUserProfileType(backendUser: any): UserProfileType {
    if (!backendUser) {
      throw new Error('Backend user data is required');
    }

    const userType = this.toUserType(backendUser);
    // Remove sensitive fields for profile type
    const { password, salt, passwordResetToken, ...profileData } = userType;
    return profileData as UserProfileType;
  }

  /**
   * Transform frontend form data to backend create request
   */
  static toCreateRequest(formData: any): any {
    if (!formData) {
      throw new Error('Form data is required');
    }

    return {
      username: formData.username || '',
      password: formData.password || '',
      fullName: formData.fullName || '',
      employeeId: formData.employeeId || '',
      cardId: formData.cardId || '',
      roleId: formData.roleId || '',
      status: formData.status || UserStatusEnum.PENDING_ACTIVATION,
      email: formData.email,
      phone: formData.phone,
      factoryId: formData.factoryId,
      lineId: formData.lineId,
      teamId: formData.teamId,
      groupId: formData.groupId,
      positionId: formData.positionId,
    };
  }

  /**
   * Transform frontend form data to backend update request
   */
  static toUpdateRequest(formData: any): UserUpdateRequest {
    if (!formData) {
      throw new Error('Form data is required');
    }

    console.log('[UserAdapter] Converting form data to update request:', formData);

    // Remove id and password from update request and handle undefined values
    const { id, password, ...updateData } = formData;
    
    const cleanedData = {
      username: updateData.username || undefined,
      avatar: updateData.avatar || undefined,
      fullName: updateData.fullName || undefined,
      email: updateData.email || undefined,
      phone: updateData.phone || undefined,
      cardId: updateData.cardId || undefined,
      employeeId: updateData.employeeId || undefined,
      status: updateData.status || undefined,
      factoryId: updateData.factoryId || undefined,
      lineId: updateData.lineId || undefined,
      teamId: updateData.teamId || undefined,
      groupId: updateData.groupId || undefined,
      positionId: updateData.positionId || undefined,
      roleId: updateData.roleId || undefined,
    };

    // Remove undefined values to avoid sending them to backend
    const result = Object.fromEntries(
      Object.entries(cleanedData).filter(([key, value]) => value !== undefined)
    );

    console.log('[UserAdapter] Final update request:', result);
    return result as UserUpdateRequest;
  }

  /**
   * Transform frontend filter params to backend query params
   */
  static toBackendFilters(frontendFilters: UserListParams): Record<string, any> {
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
    if (frontendFilters.status) params.status = frontendFilters.status;
    if (frontendFilters.role) params.role = frontendFilters.role;

    return params;
  }

  // Add new method for base service compatibility
  static toEntityType(backendUser: any): UserProfileType {
    return this.toUserProfileType(backendUser);
  }

  static validateData(userData: any): { valid: boolean; errors: string[] } {
    return this.validateUserData(userData);
  }

  /**
   * Transform backend list response to frontend format - Updated for actual response structure
   */
  static toListResponse(backendResponse: any): UserListResponse {
    if (!backendResponse) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };
    }

    // Handle direct array response (like in your attachment)
    if (Array.isArray(backendResponse)) {
      return {
        data: backendResponse.map((user: any) => this.toUserProfileType(user)),
        total: backendResponse.length,
        page: 1,
        limit: backendResponse.length,
      };
    }

    // Handle nested object response { data: [...], total: ..., etc }
    if (backendResponse.data && Array.isArray(backendResponse.data)) {
      return {
        data: backendResponse.data.map((user: any) => this.toUserProfileType(user)),
        total: backendResponse.total || backendResponse.data.length,
        page: backendResponse.page || 1,
        limit: backendResponse.limit || backendResponse.data.length,
      };
    }

    // Handle direct object response (single user case)
    if (backendResponse.id) {
      return {
        data: [this.toUserProfileType(backendResponse)],
        total: 1,
        page: 1,
        limit: 1,
      };
    }

    // Fallback for any other structure
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    };
  }

  /**
   * Validate user data before sending to backend
   */
  static validateUserData(userData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!userData) {
      errors.push('Dữ liệu người dùng là bắt buộc');
      return { valid: false, errors };
    }

    // Required fields validation
    if (!userData.username || userData.username.length < 3) {
      errors.push('Tên đăng nhập phải có ít nhất 3 ký tự');
    }

    if (!userData.fullName || userData.fullName.length < 2) {
      errors.push('Họ tên phải có ít nhất 2 ký tự');
    }

    if (!userData.employeeId) {
      errors.push('Mã nhân viên là bắt buộc');
    }

    if (!userData.roleId) {
      errors.push('Vai trò là bắt buộc');
    }

    // Password validation (for create)
    if (userData.password && userData.password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Email validation (if provided)
    if (userData.email && !/\S+@\S+\.\S+/.test(userData.email)) {
      errors.push('Email không hợp lệ');
    }

    // Phone validation (if provided)
    if (userData.phone && !/^[0-9+\-\s()]{10,15}$/.test(userData.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate default user data for forms
   */
  static getDefaultUserData(): any {
    return {
      username: '',
      password: 'Abc@123',
      fullName: '',
      employeeId: '',
      cardId: '',
      roleId: '',
      status: UserStatusEnum.PENDING_ACTIVATION,
      email: '',
      phone: '',
    };
  }

  /**
   * Check if user has permission for specific action
   */
  static hasPermission(user: UserProfileType, action: string, target?: any): boolean {
    if (!user || !action) {
      return false;
    }

    // This could be expanded based on your role-based permission system
    switch (action) {
      case 'edit_user':
        return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      case 'delete_user':
        return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      case 'assign_role':
        return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      case 'view_user':
        return true; // All authenticated users can view
      default:
        return false;
    }
  }

  /**
   * Transform user data for display purposes
   */
  static formatUserForDisplay(user: UserProfileType): {
    displayName: string;
    displayRole: string;
    displayStatus: string;
    initials: string;
  } {
    if (!user) {
      return {
        displayName: 'Unknown User',
        displayRole: 'No Role',
        displayStatus: 'Unknown',
        initials: 'U',
      };
    }

    const displayName = user.fullName || user.username || 'Unknown User';
    const initials = displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);

    return {
      displayName,
      displayRole: this.formatRole(user.role),
      displayStatus: this.formatStatus(user.status),
      initials,
    };
  }

  /**
   * Format role for display
   */
  private static formatRole(role?: string): string {
    if (!role) return 'No Role';
    
    const roleMap: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN': 'Administrator',
      'MANAGER': 'Manager',
      'USER': 'User',
      'EMPLOYEE': 'Employee',
    };

    return roleMap[role] || role;
  }

  /**
   * Format status for display
   */
  private static formatStatus(status?: UserStatusEnum): string {
    if (!status) return 'Unknown';
    
    const statusMap: Record<UserStatusEnum, string> = {
      [UserStatusEnum.ACTIVE]: 'Hoạt động',
      [UserStatusEnum.INACTIVE]: 'Không hoạt động',
      [UserStatusEnum.PENDING_ACTIVATION]: 'Chờ kích hoạt',
      [UserStatusEnum.SUSPENDED]: 'Tạm khóa',
    };

    return statusMap[status] || status;
  }
}