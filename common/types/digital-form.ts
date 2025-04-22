// types/digital-form.ts
export enum ShiftType {
    REGULAR = 'REGULAR',  // 7h30 - 16h30
    EXTENDED = 'EXTENDED', // 16h30 - 18h
    OVERTIME = 'OVERTIME'  // 18h - 20h
  }
  
  export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LATE = 'LATE',
    EARLY_LEAVE = 'EARLY_LEAVE',
    LEAVE_APPROVED = 'LEAVE_APPROVED'
  }
  
  export enum RecordStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    REJECTED = 'REJECTED'
  }
  
  export enum ProductionIssueType {
    ABSENT = 'ABSENT',
    LATE = 'LATE',
    WAITING_MATERIALS = 'WAITING_MATERIALS',
    QUALITY_ISSUES = 'QUALITY_ISSUES',
    LOST_MATERIALS = 'LOST_MATERIALS',
    OTHER = 'OTHER'
  }
  
  export interface ProductionIssue {
    type: ProductionIssueType;
    hour: string | number;
    impact: number;
    description?: string;
  }
  
  export interface DigitalForm {
    id: string;
    formCode: string;
    formName: string;
    description: string | null;
    date: string; // ISO date
    shiftType: ShiftType;
    lineId: string;
    status: RecordStatus;
    createdById: string;
    createdAt: string; // ISO date
    updatedById: string | null;
    updatedAt: string; // ISO date
    submitTime: string | null; // ISO date
    approvalRequestId: string | null;
    approvedAt: string | null; // ISO date
    isExported: boolean;
    syncStatus: string | null;
  }
  
  export interface DigitalFormEntry {
    id: string;
    formId: string;
    userId: string;
    handBagId: string;
    bagColorId: string;
    processId: string;
    hourlyData: Record<string, number>;
    totalOutput: number;
    attendanceStatus: AttendanceStatus;
    checkInTime: string | null; // ISO date
    checkOutTime: string | null; // ISO date
    attendanceNote: string | null;
    issues?: ProductionIssue[];
    qualityScore: number;
    qualityNotes: string | null;
    createdAt: string; // ISO date
    updatedAt: string; // ISO date
  }
  
  // Time interval definition for the form
  export interface TimeInterval {
    start: string; // e.g., "07:30"
    end: string;   // e.g., "08:30" 
    label: string; // e.g., "07:30-08:30"
  }
  
  // Standard time intervals
  export const STANDARD_TIME_INTERVALS: TimeInterval[] = [
    { start: "07:30", end: "08:30", label: "07:30-08:30" },
    { start: "08:30", end: "09:30", label: "08:30-09:30" },
    { start: "09:30", end: "10:30", label: "09:30-10:30" },
    { start: "10:30", end: "11:30", label: "10:30-11:30" },
    { start: "12:30", end: "13:30", label: "12:30-13:30" },
    { start: "13:30", end: "14:30", label: "13:30-14:30" },
    { start: "14:30", end: "15:30", label: "14:30-15:30" },
    { start: "15:30", end: "16:30", label: "15:30-16:30" },
    { start: "16:30", end: "17:30", label: "16:30-17:30" },
    { start: "17:30", end: "18:00", label: "17:30-18:00" },
    { start: "18:00", end: "19:00", label: "18:00-19:00" },
    { start: "19:00", end: "20:00", label: "19:00-20:00" },
  ];