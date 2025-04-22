// schemas/digital-form.schema.ts
import { AttendanceStatus, ProductionIssueType, ShiftType } from '@/common/types/digital-form';
import { z } from 'zod';

export const digitalFormCreateSchema = z.object({
  formName: z.string().optional(),
  description: z.string().optional(),
  date: z.string(), // ISO date string
  shiftType: z.nativeEnum(ShiftType),
  lineId: z.string().uuid(),
});

export const digitalFormUpdateSchema = z.object({
  formName: z.string().optional(),
  description: z.string().optional(),
});

export const digitalFormSubmitSchema = z.object({
  approvalRequestId: z.string().uuid().optional(),
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
  checkInTime: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  attendanceNote: z.string().nullable().optional(),
  
  // Issues tracking
  issues: z.array(
    z.object({
      type: z.nativeEnum(ProductionIssueType),
      hour: z.union([z.string(), z.number()]),
      impact: z.number().int().min(0).max(100),
      description: z.string().optional(),
    })
  ).optional(),
  
  // Quality information
  qualityScore: z.number().int().min(0).max(100).default(100),
  qualityNotes: z.string().nullable().optional(),
});

export type TDigitalFormCreate = z.infer<typeof digitalFormCreateSchema>;
export type TDigitalFormUpdate = z.infer<typeof digitalFormUpdateSchema>;
export type TDigitalFormSubmit = z.infer<typeof digitalFormSubmitSchema>;
export type TDigitalFormEntry = z.infer<typeof digitalFormEntrySchema>;