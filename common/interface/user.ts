import { UserStatusEnum } from '../enum';
import { RoleType } from './role';

// Base user interface matching backend User model
export interface UserType {
  id: string;
  username: string;
  password?: string; // Optional for responses (excluded for security)
  salt?: string; // Optional for responses (excluded for security)
  avatar?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  cardId?: string;
  employeeId?: string;
  status: UserStatusEnum;
  factoryId?: string;
  lineId?: string;
  teamId?: string;
  groupId?: string;
  positionId?: string;
  roleId?: string;
  role?: RoleType;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Related entities (when included)
  factory?: any;
  line?: any;
  team?: any;
  group?: any;
  position?: any;
  roleEntity?: any;
}

// User profile interface (without sensitive data)
export interface UserProfileType extends Omit<UserType, 'password' | 'salt' | 'passwordResetToken'> {}

// User list parameters matching backend UserCondDTO + PaginationDTO
export interface UserListParams {
  // Pagination
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Search conditions
  username?: string;
  fullName?: string;
  status?: UserStatusEnum;
  factoryId?: string;
  lineId?: string;
  teamId?: string;
  groupId?: string;
  positionId?: string;
  roleId?: string;
  roleCode?: string;
}

// User list response matching backend response
export interface UserListResponse {
  data: UserProfileType[];
  total: number;
  page: number;
  limit: number;
}

// User update DTO matching backend UserUpdateDTO
export interface UserUpdateRequest {
  username?: string;
  avatar?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  cardId?: string;
  employeeId?: string;
  status?: UserStatusEnum;
  factoryId?: string;
  lineId?: string;
  teamId?: string;
  groupId?: string;
  positionId?: string;
  roleId?: string;
  defaultRoleId?: string;
}

// User profile update DTO matching backend UserUpdateProfileDTO
export interface UserProfileUpdateRequest {
  avatar?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

// User role assignment DTO matching backend UserRoleAssignmentDTO
export interface UserRoleAssignmentRequest {
  roleId: string;
  scope?: string;
  expiryDate?: Date;
}

// User role response
export interface UserRoleResponse {
  roleId: string;
  role: string;
  scope?: string;
  expiryDate?: Date;
}

// User item type (alias for compatibility)
export interface UserItemType extends UserProfileType {}

// User with relations type (when includes are used)
export interface UserWithRelationsType extends UserProfileType {
  factory?: any;
  line?: any;
  team?: any;
  group?: any;
  position?: any;
  roleEntity?: any;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User access check response
export interface UserAccessResponse {
  hasAccess: boolean;
}
