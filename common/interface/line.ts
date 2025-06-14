import { BaseEntity } from '@/lib/core/base-service';

export interface Line extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  factoryId: string;
  capacity?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  
  // Related entities
  factory?: {
    id: string;
    name: string;
  };
  managers?: LineManager[];
}

export interface LineManager {
  id: string;
  lineId: string;
  userId: string;
  isPrimary: boolean;
  startDate: Date;
  endDate?: Date;
  user?: {
    id: string;
    fullName: string;
    username: string;
  };
}

export interface LineCreateDTO {
  code: string;
  name: string;
  description?: string;
  factoryId: string;
  capacity?: number;
}

export interface LineUpdateDTO {
  code?: string;
  name?: string;
  description?: string;
  factoryId?: string;
  capacity?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface LineCondDTO {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  factoryId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface LineManagerDTO {
  userId: string;
  isPrimary?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface LineWithDetails extends Line {
  managers: LineManager[];
  factory: {
    id: string;
    name: string;
    code: string;
  };
}
