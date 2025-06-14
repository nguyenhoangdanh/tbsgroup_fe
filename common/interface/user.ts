import { Role } from '@/lib/types/auth';
import { UserStatusEnum } from '../enum';
import { RoleType } from './role';

// Base user interface matching backend User model
export interface UserType {
  id: string;
  username: string;
  password?: string; // Optional for responses (excluded for security)
  salt?: string; // Optional for responses (excluded for security)
  avatar?: string;
  fullName: string;
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
  roleId: string;
  role: RoleType;
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
  search?: string;
  status?: UserStatusEnum;
  role?: string;
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
}

// User profile update DTO matching backend UserUpdateProfileDTO
export interface UserProfileUpdateRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

// User role assignment DTO matching backend UserRoleAssignmentDTO
export interface UserRoleAssignmentRequest {
  roleId: string;
  scope?: string;
}

// User role response
export interface UserRoleResponse {
  id: string;
  name: string;
  code: string;
  scope?: string;
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
