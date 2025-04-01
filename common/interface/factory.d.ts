// Factory data interfaces
export interface Factory {
    id: string;
    code: string;
    name: string;
    description: string | null;
    address: string | null;
    departmentId: string | null;
    managingDepartmentId: string | null;
    createdAt: string;
    updatedAt: string;
    department?: {
      id: string;
      name: string;
      type: string;
    } | null;
    managingDepartment?: {
      id: string;
      name: string;
      type: string;
    } | null;
  }
  
  // Factory manager data interface
  export interface FactoryManager {
    userId: string;
    isPrimary: boolean;
    startDate: string;
    endDate: string | null;
    user?: {
      id: string;
      fullName: string;
      avatar?: string | null;
    };
  }
  
  // Factory condition DTO for filtering
  export interface FactoryCondDTO {
    code?: string;
    name?: string;
    departmentId?: string;
    managingDepartmentId?: string;
    departmentType?: 'HEAD_OFFICE' | 'FACTORY_OFFICE';
    search?: string;
  }
  
  // Factory creation DTO
  export interface FactoryCreateDTO {
    code: string;
    name: string;
    description?: string;
    address?: string;
    departmentId?: string;
    managingDepartmentId?: string;
  }
  
  // Factory update DTO
  export interface FactoryUpdateDTO {
    name?: string;
    description?: string;
    address?: string;
    departmentId?: string;
    managingDepartmentId?: string;
  }
  
  // Factory manager DTO
  export interface FactoryManagerDTO {
    userId: string;
    isPrimary: boolean;
    startDate: Date;
    endDate?: Date | null;
  }
  
  // Factory with full details
  export interface FactoryWithDetails extends Factory {
    managers: FactoryManager[];
    lines: {
      id: string;
      code: string;
      name: string;
    }[];
  }
  
  // Department types enum
  export enum DepartmentType {
    HEAD_OFFICE = 'HEAD_OFFICE',
    FACTORY_OFFICE = 'FACTORY_OFFICE'
  }