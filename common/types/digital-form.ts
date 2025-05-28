// src/types/digital-form.ts

// Base types for digital form module

// Enums
export enum RecordStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED'
}

export enum ShiftType {
  REGULAR = 'REGULAR',
  EXTENDED = 'EXTENDED',
  OVERTIME = 'OVERTIME'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EARLY_LEAVE = 'EARLY_LEAVE',
  LEAVE_APPROVED = 'LEAVE_APPROVED'
}

export enum ProductionIssueType {
  WAITING_MATERIALS = 'WAITING_MATERIALS',
  MACHINE_BREAKDOWN = 'MACHINE_BREAKDOWN',
  QUALITY_ISSUES = 'QUALITY_ISSUES',
  STAFF_SHORTAGE = 'STAFF_SHORTAGE',
  PROCESS_DELAY = 'PROCESS_DELAY',
  OTHER = 'OTHER'
}

// Interface for production issue
export interface ProductionIssue {
  type: ProductionIssueType;
  hour: number;
  impact: number; // percentage impact 0-100
  description?: string;
}

// Time interval definition for the form
export interface TimeInterval {
  start: string; // e.g., "07:30"
  end: string; // e.g., "08:30"
  label: string; // e.g., "07:30-08:30"
}

// Main entity interfaces
export interface DigitalForm {
  id: string;
  formCode: string;
  formName: string;
  description: string | null;
  date: Date | string;
  shiftType: ShiftType;
  factoryId: string;
  factoryName?: string;
  factoryCode?: string;
  lineId: string;
  lineName?: string;
  lineCode?: string;
  teamId: string | null;
  teamName?: string;
  teamCode?: string;
  groupId: string | null;
  groupName?: string;
  groupCode?: string;
  userId: string;
  userName?: string;
  userCode?: string;
  status: RecordStatus;
  createdById: string;
  createdByName?: string;
  createdAt: Date | string;
  updatedById: string;
  updatedAt: Date | string;
  submitTime: Date | string | null;
  approvalRequestId: string | null;
  approvedAt: Date | string | null;
  isExported: boolean;
  syncStatus: string | null;
}

