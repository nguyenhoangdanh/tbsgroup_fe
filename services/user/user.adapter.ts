import { UserStatusEnum } from '@/common/enum';
import { RoleType } from '@/common/interface/role';
import { UserType, UserProfileType, UserListParams, UserUpdateRequest, UserListResponse } from '@/common/interface/user';

/**
 * User data adapter for transforming between frontend and backend formats
 */
export class UserAdapter {
  /**
   * Transform backend user data to frontend UserType
   */
  static toUserType(backendUser: Record<string, unknown>): UserType {
    if (!backendUser) {
      throw new Error('Backend user data is required');
    }

    // Handle case where response might be nested in a data property
    const userData = (backendUser.data as Record<string, unknown>) || backendUser;

    return {
      id: (userData.id as string) || '',
      username: (userData.username as string) || '',
      password: userData.password as string, // Only present in create/update contexts
      salt: userData.salt as string,
      avatar: userData.avatar as string,
      fullName: (userData.fullName as string) || '',
      email: userData.email as string,
      phone: userData.phone as string,
      cardId: userData.cardId as string,
      employeeId: userData.employeeId as string,
      status: (userData.status as UserStatusEnum) || UserStatusEnum.PENDING_ACTIVATION,
      factoryId: userData.factoryId as string,
      lineId: userData.lineId as string,
      teamId: userData.teamId as string,
      groupId: userData.groupId as string,
      positionId: userData.positionId as string,
      roleId: userData.roleId as string,
      role: userData.role as RoleType, // Role code from backend
      passwordResetToken: userData.passwordResetToken as string,
      passwordResetExpiry: userData.passwordResetExpiry ? new Date(userData.passwordResetExpiry as string) : undefined,
      lastLogin: userData.lastLogin ? new Date(userData.lastLogin as string) : undefined,
      createdAt: userData.createdAt ? new Date(userData.createdAt as string) : new Date(),
      updatedAt: userData.updatedAt ? new Date(userData.updatedAt as string) : new Date(),
      
      // Related entities
      factory: userData.factory as Record<string, unknown>,
      line: userData.line as Record<string, unknown>,
      team: userData.team as Record<string, unknown>,
      group: userData.group as Record<string, unknown>,
      position: userData.position as Record<string, unknown>,
      roleEntity: (userData.roleEntity as Record<string, unknown>) || (userData.role as Record<string, unknown>),
    };
  }

  /**
   * Transform backend user data to frontend UserProfileType
   */
  static toUserProfileType(backendUser: Record<string, unknown>): UserProfileType {
    if (!backendUser) {
      throw new Error('Backend user data is required');
    }

    const userType = this.toUserType(backendUser);
    // Remove sensitive fields for profile type
    const { password: _password, salt: _salt, passwordResetToken: _passwordResetToken, ...profileData } = userType;
    return profileData as UserProfileType;
  }

  /**
   * Transform frontend form data to backend create request
   */
  static toCreateRequest(formData: Record<string, unknown>): Record<string, unknown> {
    if (!formData) {
      throw new Error('Form data is required');
    }

    return {
      username: (formData.username as string) || '',
      password: (formData.password as string) || '',
      fullName: (formData.fullName as string) || '',
      employeeId: (formData.employeeId as string) || '',
      cardId: (formData.cardId as string) || '',
      roleId: (formData.roleId as string) || '',
      status: (formData.status as UserStatusEnum) || UserStatusEnum.PENDING_ACTIVATION,
      email: formData.email as string,
      phone: formData.phone as string,
      factoryId: formData.factoryId as string,
      lineId: formData.lineId as string,
      teamId: formData.teamId as string,
      groupId: formData.groupId as string,
      positionId: formData.positionId as string,
    };
  }

