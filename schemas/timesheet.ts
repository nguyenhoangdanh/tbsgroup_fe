// schemas/timesheet.ts

import { z } from "zod";

// Define time slots
export const TIME_SLOTS = [
  { id: "slot_8_00", label: "8:00 - 8:30" },
  { id: "slot_8_30", label: "8:30 - 9:00" },
  { id: "slot_9_00", label: "9:00 - 9:30" },
  { id: "slot_9_30", label: "9:30 - 10:00" },
  { id: "slot_10_00", label: "10:00 - 10:30" },
  { id: "slot_10_30", label: "10:30 - 11:00" },
  { id: "slot_11_00", label: "11:00 - 11:30" },
  { id: "slot_11_30", label: "11:30 - 12:00" },
  { id: "slot_13_00", label: "13:00 - 13:30" },
  { id: "slot_13_30", label: "13:30 - 14:00" },
  { id: "slot_14_00", label: "14:00 - 14:30" },
  { id: "slot_14_30", label: "14:30 - 15:00" },
  { id: "slot_15_00", label: "15:00 - 15:30" },
  { id: "slot_15_30", label: "15:30 - 16:00" },
  { id: "slot_16_00", label: "16:00 - 16:30" },
  { id: "slot_16_30", label: "16:30 - 17:00" },
];

// Define reason options with description property
export const REASON_OPTIONS = [
  { value: "VT", label: "VT", description: "Vật tư" },
  { value: "CN", label: "CN", description: "Công nghệ" },
  { value: "CL", label: "CL", description: "Chất lượng" },
  { value: "MM", label: "MM", description: "Máy móc" },
];

// Define status colors
export const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return { bg: "bg-gray-100", text: "text-gray-800" };
    case "submitted":
      return { bg: "bg-blue-100", text: "text-blue-800" };
    case "approved":
      return { bg: "bg-green-100", text: "text-green-800" };
    case "rejected":
      return { bg: "bg-red-100", text: "text-red-800" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-800" };
  }
};

// Define status labels
export const getStatusLabel = (status: string) => {
  switch (status) {
    case "draft":
      return "Nháp";
    case "submitted":
      return "Đã gửi";
    case "approved":
      return "Đã duyệt";
    case "rejected":
      return "Từ chối";
    default:
      return "Không xác định";
  }
};

// Define TypeScript types for better type checking

// Type for reasons
export type ReasonType = {
  VT: boolean;
  CN: boolean;
  CL: boolean;
  MM: boolean;
};

// Type for time slots - a record of slot IDs to boolean values
export type SlotsType = Record<string, boolean>;

// Type for an entry
export type TimeSheetEntryType = {
  id: string;
  taskCode?: string;
  taskId?: string;
  taskName?: string;
  target?: string;
  note?: string;
  slots: SlotsType;
  reasons: ReasonType;
  total?: number;
};

// Main timesheet type
export type TimeSheetType = {
  id?: string;
  employeeName: string;
  employeeId: string;
  department: string;
  level?: string;
  supervisor?: string;
  teamLeader?: string;
  shiftLeader?: string;
  date?: string;
  entries: TimeSheetEntryType[];
  status?: string;
  totalHours: number;
  createdAt?: string;
  updatedAt?: string;
};

// Default values for a new timesheet
export const defaultTimeSheet: TimeSheetType = {
  employeeName: "",
  employeeId: "",
  department: "",
  entries: [
    {
      id: crypto.randomUUID(),
      taskCode: "",
      taskId: "",
      taskName: "",
      target: "",
      note: "",
      slots: {},
      reasons: { VT: false, CN: false, CL: false, MM: false },
      total: 0,
    },
  ],
  status: "draft",
  totalHours: 0,
};

// Calculate total hours based on selected slots
export const calculateTotalHours = (slots: SlotsType): number => {
  return Object.values(slots).filter(Boolean).length * 0.5;
};

// Helper function to get slots from time range
export const getSlotsFromTimeRange = (
  startHours: number,
  startMinutes: number,
  endHours: number,
  endMinutes: number
): SlotsType => {
  const slots: SlotsType = {};
  
  // Convert start and end times to minutes since midnight
  const startTime = startHours * 60 + startMinutes;
  const endTime = endHours * 60 + endMinutes;
  
  // Iterate through all time slots and check if they fall within the range
  TIME_SLOTS.forEach((slot) => {
    // Parse the time from slot label (e.g., "8:00 - 8:30")
    const [start, end] = slot.label.split(" - ");
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    
    const slotStartTime = startHour * 60 + startMin;
    const slotEndTime = endHour * 60 + endMin;
    
    // If the slot falls within the selected time range, mark it as true
    if (slotStartTime >= startTime && slotEndTime <= endTime) {
      slots[slot.id] = true;
    } else {
      slots[slot.id] = false;
    }
  });
  
  return slots;
};

// Zod schema for validation
export const timeSheetSchema = z.object({
  id: z.string().optional(),
  employeeName: z.string().min(1, "Tên nhân viên là bắt buộc"),
  employeeId: z.string().min(1, "Mã nhân viên là bắt buộc"),
  department: z.string().min(1, "Đơn vị là bắt buộc"),
  level: z.string().optional(),
  supervisor: z.string().optional(),
  teamLeader: z.string().optional(),
  shiftLeader: z.string().optional(),
  date: z.string().optional(),
  entries: z.array(
    z.object({
      id: z.string(),
      taskCode: z.string().optional(),
      taskId: z.string().optional(),
      taskName: z.string().optional(),
      target: z.string().optional(),
      note: z.string().optional(),
      slots: z.record(z.string(), z.boolean()).default({}),
      reasons: z.object({
        VT: z.boolean().default(false),
        CN: z.boolean().default(false),
        CL: z.boolean().default(false),
        MM: z.boolean().default(false),
      }),
      total: z.number().optional(),
    })
  ),
  status: z.string().optional().default("draft"),
  totalHours: z.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});