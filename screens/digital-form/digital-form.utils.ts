// utils/index.ts
import { format, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format a date to a localized string format
 * @param date Date object to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  if (!isValid(date)) return 'Ngày không hợp lệ';
  
  return format(date, 'dd MMMM yyyy', { locale: vi });
}

/**
 * Format a date and time to a localized string format
 * @param date Date object to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date): string {
  if (!isValid(date)) return 'Thời gian không hợp lệ';
  
  return format(date, 'dd MMMM yyyy HH:mm', { locale: vi });
}

/**
 * Format a time to a localized string format
 * @param date Date object to format
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  if (!isValid(date)) return 'Thời gian không hợp lệ';
  
  return format(date, 'HH:mm', { locale: vi });
}

/**
 * Format a time string (e.g., "07:30") to a user-friendly string
 * @param timeString Time string in "HH:MM" format
 * @returns Formatted time string
 */
export function formatTimeString(timeString: string): string {
  if (!timeString || !timeString.match(/^\d{2}:\d{2}$/)) {
    return timeString;
  }
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  
  return format(date, 'HH:mm', { locale: vi });
}

/**
 * Format a number with thousands separator
 * @param value Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

/**
 * Format a percentage value
 * @param value Number to format as percentage (0-100)
 * @param decimalPlaces Number of decimal places to show
 * @returns Formatted percentage string
 */
export function formatPercent(value: number, decimalPlaces: number = 0): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value / 100);
}

/**
 * Convert a time string to a Date object for the current day
 * @param timeString Time string in "HH:MM" format
 * @returns Date object for the current day with the specified time
 */
export function timeStringToDate(timeString: string): Date | null {
  if (!timeString || !timeString.match(/^\d{2}:\d{2}$/)) {
    return null;
  }
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  
  return date;
}

/**
 * Compare two time strings
 * @param time1 First time string in "HH:MM" format
 * @param time2 Second time string in "HH:MM" format
 * @returns -1 if time1 < time2, 0 if time1 === time2, 1 if time1 > time2
 */
export function compareTimeStrings(time1: string, time2: string): number {
  const date1 = timeStringToDate(time1);
  const date2 = timeStringToDate(time2);
  
  if (!date1 || !date2) return 0;
  
  return date1 < date2 ? -1 : date1 > date2 ? 1 : 0;
}

/**
 * Check if a time string is between two other time strings
 * @param time Time string to check
 * @param startTime Start time string
 * @param endTime End time string
 * @returns Boolean indicating if time is between startTime and endTime
 */
export function isTimeBetween(time: string, startTime: string, endTime: string): boolean {
  const timeDate = timeStringToDate(time);
  const startDate = timeStringToDate(startTime);
  const endDate = timeStringToDate(endTime);
  
  if (!timeDate || !startDate || !endDate) return false;
  
  return timeDate >= startDate && timeDate < endDate;
}

/**
 * Get the current time as a string in "HH:MM" format
 * @returns Current time string
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}