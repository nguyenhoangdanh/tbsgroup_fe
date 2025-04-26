// schemas/digital-form.schema.ts
import { z } from 'zod';
import { 
  ShiftType, 
  RecordStatus, 
  AttendanceStatus, 
  ProductionIssueType 
} from '@/common/types/digital-form';

// Base pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Digital Form Create schema
export const digitalFormCreateSchema = z.object({
  formName: z.string().optional(),
  description: z.string().optional(),
  date: z.string(), // ISO date string
  shiftType: z.nativeEnum(ShiftType),
  factoryId: z.string().uuid(),
  lineId: z.string().uuid(),
  teamId: z.string().uuid(),
  groupId: z.string().uuid(),
});

// Digital Form Update schema
export const digitalFormUpdateSchema = z.object({
  formName: z.string().optional(),
  description: z.string().optional(),
});

// Digital Form Submit schema
export const digitalFormSubmitSchema = z.object({
  approvalRequestId: z.string().uuid().optional(),
});

// Digital Form Condition schema for filtering
export const digitalFormCondSchema = z.object({
  factoryId: z.string().uuid().optional(),
  lineId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED', 'REJECTED']).optional(),
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
  shiftType: z.enum(['REGULAR', 'EXTENDED', 'OVERTIME']).optional(),
  search: z.string().optional(),
});

// Form Entry schema
export const productionIssueSchema = z.object({
  type: z.nativeEnum(ProductionIssueType),
  hour: z.number().int(),
  impact: z.number().int().min(0).max(100),
  description: z.string().optional(),
});

export const digitalFormEntrySchema = z.object({
  userId: z.string().uuid(),
  handBagId: z.string().uuid(),
  bagColorId: z.string().uuid(),
  processId: z.string().uuid(),

  // Hourly data as a record of hour -> output
  hourlyData: z.record(z.string(), z.number()).default({}),

  // Total output calculated from hourly data
  totalOutput: z.number().int().default(0),

  // Attendance information
  attendanceStatus: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
  checkInTime: z.string().optional(), // ISO datetime string
  checkOutTime: z.string().optional(), // ISO datetime string
  attendanceNote: z.string().optional(),

  // Issues tracking
  issues: z.array(productionIssueSchema).optional(),

  // Quality information
  qualityScore: z.number().int().min(0).max(100).default(100),
  qualityNotes: z.string().optional(),
});

// Update Form Entry schema
export const updateFormEntrySchema = z.object({
  hourlyData: z.record(z.string(), z.number()).optional(),
  totalOutput: z.number().int().optional(),
  attendanceStatus: z.nativeEnum(AttendanceStatus).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  attendanceNote: z.string().optional(),
  issues: z.array(productionIssueSchema).optional(),
  qualityScore: z.number().int().min(0).max(100).optional(),
  qualityNotes: z.string().optional(),
});

// Report query parameters schema
export const reportQueryParamsSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  includeLines: z.boolean().optional(),
  includeTeams: z.boolean().optional(),
  includeGroups: z.boolean().optional(),
  includeWorkers: z.boolean().optional(),
  detailedAttendance: z.boolean().optional(),
  groupByBag: z.boolean().optional(),
  groupByProcess: z.boolean().optional(),
});

// Comparison report query parameters schema
export const comparisonReportParamsSchema = z.object({
  lineId: z.string().uuid(),
  entityIds: z.string(), // Comma-separated list of entity IDs
  compareBy: z.enum(['team', 'group']),
  dateFrom: z.string(),
  dateTo: z.string(),
  includeHandBags: z.boolean().optional(),
  includeProcesses: z.boolean().optional(),
  includeTimeSeries: z.boolean().optional(),
});

// Export report parameters schema
export const exportReportParamsSchema = z.object({
  reportType: z.enum(['team', 'group', 'comparison']),
  parameters: z.any(),
  format: z.enum(['pdf', 'excel', 'csv']),
});

// Types derived from schemas
export type TDigitalFormCreate = z.infer<typeof digitalFormCreateSchema>;
export type TDigitalFormUpdate = z.infer<typeof digitalFormUpdateSchema>;
export type TDigitalFormSubmit = z.infer<typeof digitalFormSubmitSchema>;
export type TDigitalFormCond = z.infer<typeof digitalFormCondSchema>;
export type TPaginationParams = z.infer<typeof paginationSchema>;
export type TDigitalFormEntry = z.infer<typeof digitalFormEntrySchema>;
export type TUpdateFormEntry = z.infer<typeof updateFormEntrySchema>;
export type TProductionIssue = z.infer<typeof productionIssueSchema>;
export type TReportQueryParams = z.infer<typeof reportQueryParamsSchema>;
export type TComparisonReportParams = z.infer<typeof comparisonReportParamsSchema>;
export type TExportReportParams = z.infer<typeof exportReportParamsSchema>;




// // schemas/digital-form.schema.ts
// import { AttendanceStatus, ProductionIssueType, ShiftType } from '@/common/types/digital-form';
// import { z } from 'zod';

// export const digitalFormCreateSchema = z.object({
//   formName: z.string().optional(),
//   description: z.string().optional(),
//   date: z.string(), // ISO date string
//   shiftType: z.nativeEnum(ShiftType),
//   lineId: z.string().uuid(),
// });

// export const digitalFormUpdateSchema = z.object({
//   formName: z.string().optional(),
//   description: z.string().optional(),
// });

// export const digitalFormSubmitSchema = z.object({
//   approvalRequestId: z.string().uuid().optional(),
// });

// export const digitalFormEntrySchema = z.object({
//   userId: z.string().uuid(),
//   handBagId: z.string().uuid(),
//   bagColorId: z.string().uuid(),
//   processId: z.string().uuid(),
  
//   // Hourly data as a record of hour -> output
//   hourlyData: z.record(z.string(), z.number()).default({}),
  
//   // Total output calculated from hourly data
//   totalOutput: z.number().int().default(0),
  
//   // Attendance information
//   attendanceStatus: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
//   checkInTime: z.string().nullable().optional(),
//   checkOutTime: z.string().nullable().optional(),
//   attendanceNote: z.string().nullable().optional(),
  
//   // Issues tracking
//   issues: z.array(
//     z.object({
//       type: z.nativeEnum(ProductionIssueType),
//       hour: z.union([z.string(), z.number()]),
//       impact: z.number().int().min(0).max(100),
//       description: z.string().optional(),
//     })
//   ).optional(),
  
//   // Quality information
//   qualityScore: z.number().int().min(0).max(100).default(100),
//   qualityNotes: z.string().nullable().optional(),
// });

// export type TDigitalFormCreate = z.infer<typeof digitalFormCreateSchema>;
// export type TDigitalFormUpdate = z.infer<typeof digitalFormUpdateSchema>;
// export type TDigitalFormSubmit = z.infer<typeof digitalFormSubmitSchema>;
// export type TDigitalFormEntry = z.infer<typeof digitalFormEntrySchema>;