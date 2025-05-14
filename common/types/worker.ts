import { RecordStatus, ShiftType } from './digital-form';
import { BagColor, BagProcess, HandBag } from '../interface/handbag';
import { UserItemType } from '../interface/user';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EARLY_LEAVE = 'EARLY_LEAVE',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
}

export enum ProductionIssueType {
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  WAITING_MATERIALS = 'WAITING_MATERIALS',
  QUALITY_ISSUES = 'QUALITY_ISSUES',
  LOST_MATERIALS = 'LOST_MATERIALS',
  OTHER = 'OTHER',
}

export interface ProductionIssue {
  type: ProductionIssueType;
  hour: number;
  impact: number; // percentage impact 0-100
  description?: string;
}

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  label: string;
}

// Bag metadata that can change per time slot
export interface BagMetadata {
  bagId: string;
  bagName: string;
  processId: string;
  processName: string;
  colorId: string;
  colorName: string;
}

export interface Worker {
  id: string;
  name: string;
  employeeId: string;
  bagId: string;
  bagName: string;
  processId: string;
  processName: string;
  colorId: string;
  colorName: string;
  attendanceStatus: AttendanceStatus;
  attendanceNote: string;
  shiftType: ShiftType;
  hourlyData: Record<string, number>;

  // Maps time slots to bag metadata
  hourlyBagData?: Record<string, BagMetadata>;
  totalOutput: number;
  issues: ProductionIssue[];
  qualityScore: number;
  user?: UserItemType;
  handBag?: HandBag;
  process?: BagProcess;
  bagColor?: BagColor;
}

export interface FormData {
  id: string;
  formCode: string;
  formName: string;
  date: string;
  factoryId: string;
  factoryName: string;
  lineId: string;
  lineName: string;
  teamId: string;
  teamName: string;
  groupId: string;
  groupName: string;
  status: RecordStatus;
  workers: Worker[];
}
