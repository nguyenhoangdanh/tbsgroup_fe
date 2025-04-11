import { z } from "zod";

// Define the reason type
export const reasonSchema = z.object({
  VT: z.boolean().optional().default(false),
  CN: z.boolean().optional().default(false),
  CL: z.boolean().optional().default(false),
  MM: z.boolean().optional().default(false),
});

// Define the entry schema
export const timeSheetEntrySchema = z.object({
  id: z.string(),
  taskCode: z.string().optional(),
  taskId: z.string().optional(),
  taskName: z.string().optional(),
  target: z.string().optional(),
  note: z.string().optional(),
  slots: z.record(z.string(), z.boolean().optional()).optional(),
  reasons: reasonSchema.optional(),
  total: z.number().optional(),
});

// Define the main timesheet schema
export const timeSheetSchema = z.object({
  id: z.string().optional(),
  employeeName: z.string().min(1, "Vui lòng nhập họ tên"),
  employeeId: z.string().min(1, "Vui lòng nhập mã số thẻ"),
  department: z.string().min(1, "Vui lòng nhập đơn vị"),
  level: z.string().optional(),
  supervisor: z.string().optional(),
  teamLeader: z.string().optional(),
  shiftLeader: z.string().optional(),
  date: z.string().optional(),
  entries: z.array(timeSheetEntrySchema),
  status: z.enum(["draft", "pending", "approved", "rejected"]).optional(),
  totalHours: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Types derived from the schema
export type ReasonType = z.infer<typeof reasonSchema>;
export type TimeSheetEntryType = z.infer<typeof timeSheetEntrySchema>;
export type TimeSheetType = z.infer<typeof timeSheetSchema>;

// Default values
export const defaultTimeSheetEntry: TimeSheetEntryType = {
  id: "",
  taskCode: "",
  taskId: "",
  taskName: "",
  target: "",
  note: "",
  slots: {},
  reasons: { VT: false, CN: false, CL: false, MM: false },
  total: 0,
};

export const defaultTimeSheet: TimeSheetType = {
  id: undefined,
  employeeName: "",
  employeeId: "",
  department: "",
  level: "",
  supervisor: "",
  teamLeader: "",
  shiftLeader: "",
  date: new Date().toISOString().split('T')[0],
  entries: [
    {
      ...defaultTimeSheetEntry,
      id: crypto.randomUUID()
    }
  ],
  status: "draft",
  totalHours: 0,
  createdAt: undefined,
  updatedAt: undefined
};

// Constants for time slots
export const TIME_SLOTS = [
  { id: 1, label: "07:30-08:30", start: { hours: 7, minutes: 30 }, end: { hours: 8, minutes: 30 } },
  { id: 2, label: "08:30-09:30", start: { hours: 8, minutes: 30 }, end: { hours: 9, minutes: 30 } },
  { id: 3, label: "09:30-10:30", start: { hours: 9, minutes: 30 }, end: { hours: 10, minutes: 30 } },
  { id: 4, label: "10:30-11:30", start: { hours: 10, minutes: 30 }, end: { hours: 11, minutes: 30 } },
  { id: 5, label: "13:30-14:30", start: { hours: 13, minutes: 30 }, end: { hours: 14, minutes: 30 } },
  { id: 6, label: "14:30-15:30", start: { hours: 14, minutes: 30 }, end: { hours: 15, minutes: 30 } },
  { id: 7, label: "15:30-16:30", start: { hours: 15, minutes: 30 }, end: { hours: 16, minutes: 30 } },
  { id: 8, label: "16:30-17:30", start: { hours: 16, minutes: 30 }, end: { hours: 17, minutes: 30 } },
  { id: 9, label: "17:30-18:00", start: { hours: 17, minutes: 30 }, end: { hours: 18, minutes: 0 } },
  { id: 10, label: "18:00-19:00", start: { hours: 18, minutes: 0 }, end: { hours: 19, minutes: 0 } },
  { id: 11, label: "19:00-20:00", start: { hours: 19, minutes: 0 }, end: { hours: 20, minutes: 0 } },
];

// Define reason options
export const REASON_OPTIONS = [
  { value: "VT", label: "Vật tư" },
  { value: "CN", label: "Công nghệ" },
  { value: "CL", label: "Chất lượng" },
  { value: "MM", label: "Máy móc - Thiết bị" },
];

// Status options
export const STATUS_OPTIONS = [
  { value: "draft", label: "Bản nháp" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

// Helper function to calculate total hours from slots
export const calculateTotalHours = (slots: Record<string, boolean | undefined> = {}): number => {
  let total = 0;
  
  Object.entries(slots).forEach(([slotId, checked]) => {
    if (checked) {
      // Each slot represents 1 hour except the 17:30-18:00 slot which is 0.5 hours
      const timeSlot = TIME_SLOTS.find(slot => slot.id.toString() === slotId);
      if (timeSlot) {
        if (timeSlot.label === "17:30-18:00") {
          total += 0.5;
        } else {
          total += 1;
        }
      }
    }
  });
  
  return total;
};

// Get slots from time range
export const getSlotsFromTimeRange = (
  startHours: number,
  startMinutes: number,
  endHours: number,
  endMinutes: number
): Record<string, boolean> => {
  const startTime = startHours * 60 + startMinutes;
  const endTime = endHours * 60 + endMinutes;
  
  const slots: Record<string, boolean> = {};
  
  TIME_SLOTS.forEach(slot => {
    const slotStartTime = slot.start.hours * 60 + slot.start.minutes;
    const slotEndTime = slot.end.hours * 60 + slot.end.minutes;
    
    // Check if this slot overlaps with the selected time range
    if (
      (startTime <= slotStartTime && endTime >= slotEndTime) || // Slot is completely within range
      (startTime >= slotStartTime && startTime < slotEndTime) || // Range starts within slot
      (endTime > slotStartTime && endTime <= slotEndTime) // Range ends within slot
    ) {
      slots[slot.id.toString()] = true;
    }
  });
  
  return slots;
};

// Format time for display (e.g., "07:30-08:30")
export const formatTimeSlot = (slot: typeof TIME_SLOTS[0]): string => {
  const formatTime = (hours: number, minutes: number) => 
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return `${formatTime(slot.start.hours, slot.start.minutes)}-${formatTime(slot.end.hours, slot.end.minutes)}`;
};

// Get the color for a status
export const getStatusColor = (status?: string): { bg: string; text: string } => {
  switch (status) {
    case 'approved':
      return { bg: 'bg-green-100 dark:bg-green-800', text: 'text-green-800 dark:text-green-100' };
    case 'pending':
      return { bg: 'bg-yellow-100 dark:bg-yellow-800', text: 'text-yellow-800 dark:text-yellow-100' };
    case 'rejected':
      return { bg: 'bg-red-100 dark:bg-red-800', text: 'text-red-800 dark:text-red-100' };
    case 'draft':
      return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-100' };
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200' };
  }
};

// Get a user-friendly status label
export const getStatusLabel = (status?: string): string => {
  switch (status) {
    case 'approved': return 'Đã duyệt';
    case 'pending': return 'Chờ duyệt';
    case 'rejected': return 'Từ chối';
    case 'draft': return 'Bản nháp';
    default: return 'Không xác định';
  }
};