export interface DigitalFormEntry {
  id: string;
  formId: string;
  userId: string;
  userName?: string;
  userCode?: string;
  handBagId: string;
  handBagName?: string;
  handBagCode?: string;
  bagColorId: string;
  bagColorName?: string;
  bagColorCode?: string;
  processId: string;
  processName?: string;
  processCode?: string;
  plannedOutput: number;
  hourlyData: Record<string, number>;
  totalOutput: number;
  attendanceStatus: AttendanceStatus;
  shiftType: ShiftType;
  checkInTime: Date | string | null;
  checkOutTime: Date | string | null;
  attendanceNote: string | null;
  issues?: ProductionIssue[];
  qualityScore: number;
  qualityNotes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DigitalFormWithEntries {
  form: DigitalForm;
  entries: DigitalFormEntry[];
}

// Attendance statistics interface
export interface AttendanceStatsItem {
  present: number;
  absent: number;
  late: number;
  earlyLeave: number;
  leaveApproved: number;
  percentPresent: number;
}

// Output statistics interfaces
export interface OutputByBagItem {
  handBagId: string;
  handBagCode: string;
  handBagName: string;
  totalOutput: number;
  percentage: number;
}

export interface OutputByProcessItem {
  processId: string;
  processCode: string;
  processName: string;
  totalOutput: number;
}

export interface HourlyBreakdownItem {
  hour: string;
  totalOutput: number;
  averageOutput: number;
}

export interface DailyBreakdownItem {
  date: string;
  totalOutput: number;
  averageQuality: number;
  attendanceRate: number;
}

export interface ProductionIssueItem {
  issueType: ProductionIssueType;
  occurrences: number;
  totalImpact: number;
}

// Report interfaces
export interface ReportDateRange {
  from: string;
  to: string;
}

export interface FactoryProductionReport {
  factoryId: string;
  factoryName: string;
  factoryCode: string;
  dateRange: ReportDateRange;
  totalForms: number;
  totalEntries: number;
  totalOutput: number;
  averageQuality: number;
  outputByBag: OutputByBagItem[];
  outputByProcess: OutputByProcessItem[];
  attendanceStats: AttendanceStatsItem;
  hourlyBreakdown: HourlyBreakdownItem[];
  dailyBreakdown: DailyBreakdownItem[];
  productionIssues: ProductionIssueItem[];
  lineBreakdown: LineBreakdownItem[];
}

export interface LineBreakdownItem {
  lineId: string;
  lineName: string;
  lineCode: string;
  totalOutput: number;
  averageQuality: number;
  teamCount: number;
  workerCount: number;
  efficiency: number;
}

export interface LineProductionReport {
  lineId: string;
  lineName: string;
  lineCode: string;
  factoryId: string;
  factoryName: string;
  factoryCode: string;
  dateRange: ReportDateRange;
  totalForms: number;
  totalEntries: number;
  totalOutput: number;
  averageQuality: number;
  outputByBag: OutputByBagItem[];
  outputByProcess: OutputByProcessItem[];
  attendanceStats: AttendanceStatsItem;
  hourlyBreakdown: HourlyBreakdownItem[];
  dailyBreakdown: DailyBreakdownItem[];
  productionIssues: ProductionIssueItem[];
  teamBreakdown: TeamBreakdownItem[];
}

export interface TeamBreakdownItem {
  teamId: string;
  teamName: string;
  teamCode: string;
  totalOutput: number;
  averageQuality: number;
  groupCount: number;
  workerCount: number;
  efficiency: number;
}

export interface TeamProductionReport {
  teamId: string;
  teamName: string;
  teamCode: string;
  lineId: string;
  lineName: string;
  factoryId: string;
  factoryName: string;
  factoryCode: string;
  dateRange: ReportDateRange;
  totalForms: number;
  totalEntries: number;
  totalOutput: number;
  averageQuality: number;
  outputByBag: OutputByBagItem[];
  outputByProcess: OutputByProcessItem[];
  attendanceStats: AttendanceStatsItem;
  hourlyBreakdown: HourlyBreakdownItem[];
  dailyBreakdown: DailyBreakdownItem[];
  productionIssues: ProductionIssueItem[];
  groupBreakdown: GroupBreakdownItem[];
}

export interface GroupBreakdownItem {
  groupId: string;
  groupName: string;
  groupCode: string;
  totalOutput: number;
  averageQuality: number;
  workerCount: number;
  efficiency: number;
}

export interface GroupProductionReport {
  groupId: string;
  groupName: string;
  groupCode: string;
  teamId: string;
  teamName: string;
  lineId: string;
  lineName: string;
  factoryId: string;
  factoryName: string;
  factoryCode: string;
  dateRange: ReportDateRange;
  totalForms: number;
  totalEntries: number;
  totalOutput: number;
  averageQuality: number;
  outputByBag: OutputByBagItem[];
  outputByProcess: OutputByProcessItem[];
  attendanceStats: AttendanceStatsItem;
  hourlyBreakdown: HourlyBreakdownItem[];
  dailyBreakdown: DailyBreakdownItem[];
  productionIssues: ProductionIssueItem[];
  workerBreakdown: WorkerBreakdownItem[];
}

export interface WorkerBreakdownItem {
  userId: string;
  employeeId: string;
  fullName: string;
  totalOutput: number;
  averageQuality: number;
  attendanceRate: number;
  efficiency: number;
}

export interface ComparisonDataItem {
  id: string;
  name: string;
  code: string;
  totalOutput: number;
  outputPerWorker: number;
  qualityScore: number;
  attendanceRate: number;
  issueRate: number;
  rank: number;
}

export interface ComparisonByBagItem {
  handBagId: string;
  handBagCode: string;
  handBagName: string;
  dataPoints: {
    id: string;
    name: string;
    output: number;
    efficiency: number;
  }[];
}

export interface ComparisonByProcessItem {
  processId: string;
  processCode: string;
  processName: string;
  dataPoints: {
    id: string;
    name: string;
    output: number;
    efficiency: number;
  }[];
}

export interface TimeSeriesDataItem {
  date: string;
  dataPoints: {
    id: string;
    name: string;
    output: number;
  }[];
}

export interface ProductionComparisonReport {
  dateRange: ReportDateRange;
  factoryId: string;
  factoryName: string;
  factoryCode: string;
  lineId: string;
  lineName: string;
  lineCode: string;
  comparisonType: 'team' | 'group';
  comparisonData: ComparisonDataItem[];
  comparisonByBag: ComparisonByBagItem[];
  comparisonByProcess: ComparisonByProcessItem[];
  timeSeriesData: TimeSeriesDataItem[];
}
