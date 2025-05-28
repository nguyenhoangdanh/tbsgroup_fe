import { ShiftType } from '../types/digital-form';

/**
 * Defines the working schedules for each shift type
 * These match the backend implementation
 */
export interface ShiftSchedule {
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

export const SHIFT_SCHEDULES: Record<ShiftType, ShiftSchedule> = {
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

export const getShiftSchedule = (type: ShiftType): ShiftSchedule => {
  return SHIFT_SCHEDULES[type] || SHIFT_SCHEDULES[ShiftType.REGULAR];
};

export const getShiftName = (type: ShiftType): string => {
  return SHIFT_SCHEDULES[type]?.name || 'Ca Thường';
};

export const getFullWorkingHours = (shiftType: ShiftType): number => {
  switch (shiftType) {
    case ShiftType.REGULAR:
      return 8;
    case ShiftType.EXTENDED:
      return 9.5;
    case ShiftType.OVERTIME:
      return 11.5;
    default:
      return 8;
  }
};

export default SHIFT_SCHEDULES;
