import { BaseEntity } from '@/lib/core/base-service';

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  departmentType: 'HEAD_OFFICE' | 'FACTORY_OFFICE';
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentCreateDTO {
  code: string;
  name: string;
  description?: string | null;
  departmentType: 'HEAD_OFFICE' | 'FACTORY_OFFICE';
  parentId?: string | null;
}

export interface DepartmentUpdateDTO {
  name?: string;
  description?: string | null;
  departmentType?: 'HEAD_OFFICE' | 'FACTORY_OFFICE';
  parentId?: string | null;
}

export interface DepartmentCondDTO {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  code?: string;
  name?: string;
  departmentType?: 'HEAD_OFFICE' | 'FACTORY_OFFICE';
  parentId?: string | null;
}

export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[];
}

export interface DepartmentWithDetails extends Department {
  parent?: Department | null;
  children?: Department[];
  factories?: any[];
  users?: any[];
}
