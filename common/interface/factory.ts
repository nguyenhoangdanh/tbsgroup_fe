import { BaseEntity } from '@/lib/core/base-service';

export interface Factory extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  departmentId: string;
  managingDepartmentId?: string;
  
  // Related entities
  department?: any;
  managingDepartment?: any;
  managers?: any[];
  lines?: any[];
}

export interface FactoryCreateDTO {
  code: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  departmentId: string;
  managingDepartmentId?: string;
}

export interface FactoryUpdateDTO {
  code?: string;
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  departmentId?: string;
  managingDepartmentId?: string;
}

export interface FactoryCondDTO {
  search?: string;
  code?: string;
  name?: string;
  departmentId?: string;
  managingDepartmentId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FactoryListResponse {
  data: Factory[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface FactoryManagerDTO {
  userId: string;
  role?: string;
  permissions?: string[];
}
