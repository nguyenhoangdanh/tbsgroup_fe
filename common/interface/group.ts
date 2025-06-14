import { BaseEntity } from '@/lib/core/base-service';

// Group leader interface
export interface GroupLeader {
  userId: string;
  groupId: string;
  isPrimary: boolean;
  startDate: Date;
  endDate?: Date | null;
  user?: {
    id: string;
    fullName: string;
    avatar?: string | null;
  };
}

// Group interface
export interface Group extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  teamId: string;
  
  // Related entities
  team?: any;
  leaders?: GroupLeader[];
  users?: any[];
}

// DTOs for creating and updating groups
export interface GroupCreateDTO {
  code: string;
  name: string;
  description?: string;
  teamId: string;
  userIds?: string[];
}

export interface GroupUpdateDTO {
  name?: string;
  description?: string;
  teamId?: string;
}

// Condition DTO for group queries
export interface GroupCondDTO {
  code?: string;
  name?: string;
  teamId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Group leader creation and update DTOs
export interface GroupLeaderDTO {
  userId: string;
  isPrimary?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Performance metrics for groups
export interface GroupPerformance {
  totalUsers: number;
  totalBagRates: number;
  avgOutputRate: number;
  highestRate?: {
    handBagCode: string;
    handBagName: string;
    outputRate: number;
  } | null;
  lowestRate?: {
    handBagCode: string;
    handBagName: string;
    outputRate: number;
  } | null;
}

// Response format for group lists
export interface GroupListResponse {
  data: Group[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

// Group leader creation and update DTOs
export interface GroupLeaderCreateDTO {
  groupId: string;
  userId: string;
  isPrimary?: boolean;
  startDate: Date;
  endDate?: Date | null;
}

export interface GroupLeaderUpdateDTO {
  isPrimary?: boolean;
  endDate?: Date | null;
}
