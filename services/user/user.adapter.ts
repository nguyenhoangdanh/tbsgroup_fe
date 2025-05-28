import { UserStatusEnum } from '@/common/enum';
import { 
  UserType, 
  UserProfileType, 
  UserListParams, 
  UserUpdateRequest,
  UserListResponse 
} from '@/common/interface/user';
import { TUserSchema } from '@/schemas/user';

/**
 * User data adapter for transforming between frontend and backend formats
 */
export class UserAdapter {
  /**
   * Transform backend user data to frontend UserType
   */
  static toUserType(backendUser: any): UserType {
    return {
      id: backendUser.id,
      username: backendUser.username,
      password: backendUser.password, // Only present in create/update contexts
      salt: backendUser.salt,
      avatar: backendUser.avatar,
      fullName: backendUser.fullName,
      email: backendUser.email,
      phone: backendUser.phone,
      cardId: backendUser.cardId,
      employeeId: backendUser.employeeId,
      status: backendUser.status as UserStatusEnum,
      factoryId: backendUser.factoryId,
      lineId: backendUser.lineId,
      teamId: backendUser.teamId,
      groupId: backendUser.groupId,
      positionId: backendUser.positionId,
      roleId: backendUser.roleId,
      role: backendUser.role, // Role code from backend
      passwordResetToken: backendUser.passwordResetToken,
      passwordResetExpiry: backendUser.passwordResetExpiry ? new Date(backendUser.passwordResetExpiry) : undefined,
      lastLogin: backendUser.lastLogin ? new Date(backendUser.lastLogin) : undefined,
      createdAt: new Date(backendUser.createdAt),
      updatedAt: new Date(backendUser.updatedAt),
      
      // Related entities
      factory: backendUser.factory,
      line: backendUser.line,
      team: backendUser.team,
      group: backendUser.group,
      position: backendUser.position,
      roleEntity: backendUser.roleEntity || backendUser.role,
    };
  }

  /**
   * Transform backend user profile data to frontend UserProfileType
   */
  static toUserProfileType(backendUser: any): UserProfileType {
    const userType = this.toUserType(backendUser);
    // Remove sensitive fields for profile type
    const { password, salt, passwordResetToken, ...profileData } = userType;
    return profileData;
  }

  /**
   * Transform frontend form data to backend create request
   */
  static toCreateRequest(formData: Omit<TUserSchema, 'id'>): any {
    return {
      username: formData.username,
      password: formData.password,
      fullName: formData.fullName,
      employeeId: formData.employeeId,
      cardId: formData.cardId,
      roleId: formData.roleId,
      status: formData.status,
    };
  }

  /**
   * Transform frontend form data to backend update request
   */
  static toUpdateRequest(formData: Partial<TUserSchema>): UserUpdateRequest {
    // Remove id and password from update request
    const { id, password, ...updateData } = formData;
    
    return {
      username: updateData.username,
      avatar: updateData.avatar,
      fullName: updateData.fullName,
      email: updateData.email,
      phone: updateData.phone,
      cardId: updateData.cardId,
      employeeId: updateData.employeeId,
      status: updateData.status,
      factoryId: updateData.factoryId,
      lineId: updateData.lineId,
      teamId: updateData.teamId,
      groupId: updateData.groupId,
      positionId: updateData.positionId,
      roleId: updateData.roleId,
    };
  }

  /**
   * Transform frontend filter params to backend query params
   */
  static toBackendFilters(frontendFilters: UserListParams): Record<string, any> {
    const params: Record<string, any> = {};

    // Pagination
    if (frontendFilters.page !== undefined) params.page = frontendFilters.page;
    if (frontendFilters.limit !== undefined) params.limit = frontendFilters.limit;
    if (frontendFilters.sortBy) params.sortBy = frontendFilters.sortBy;
    if (frontendFilters.sortOrder) params.sortOrder = frontendFilters.sortOrder;

    // Search conditions
    if (frontendFilters.username) params.username = frontendFilters.username;
    if (frontendFilters.fullName) params.fullName = frontendFilters.fullName;
    if (frontendFilters.status) params.status = frontendFilters.status;
    if (frontendFilters.factoryId) params.factoryId = frontendFilters.factoryId;
    if (frontendFilters.lineId) params.lineId = frontendFilters.lineId;
    if (frontendFilters.teamId) params.teamId = frontendFilters.teamId;
    if (frontendFilters.groupId) params.groupId = frontendFilters.groupId;
    if (frontendFilters.positionId) params.positionId = frontendFilters.positionId;
    if (frontendFilters.roleId) params.roleId = frontendFilters.roleId;
    if (frontendFilters.roleCode) params.roleCode = frontendFilters.roleCode;

    return params;
  }

  /**
   * Transform backend list response to frontend format
   */
  static toListResponse(backendResponse: any): UserListResponse {
    return {
      data: (backendResponse.data || []).map((user: any) => this.toUserProfileType(user)),
      total: backendResponse.total || 0,
      page: backendResponse.page || 1,
      limit: backendResponse.limit || 10,
    };
  }

  /**
   * Transform backend paginated response to legacy format for compatibility
   */
  static toLegacyListResponse(backendResponse: any): {
    data: UserProfileType[];
    meta: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      itemsPerPage: number;
    };
  } {
    const { data, total, page, limit } = this.toListResponse(backendResponse);
    
    return {
      data,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Validate user data before sending to backend
   */
  static validateUserData(userData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

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
  static getDefaultUserData(): Omit<TUserSchema, 'id'> {
    return {
      username: '',
      password: 'Abc@123',
      fullName: '',
      employeeId: '',
      cardId: '',
      roleId: '',
      status: UserStatusEnum.PENDING_ACTIVATION,
    };
  }

  /**
   * Check if user has permission for specific action
   */
  static hasPermission(user: UserProfileType, action: string, target?: any): boolean {
    // This could be expanded based on your role-based permission system
    switch (action) {
      case 'edit_user':
        return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      case 'delete_user':
        return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      case 'assign_role':
        return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      default:
        return false;
    }
  }
}