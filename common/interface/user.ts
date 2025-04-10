import { UserStatusEnum } from "../enum";

export interface UserListParams {
  page?: number;
  limit?: number;
  username?: string;
  fullName?: string;
  role?: string;
  status?: UserStatusEnum;
}

export interface UserType {
  id: string;
  username: string;
  password: string;
  email?: string;
  fullName: string;
  employeeId?: string;
  cardId?: string;
  roleId?: string;
  role?: string;
  status?: UserStatusEnum;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}
export interface UserItemType extends UserType {}

export interface UserWithRelationsType extends UserType {
  // Thêm các trường quan hệ nếu cần
}

export interface UserListResponse {
  data: UserType[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

