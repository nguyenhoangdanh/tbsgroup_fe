// src/common/interface/bagGroupRate.ts

/**
 * Interface định nghĩa cấu trúc BagGroupRate
 */
export interface BagGroupRate {
    id: string;
    handBagId: string;
    groupId: string;
    outputRate: number;
    notes?: string | null;
    active: boolean;
    createdAt: string;
  updatedAt: string;
  handBagCode: string;
  handBagName: string;
  groupCode: string; 
  groupName: string;
    
    // Relations - optional khi không luôn có sẵn
    handBag?: {
      id: string;
      code: string;
      name: string;
      description?: string;
      imageUrl?: string;
      active: boolean;
     
    };
    
    group?: {
      id: string;
      code: string;
      name: string;
      description?: string;
      teamId: string;
      team?: {
        id: string;
        name: string;
        code: string;
      };
    };
  }
  
  /**
   * Interface cho phân tích năng suất 
   */
  export interface ProductivityAnalysis {
    handBag: {
      id: string;
      code: string;
      name: string;
      description?: string;
      imageUrl?: string;
      active: boolean;
      bagColors?: any[];
    };
    groups: Array<{
      id: string;
      handBagId: string;
      groupId: string;
      outputRate: number;
      notes?: string;
      active: boolean;
      createdAt: string;
      updatedAt: string;
      group: {
        id: string;
        code: string;
        name: string;
        description?: string;
        teamId: string;
        team: {
          id: string;
          name: string;
          code: string;
        };
        leaders?: Array<{
          userId: string;
          isPrimary: boolean;
          user: {
            id: string;
            fullName: string;
            employeeId: string;
            email?: string;
          };
        }>;
      };
      memberCount: number;
      performancePercentage: string;
      isHighPerformer: boolean;
      outputPerMember: string;
    }>;
    averageOutputRate: number;
    highestOutputRate: number;
    lowestOutputRate: number;
  }