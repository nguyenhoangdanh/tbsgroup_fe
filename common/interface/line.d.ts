// Line Interfaces for Frontend

export interface Line {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  factoryId: string;
  capacity?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LineCreateDTO {
  code: string;
  name: string;
  factoryId: string;
  description?: string | null;
  capacity?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface LineUpdateDTO {
  id: string;
  factoryId?: string; // Optional if needed
  code: string;
  name: string;
  description?: string | null;
  capacity?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface LineCondDTO {
  code?: string;
  name?: string;
  factoryId?: string;
  search?: string;
}

export interface LineManagerDTO {
  userId: string;
  isPrimary?: boolean;
  startDate: Date;
  endDate?: Date | null;
}

export interface LineManager {
  userId: string;
  isPrimary: boolean;
  startDate: Date;
  endDate: Date | null;
  user?: {
    id: string;
    fullName: string;
    avatar?: string | null;
  };
}

export interface LineWithDetails extends Line {
  managers?: LineManager[];
  teams?: any[]; // Thêm kiểu dữ liệu cụ thể nếu cần
}