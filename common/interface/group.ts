import { UserType } from './user';

// Group leader interface
export interface GroupLeader {
  userId: string;
  groupId: string;
  isPrimary: boolean;
  startDate: string;
  endDate?: string | null;
  user?: {
    id: string;
    fullName: string;
    email?: string;
  };
}

// Group interface
export interface Group {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  teamId: string;
  team?: {
    id: string;
    name: string;
  };
  leaders?: GroupLeader[];
  createdAt: string;
  updatedAt: string;
  users?: UserType[];
}

// Additional types can be added as needed
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
