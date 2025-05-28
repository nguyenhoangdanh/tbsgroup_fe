// src/types/digital-form-dto.ts

import {
  AttendanceStatus,
  ProductionIssue,
  ProductionIssueType,
  RecordStatus,
  ShiftType,
} from './digital-form';

// Request/Response models
export interface DigitalFormConditions {
  factoryId?: string;
  lineId?: string;
  teamId?: string;
  groupId?: string;
  createdById?: string;
  status?: RecordStatus;
  dateFrom?: string;
  dateTo?: string;
  shiftType?: ShiftType;
  search?: string;
}

export interface DigitalFormCreateRequest {
  userId: string;
  formName?: string;
  description?: string;
  date: string; // ISO date string
  shiftType: ShiftType;
  factoryId?: string;
  lineId?: string;
  teamId?: string;
  groupId?: string;
}

export interface DigitalFormUpdateRequest {
  formName?: string;
  description?: string;
}

export interface DigitalFormEntryRequest {
  userId: string;
  handBagId: string;
  bagColorId: string;
  processId: string;
  plannedOutput?: number;
  hourlyData?: Record<string, number>;
  totalOutput?: number;
  attendanceStatus?: AttendanceStatus;
  shiftType?: ShiftType;
  checkInTime?: string;
  checkOutTime?: string;
  attendanceNote?: string;
  issues?: ProductionIssue[];
  qualityScore?: number;
  qualityNotes?: string;
}

export interface FormEntryUpdateRequest {
  handBagId?: string;
  bagColorId?: string;
  processId?: string;
  plannedOutput?: number;
  hourlyData?: Record<string, number>;
  totalOutput?: number;
  attendanceStatus?: AttendanceStatus;
  shiftType?: ShiftType;
  checkInTime?: string;
  checkOutTime?: string;
  attendanceNote?: string;
  issues?: ProductionIssue[];
  qualityScore?: number;
  qualityNotes?: string;
}

export interface DigitalFormSubmitRequest {
  approvalRequestId?: string;
}

// Report request types
export interface FactoryReportRequest {
  factoryId: string;
  dateFrom: string;
  dateTo: string;
  options?: {
    includeLines?: boolean;
    includeTeams?: boolean;
    includeGroups?: boolean;
    groupByBag?: boolean;
    groupByProcess?: boolean;
  };
}

export interface LineReportRequest {
  lineId: string;
  dateFrom: string;
  dateTo: string;
  options?: {
    includeTeams?: boolean;
    includeGroups?: boolean;
    groupByBag?: boolean;
    groupByProcess?: boolean;
  };
}

export interface TeamReportRequest {
  teamId: string;
  dateFrom: string;
  dateTo: string;
  options?: {
    includeGroups?: boolean;
    includeWorkers?: boolean;
    groupByBag?: boolean;
    groupByProcess?: boolean;
  };
}

export interface GroupReportRequest {
  groupId: string;
  dateFrom: string;
  dateTo: string;
  options?: {
    includeWorkers?: boolean;
    detailedAttendance?: boolean;
    groupByBag?: boolean;
    groupByProcess?: boolean;
  };
}

export interface ComparisonReportRequest {
  lineId: string;
  entityIds: string[]; // Team or group IDs
  compareBy: 'team' | 'group';
  dateFrom: string;
  dateTo: string;
  options?: {
    includeHandBags?: boolean;
    includeProcesses?: boolean;
    includeTimeSeries?: boolean;
  };
}

export interface ExportReportRequest {
  reportType: 'team' | 'group' | 'comparison' | 'factory' | 'line';
  parameters: any;
  format: 'pdf' | 'excel' | 'csv';
}

// Production Issue DTO (for API requests)
export interface ProductionIssueDTO {
  type: ProductionIssueType;
  hour: number;
  impact: number;
  description?: string;
}
