import { RecordStatus } from "./digital-form"

export enum AttendanceStatus {
    PRESENT = "PRESENT",
    ABSENT = "ABSENT",
    LATE = "LATE",
    EARLY_LEAVE = "EARLY_LEAVE",
    LEAVE_APPROVED = "LEAVE_APPROVED",
  }
  
  export enum ProductionIssueType {
    ABSENT = "ABSENT",
    LATE = "LATE",
    WAITING_MATERIALS = "WAITING_MATERIALS",
    QUALITY_ISSUES = "QUALITY_ISSUES",
    LOST_MATERIALS = "LOST_MATERIALS",
    OTHER = "OTHER",
  }
  
  export interface ProductionIssue {
    type: ProductionIssueType
    hour: number
    impact: number // percentage impact 0-100
    description?: string
  }
  
  export interface TimeSlot {
    id: string
    start: string
    end: string
    label: string
  }
  
  export interface Worker {
    id: string
    name: string
    employeeId: string
    bagId: string
    bagName: string
    processId: string
    processName: string
    colorId: string
    colorName: string
    attendanceStatus: AttendanceStatus
    hourlyData: Record<string, number>
    totalOutput: number
    issues: ProductionIssue[]
    qualityScore: number
  }
  
  export interface FormData {
    id: string
    formCode: string
    formName: string
    date: string
    factoryId: string
    factoryName: string
    lineId: string
    lineName: string
    teamId: string
    teamName: string
    groupId: string
    groupName: string
    status: RecordStatus
    workers: Worker[]
  }
  