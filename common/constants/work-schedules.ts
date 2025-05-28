import { REGULAR_TIME_SLOTS, EXTENDED_TIME_SLOTS, OVERTIME_TIME_SLOTS } from './time-slots';
import { ShiftType } from '../types/digital-form';

/**
 * Work schedule interface that matches backend implementation
 */
export interface WorkSchedule {
  type: ShiftType;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  breakTimes: Array<{
    start: string;
    end: string;
    description: string;
  }>;
  totalHours: number;
}

/**
 * Work schedule definitions for each shift type
 */
export const WORK_SCHEDULES: Record<ShiftType, WorkSchedule> = {
  [ShiftType.REGULAR]: {
    type: ShiftType.REGULAR,
    name: 'Ca Thường',
    description: 'Ca làm việc chuẩn từ 7h30 đến 16h30',
    startTime: '07:30',
    endTime: '16:30',
    breakTimes: [
      {
        start: '11:30',
        end: '12:30',
        description: 'Nghỉ trưa',
      },
    ],
    totalHours: 8,
  },
  [ShiftType.EXTENDED]: {
    type: ShiftType.EXTENDED,
    name: 'Ca Kéo Dài',
    description: 'Ca làm việc kéo dài từ 16h30 đến 18h',
    startTime: '16:30',
    endTime: '18:00',
    breakTimes: [],
    totalHours: 1.5,
  },
  [ShiftType.OVERTIME]: {
    type: ShiftType.OVERTIME,
    name: 'Ca Tăng Ca',
    description: 'Ca tăng ca từ 18h đến 20h',
    startTime: '18:00',
    endTime: '20:00',
    breakTimes: [],
    totalHours: 2,
  },
};

/**
 * Get work schedule for a specific shift type
 */
export function getWorkSchedule(shiftType: ShiftType): WorkSchedule {
  return WORK_SCHEDULES[shiftType] || WORK_SCHEDULES[ShiftType.REGULAR];
}

/**
 * Get shift name
 */
export function getShiftName(shiftType: ShiftType): string {
  return WORK_SCHEDULES[shiftType]?.name || 'Ca Thường';
}

/**
 * Get total working hours for a shift type
 */
export function getTotalWorkingHours(shiftType: ShiftType): number {
  return WORK_SCHEDULES[shiftType]?.totalHours || 8;
}

/**
 * Get cumulative working hours (sum of all shifts up to the specified shift)
 */
export function getCumulativeWorkingHours(shiftType: ShiftType): number {
  switch (shiftType) {
    case ShiftType.REGULAR:
      return 8;
    case ShiftType.EXTENDED:
      return 8 + 1.5;
    case ShiftType.OVERTIME:
      return 8 + 1.5 + 2;
    default:
      return 8;
  }
}

/**
 * Get time slots for a specific shift
 */
export function getShiftTimeSlots(shiftType: ShiftType) {
  switch (shiftType) {
    case ShiftType.REGULAR:
      return REGULAR_TIME_SLOTS;
    case ShiftType.EXTENDED:
      return EXTENDED_TIME_SLOTS;
    case ShiftType.OVERTIME:
      return OVERTIME_TIME_SLOTS;
    default:
      return REGULAR_TIME_SLOTS;
  }
}

export default WORK_SCHEDULES;
