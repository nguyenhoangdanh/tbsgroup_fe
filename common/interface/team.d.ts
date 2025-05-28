// Team Interfaces for Frontend

export interface Team {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  lineId: string;
  lineName?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  leaders?: TeamLeader[];
  isPublic?: boolean;
  isLineLimited?: boolean;
  isEditLimited?: boolean;
  autoAssign?: boolean;
}

export interface TeamCreateDTO {
  code: string;
  name: string;
  lineId: string;
  description?: string | null;
}

export interface TeamUpdateDTO {
  name?: string;
  description?: string | null;
}

export interface TeamCondDTO {
  code?: string;
  name?: string;
  lineId?: string;
  search?: string;
}

export interface TeamLeaderDTO {
  userId: string;
  isPrimary?: boolean;
  startDate: Date;
  endDate?: Date | null;
}

export interface TeamLeader {
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

// Extended interface for team with additional details
export interface TeamWithDetails extends Team {
  leaders: TeamLeader[];
}
