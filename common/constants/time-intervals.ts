import { TimeInterval } from '../types/digital-form';

/**
 * Standard time intervals used throughout the application
 * These match the backend's STANDARD_TIME_INTERVALS constant
 */

export const REGULAR_TIME_INTERVALS: TimeInterval[] = [
  { start: '07:30', end: '08:30', label: '07:30-08:30' },
  { start: '08:30', end: '09:30', label: '08:30-09:30' },
  { start: '09:30', end: '10:30', label: '09:30-10:30' },
  { start: '10:30', end: '11:30', label: '10:30-11:30' },
  { start: '12:30', end: '13:30', label: '12:30-13:30' },
  { start: '13:30', end: '14:30', label: '13:30-14:30' },
  { start: '14:30', end: '15:30', label: '14:30-15:30' },
  { start: '15:30', end: '16:30', label: '15:30-16:30' },
];

export const EXTENDED_TIME_INTERVALS: TimeInterval[] = [
  { start: '16:30', end: '17:00', label: '16:30-17:00' },
  { start: '17:00', end: '18:00', label: '17:00-18:00' },
];

export const OVERTIME_TIME_INTERVALS: TimeInterval[] = [
  { start: '18:00', end: '19:00', label: '18:00-19:00' },
  { start: '19:00', end: '20:00', label: '19:00-20:00' },
];

// All time intervals combined
export const ALL_TIME_INTERVALS: TimeInterval[] = [
  ...REGULAR_TIME_INTERVALS,
  ...EXTENDED_TIME_INTERVALS,
  ...OVERTIME_TIME_INTERVALS,
];

// Helper functions
export const getTimeIntervalsByShiftType = (shiftType: string): TimeInterval[] => {
  switch (shiftType) {
    case 'REGULAR':
      return REGULAR_TIME_INTERVALS;
    case 'EXTENDED':
      return [...REGULAR_TIME_INTERVALS, ...EXTENDED_TIME_INTERVALS];
    case 'OVERTIME':
      return [...REGULAR_TIME_INTERVALS, ...EXTENDED_TIME_INTERVALS, ...OVERTIME_TIME_INTERVALS];
    default:
      return REGULAR_TIME_INTERVALS;
  }
};

export const getTimeSlotLabels = (intervals: TimeInterval[]): string[] => {
  return intervals.map(interval => interval.label);
};

export const formatTimeRange = (start: string, end: string): string => {
  return `${start}-${end}`;
};

/**
 * Get the current time interval based on the current time
 * Returns null if the current time is not within any interval (e.g., lunch break)
 */
export const getCurrentInterval = (): TimeInterval | null => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeValue = currentHour + currentMinute / 60;

  return (
    ALL_TIME_INTERVALS.find(interval => {
      const [startHour, startMinute] = interval.start.split(':').map(Number);
      const [endHour, endMinute] = interval.end.split(':').map(Number);

      const intervalStartValue = startHour + startMinute / 60;
      const intervalEndValue = endHour + endMinute / 60;

      return currentTimeValue >= intervalStartValue && currentTimeValue < intervalEndValue;
    }) || null
  );
};

/**
 * Check if a time falls within a time interval
 */
export const isTimeInInterval = (time: string, interval: TimeInterval): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const timeValue = hours + minutes / 60;

  const [startHour, startMinute] = interval.start.split(':').map(Number);
  const [endHour, endMinute] = interval.end.split(':').map(Number);

  const intervalStartValue = startHour + startMinute / 60;
  const intervalEndValue = endHour + endMinute / 60;

  return timeValue >= intervalStartValue && timeValue < intervalEndValue;
};

export default ALL_TIME_INTERVALS;
