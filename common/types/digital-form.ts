import { BagColor, BagProcess, HandBag } from '../interface/handbag';
import { UserItemType } from '../interface/user';

export enum RecordStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

export enum ShiftType {
  REGULAR = 'REGULAR',
  EXTENDED = 'EXTENDED',
  OVERTIME = 'OVERTIME',
}

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

export interface DigitalForm {
  id: string;
  formCode: string;
  formName?: string;
  description?: string;
  date: string; // ISO date string
  shiftType: ShiftType;

  // Organization hierarchy
  factoryId: string;
  factoryName?: string;
  lineId: string;
  lineName?: string;
  teamId: string;
  teamName?: string;
  groupId: string;
  groupName?: string;

  // Status and audit
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdByName?: string;
  updatedById: string;
  submitTime?: string | null;
  approvalRequestId?: string | null;
  approvedAt?: string | null;
  approvedById?: string | null;
  approvedByName?: string | null;

  // Export flags
  isExported: boolean;
  syncStatus?: string | null;
}

export interface DigitalFormEntry {
  id: string;
  formId: string;

  // Worker (User)
  userId: string;
  userName?: string;
  userCode?: string;

  // Production item details
  handBagId: string;
  handBagName?: string;
  bagColorId: string;
  bagColorName?: string;
  processId: string;
  processName?: string;
  plannedOutput: number;
  // Production data
  hourlyData: Record<string, number>;
  totalOutput: number;

  // Attendance data
  attendanceStatus: AttendanceStatus;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  attendanceNote?: string | null;
  shiftType: ShiftType;

  // Quality data
  qualityScore: number;
  qualityNotes?: string | null;

  // Issues tracking
  issues?: ProductionIssue[];

  // Audit
  createdAt: string;
  updatedAt: string;

  user?: UserItemType;
  handBag?: HandBag;
  process?: BagProcess;
  bagColor?: BagColor;
}

// Factory level report
export interface FactoryProductionReport {
  factory: {
    id: string;
    name: string;
  };
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalOutput: number;
    totalWorkers: number;
    attendanceRate: number;
    qualityRate: number;
  };
  lines?: LineProductionSummary[];
  byBag?: BagProductionSummary[];
  byProcess?: ProcessProductionSummary[];
  hourlyData?: Record<string, number>;
}

// Line level report
export interface LineProductionReport {
  line: {
    id: string;
    name: string;
    factoryId: string;
    factoryName: string;
  };
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalOutput: number;
    totalWorkers: number;
    attendanceRate: number;
    qualityRate: number;
  };
  teams?: TeamProductionSummary[];
  byBag?: BagProductionSummary[];
  byProcess?: ProcessProductionSummary[];
  hourlyData?: Record<string, number>;
}

// Team level report
export interface TeamProductionReport {
  team: {
    id: string;
    name: string;
    lineId: string;
    lineName: string;
  };
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalOutput: number;
    totalWorkers: number;
    attendanceRate: number;
    qualityRate: number;
  };
  groups?: GroupProductionSummary[];
  workers?: WorkerProductionSummary[];
  byBag?: BagProductionSummary[];
  byProcess?: ProcessProductionSummary[];
  hourlyData?: Record<string, number>;
}

// Group level report
export interface GroupProductionReport {
  group: {
    id: string;
    name: string;
    teamId: string;
    teamName: string;
  };
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalOutput: number;
    totalWorkers: number;
    attendanceRate: number;
    qualityRate: number;
  };
  workers?: WorkerProductionSummary[];
  attendanceDetails?: AttendanceDetailSummary[];
  byBag?: BagProductionSummary[];
  byProcess?: ProcessProductionSummary[];
  hourlyData?: Record<string, number>;
}

