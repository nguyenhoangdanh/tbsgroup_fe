import { BaseEntity } from '@/lib/core/base-service';

export interface Team extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  lineId: string;
  
  // Related entities
  line?: any;
  leaders?: TeamLeader[];
  groups?: any[];
}

export interface TeamCreateDTO {
  code: string;
  name: string;
  description?: string;
  lineId: string;
}

export interface TeamUpdateDTO {
  name?: string;
  description?: string;
  lineId?: string;
}

export interface TeamCondDTO {
  code?: string;
  name?: string;
  lineId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TeamLeader {
  userId: string;
  isPrimary: boolean;
  startDate: Date;
  endDate?: Date | null;
  user?: {
    id: string;
    fullName: string;
    avatar?: string | null;
  };
}

export interface TeamLeaderDTO {
  userId: string;
  isPrimary?: boolean;
  startDate: Date;
  endDate?: Date | null;
}

export interface TeamListResponse {
  data: Team[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}