  /**
   * Transform frontend form data to backend update request
   */
  static toUpdateRequest(formData: Record<string, unknown>): UserUpdateRequest {
    if (!formData) {
      throw new Error('Form data is required');
    }

    // Remove id and password from update request and handle undefined values
    const { id: _id, password: _password, ...updateData } = formData;
    
    const cleanedData = {
      username: updateData.username as string || undefined,
      avatar: updateData.avatar as string || undefined,
      fullName: updateData.fullName as string || undefined,
      email: updateData.email as string || undefined,
      phone: updateData.phone as string || undefined,
      cardId: updateData.cardId as string || undefined,
      employeeId: updateData.employeeId as string || undefined,
      status: updateData.status as UserStatusEnum || undefined,
      factoryId: updateData.factoryId as string || undefined,
      lineId: updateData.lineId as string || undefined,
      teamId: updateData.teamId as string || undefined,
      groupId: updateData.groupId as string || undefined,
      positionId: updateData.positionId as string || undefined,
      roleId: updateData.roleId as string || undefined,
    };

    // Remove undefined values to avoid sending them to backend
    const result = Object.fromEntries(
      Object.entries(cleanedData).filter(([_key, value]) => value !== undefined)
    );

    return result as UserUpdateRequest;
  }

  /**
   * Transform frontend filter params to backend query params
   */
  static toBackendFilters(frontendFilters: UserListParams): Record<string, unknown> {
    if (!frontendFilters) {
      return {};
    }

    const params: Record<string, unknown> = {};

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
  static toEntityType(backendUser: Record<string, unknown>): UserProfileType {
    return this.toUserProfileType(backendUser);
  }

  static validateData(userData: Record<string, unknown>): { valid: boolean; errors: string[] } {
    return this.validateUserData(userData);
  }

  /**
   * Transform backend list response to frontend format - Updated for actual response structure
   */
  static toListResponse(backendResponse: unknown): UserListResponse {
    if (!backendResponse) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };
    }

    // Handle direct array response
    if (Array.isArray(backendResponse)) {
      return {
        data: backendResponse.map((user: Record<string, unknown>) => this.toUserProfileType(user)),
        total: backendResponse.length,
        page: 1,
        limit: backendResponse.length,
      };
    }

    const response = backendResponse as Record<string, unknown>;

    // Handle nested object response { data: [...], total: ..., etc }
    if (response.data && Array.isArray(response.data)) {
      return {
        data: response.data.map((user: Record<string, unknown>) => this.toUserProfileType(user)),
        total: (response.total as number) || response.data.length,
        page: (response.page as number) || 1,
        limit: (response.limit as number) || response.data.length,
      };
    }

    // Handle direct object response (single user case)
    if (response.id) {
      return {
        data: [this.toUserProfileType(response)],
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
  static validateUserData(userData: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!userData) {
      errors.push('Dữ liệu người dùng là bắt buộc');
      return { valid: false, errors };
    }

    // Required fields validation
    const username = userData.username as string;
    if (!username || username.length < 3) {
      errors.push('Tên đăng nhập phải có ít nhất 3 ký tự');
    }

    const fullName = userData.fullName as string;
    if (!fullName || fullName.length < 2) {
      errors.push('Họ tên phải có ít nhất 2 ký tự');
    }

    if (!userData.employeeId) {
      errors.push('Mã nhân viên là bắt buộc');
    }

    if (!userData.roleId) {
      errors.push('Vai trò là bắt buộc');
    }

    // Password validation (for create)
    const password = userData.password as string;
    if (password && password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Email validation (if provided)
    const email = userData.email as string;
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors.push('Email không hợp lệ');
    }

    // Phone validation (if provided)
    const phone = userData.phone as string;
    if (phone && !/^[0-9+\-\s()]{10,15}$/.test(phone)) {
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
  static getDefaultUserData(): Record<string, unknown> {
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
  static hasPermission(user: UserProfileType, action: string, _target?: unknown): boolean {
    if (!user || !action) {
      return false;
    }

    // Safe permission checking with explicit string comparison
    const validActions = ['edit_user', 'delete_user', 'assign_role', 'view_user'];
    if (!validActions.includes(action)) {
      return false;
    }

    const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
    
    // Handle both string role and RoleType object
    const userRoleCode = typeof user.role === 'string' ? user.role : user.role?.code || '';
    
    switch (action) {
      case 'edit_user':
      case 'delete_user':
      case 'assign_role':
        return adminRoles.includes(userRoleCode);
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

    // Handle both string role and RoleType object
    const roleForDisplay = typeof user.role === 'string' ? user.role : user.role?.code;

    return {
      displayName,
      displayRole: this.formatRole(roleForDisplay),
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

    // Safe object access
    return Object.prototype.hasOwnProperty.call(roleMap, role) ? roleMap[role] : role;
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