// Comparison report
export interface ProductionComparisonReport {
  lineId: string;
  lineName: string;
  dateRange: {
    from: string;
    to: string;
  };
  compareBy: 'team' | 'group';
  entities: ProductionComparisonEntity[];
  byHandBag?: {
    handBagId: string;
    handBagName: string;
    byEntity: {
      entityId: string;
      entityName: string;
      output: number;
    }[];
  }[];
  byProcess?: {
    processId: string;
    processName: string;
    byEntity: {
      entityId: string;
      entityName: string;
      output: number;
    }[];
  }[];
  timeSeries?: {
    date: string;
    byEntity: {
      entityId: string;
      entityName: string;
      output: number;
    }[];
  }[];
}

// Helper interfaces for reports
interface LineProductionSummary {
  id: string;
  name: string;
  totalOutput: number;
  totalWorkers: number;
  attendanceRate: number;
  qualityRate: number;
}

interface TeamProductionSummary {
  id: string;
  name: string;
  totalOutput: number;
  totalWorkers: number;
  attendanceRate: number;
  qualityRate: number;
}

interface GroupProductionSummary {
  id: string;
  name: string;
  totalOutput: number;
  totalWorkers: number;
  attendanceRate: number;
  qualityRate: number;
}

interface WorkerProductionSummary {
  id: string;
  name: string;
  code: string;
  totalOutput: number;
  qualityScore: number;
  attendanceStatus: AttendanceStatus;
  hourlyData?: Record<string, number>;
}

interface BagProductionSummary {
  id: string;
  name: string;
  totalOutput: number;
  qualityRate: number;
}

interface ProcessProductionSummary {
  id: string;
  name: string;
  totalOutput: number;
  qualityRate: number;
}

interface AttendanceDetailSummary {
  date: string;
  present: number;
  absent: number;
  late: number;
  earlyLeave: number;
  leaveApproved: number;
  attendanceRate: number;
}

interface ProductionComparisonEntity {
  id: string;
  name: string;
  totalOutput: number;
  qualityRate: number;
  attendanceRate: number;
  averageHourlyOutput: number;
}

// Adapter function to convert between API model and UI model
export function convertApiToUiModel(form: DigitalForm, entries: DigitalFormEntry[]): any {
  return {
    id: form.id,
    formCode: form.formCode,
    formName: form.formName || 'Phiếu theo dõi công đoạn',
    date: form.date,
    factoryId: form.factoryId,
    factoryName: form.factoryName || '',
    lineId: form.lineId,
    lineName: form.lineName || '',
    teamId: form.teamId,
    teamName: form.teamName || '',
    groupId: form.groupId,
    groupName: form.groupName || '',
    status: form.status,
    workers: entries.map(entry => ({
      id: entry.id,
      name: entry.userName || 'Công nhân',
      employeeId: entry.userCode || entry.userId.substring(0, 6),
      bagId: entry.handBagId,
      bagName: entry.handBagName || 'Chưa xác định',
      processId: entry.processId,
      processName: entry.processName || 'Chưa xác định',
      colorId: entry.bagColorId,
      colorName: entry.bagColorName || 'Chưa xác định',
      attendanceStatus: entry.attendanceStatus,
      hourlyData: entry.hourlyData || {},
      totalOutput: entry.totalOutput || 0,
      issues: entry.issues || [],
      qualityScore: entry.qualityScore || 100,
    })),
  };
}

// Convert from UI model back to API model for updates
export function convertEntryToApiModel(
  workerId: string,
  timeSlot: string,
  quantity: number,
  currentData?: DigitalFormEntry,
): Partial<DigitalFormEntry> {
  // Start with current data or empty object
  const baseData: Partial<DigitalFormEntry> = currentData ? { ...currentData } : {};

  // Update or create hourly data
  const hourlyData = { ...(baseData.hourlyData || {}) };
  hourlyData[timeSlot] = quantity;

  // Calculate total output
  const totalOutput = Object.values(hourlyData).reduce((sum, val) => sum + (val || 0), 0);

  return {
    ...baseData,
    hourlyData,
    totalOutput,
  };
}
