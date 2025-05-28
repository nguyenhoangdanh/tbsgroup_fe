import { TimeInterval } from '../types/digital-form';

/**
 * Standard time slots used throughout the application
 * These match the backend's STANDARD_TIME_INTERVALS constant
 */

// Regular shift time slots (7:30 AM - 16:30 PM)
export const REGULAR_TIME_SLOTS: TimeInterval[] = [
  { start: '07:30', end: '08:30', label: '07:30-08:30' },
  { start: '08:30', end: '09:30', label: '08:30-09:30' },
  { start: '09:30', end: '10:30', label: '09:30-10:30' },
  { start: '10:30', end: '11:30', label: '10:30-11:30' },
  { start: '12:30', end: '13:30', label: '12:30-13:30' },
  { start: '13:30', end: '14:30', label: '13:30-14:30' },
  { start: '14:30', end: '15:30', label: '14:30-15:30' },
  { start: '15:30', end: '16:30', label: '15:30-16:30' },
];

// Extended shift time slots (16:30 PM - 18:00 PM)
export const EXTENDED_TIME_SLOTS: TimeInterval[] = [
  { start: '16:30', end: '17:00', label: '16:30-17:00' },
  { start: '17:00', end: '18:00', label: '17:00-18:00' },
];

// Overtime shift time slots (18:00 PM - 20:00 PM)
export const OVERTIME_TIME_SLOTS: TimeInterval[] = [
  { start: '18:00', end: '19:00', label: '18:00-19:00' },
  { start: '19:00', end: '20:00', label: '19:00-20:00' },
];

// All time intervals combined
export const ALL_TIME_SLOTS: TimeInterval[] = [
  ...REGULAR_TIME_SLOTS,
  ...EXTENDED_TIME_SLOTS,
  ...OVERTIME_TIME_SLOTS,
];

// Break time slots
export const BREAK_TIME_SLOTS: TimeInterval[] = [
  { start: '11:30', end: '12:30', label: '11:30-12:30' },
];

/**
 * Get time slots based on shift type
 */
export function getTimeSlotsForShift(shiftType: string): TimeInterval[] {
  switch (shiftType) {
    case 'REGULAR':
      return REGULAR_TIME_SLOTS;
    case 'EXTENDED':
      return [...REGULAR_TIME_SLOTS, ...EXTENDED_TIME_SLOTS];
    case 'OVERTIME':
      return [...REGULAR_TIME_SLOTS, ...EXTENDED_TIME_SLOTS, ...OVERTIME_TIME_SLOTS];
    default:
      return REGULAR_TIME_SLOTS;
  }
}

/**
 * Convert time slots to label array
 */
export function getTimeSlotLabels(intervals: TimeInterval[]): string[] {
  return intervals.map(interval => interval.label);
}

/**
 * Check if a time is currently within working hours
 */
export function isInWorkingHours(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check if it's a lunch break (11:30 - 12:30)
  if (currentHour === 11 && currentMinute >= 30) return false;
  if (currentHour === 12 && currentMinute < 30) return false;

  // Check if it's within working hours (7:30 AM - 8:00 PM)
  if (currentHour < 7) return false;
  if (currentHour === 7 && currentMinute < 30) return false;
  if (currentHour > 20) return false;
  if (currentHour === 20 && currentMinute > 0) return false;

  return true;
}

/**
 * Get the current time slot based on current time
 */
export function getCurrentTimeSlot(): TimeInterval | null {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  for (const slot of ALL_TIME_SLOTS) {
    if (isTimeInTimeSlot(currentTime, slot)) {
      return slot;
    }
  }

  return null; // Not in any time slot (e.g., lunch break)
}

/**
 * Check if a time falls within a time slot
 */
export function isTimeInTimeSlot(time: string, slot: TimeInterval): boolean {
  const [timeHour, timeMinute] = time.split(':').map(Number);
  const [startHour, startMinute] = slot.start.split(':').map(Number);
  const [endHour, endMinute] = slot.end.split(':').map(Number);

  const timeValue = timeHour * 60 + timeMinute;
  const startValue = startHour * 60 + startMinute;
  const endValue = endHour * 60 + endMinute;

  return timeValue >= startValue && timeValue < endValue;
}

/**
 * Format a time slot label for display
 */
export function formatTimeSlot(slot: TimeInterval): string {
  return `${slot.start} - ${slot.end}`;
}

export default ALL_TIME_SLOTS;
