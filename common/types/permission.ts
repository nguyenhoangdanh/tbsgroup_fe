import { PermissionType } from "../enum";

// Định nghĩa các kiểu dữ liệu dựa trên backend DTO
export type PermissionDTO = {
  id: string;
  code: string;
  name: string;
  description?: string;
    type: PermissionType;
  module?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatePermissionDTO = {
  code: string;
  name: string;
  description?: string;
  type?: PermissionType;
  module?: string;
  isActive?: boolean;
};

export type UpdatePermissionDTO = Partial<CreatePermissionDTO>;

export type PermissionCondDTO = {
  code?: string;
  name?: string;
  type?: PermissionType;
  module?: string;
  isActive?: boolean;
};

export type RolePermissionAssignmentDTO = {
  roleId: string;
  permissionIds: string[];
  canGrant?: boolean;
  grantCondition?: string;
};

export type AssignPermissionsDTO = {
  permissionIds: string[];
};

export type UserPermissionsQueryDTO = {
  userId?: string;
  includeInactive?: boolean;
  type?: PermissionType;
  module?: string;
};

export type PaginationDTO = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

// Kiểu kết quả trả về cho danh sách quyền
export type PermissionListResponse = {
  data: PermissionDTO[];
  total: number;
  page: number;
  limit: number;
};

// Kiểu kết quả trả về cho quyền của người dùng
export type UserPermissionsResponse = {
  permissions: PermissionDTO[];
  pageAccess: string[];
  featureAccess: string[];
  dataAccess: string[];
};

// Kiểu kết quả trả về cho kiểm tra quyền
export type CheckPermissionResponse = {
  hasPermission: boolean;
};

// Kiểu kết quả trả về cho quyền truy cập client
export type ClientAccessResponse = {
  pages: string[];
  features: string[];
};