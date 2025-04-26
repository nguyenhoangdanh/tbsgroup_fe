// common/constants/time-intervals.ts

// Interface for time interval definition
export interface TimeInterval {
    start: string; // e.g., "07:30"
    end: string; // e.g., "08:30"
    label: string; // e.g., "07:30-08:30"
  }
  
  // Standard time intervals for digital forms
  export const STANDARD_TIME_INTERVALS: TimeInterval[] = [
    { start: '07:30', end: '08:30', label: '07:30-08:30' },
    { start: '08:30', end: '09:30', label: '08:30-09:30' },
    { start: '09:30', end: '10:30', label: '09:30-10:30' },
    { start: '10:30', end: '11:30', label: '10:30-11:30' },
    { start: '12:30', end: '13:30', label: '12:30-13:30' },
    { start: '13:30', end: '14:30', label: '13:30-14:30' },
    { start: '14:30', end: '15:30', label: '14:30-15:30' },
    { start: '15:30', end: '16:30', label: '15:30-16:30' },
    { start: '16:30', end: '17:30', label: '16:30-17:30' },
    { start: '17:30', end: '18:00', label: '17:30-18:00' },
    { start: '18:00', end: '19:00', label: '18:00-19:00' },
    { start: '19:00', end: '20:00', label: '19:00-20:00' },
  ];
  
  // Helper function to find a time interval by label
  export const findTimeIntervalByLabel = (label: string): TimeInterval | undefined => {
    return STANDARD_TIME_INTERVALS.find(interval => interval.label === label);
  };
  
  // Helper function to get all time interval labels
  export const getAllTimeIntervalLabels = (): string[] => {
    return STANDARD_TIME_INTERVALS.map(interval => interval.label);
  };
  
  // Get list of regular shift hours (7:30 - 16:30)
  export const REGULAR_SHIFT_INTERVALS = STANDARD_TIME_INTERVALS.slice(0, 8);
  
  // Get list of extended shift hours (16:30 - 18:00)
  export const EXTENDED_SHIFT_INTERVALS = STANDARD_TIME_INTERVALS.slice(8, 10);
  
  // Get list of overtime shift hours (18:00 - 20:00)
  export const OVERTIME_SHIFT_INTERVALS = STANDARD_TIME_INTERVALS.slice(10, 12);