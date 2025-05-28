import { clsx, type ClassValue } from 'clsx';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: Date | string) {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}
export function formatDateTimeWithSeconds(date: Date | string) {
  return dayjs(date).format('DD/MM/YYYY HH:mm:ss');
}
export function formatDateTimeWithSecondsAndTimezone(date: Date | string) {
  return dayjs(date).format('DD/MM/YYYY HH:mm:ss Z');
}
export function formatDateTimeWithTimezone(date: Date | string) {
  return dayjs(date).format('DD/MM/YYYY HH:mm Z');
}
export function formatDateWithTimezone(date: Date | string) {
  return dayjs(date).format('DD/MM/YYYY Z');
}
export function formatDateWithTimezoneAndSeconds(date: Date | string) {
  return dayjs(date).format('DD/MM/YYYY Z HH:mm:ss');
}
export function formatDateWithSeconds(date: Date | string) {
  return dayjs(date).format('DD/MM/YYYY HH:mm:ss');
}
export function formatDate(date: Date | string) {
  return dayjs(date).format('DD/MM/YYYY');
}
