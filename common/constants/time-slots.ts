// common/constants/time-slots.ts
import { TimeSlot } from "../types/worker";

export const TIME_SLOTS: TimeSlot[] = [
  { id: "1", start: "07:30", end: "08:30", label: "07:30-08:30" },
  { id: "2", start: "08:30", end: "09:30", label: "08:30-09:30" },
  { id: "3", start: "09:30", end: "10:30", label: "09:30-10:30" },
  { id: "4", start: "10:30", end: "11:30", label: "10:30-11:30" },
  { id: "5", start: "12:30", end: "13:30", label: "12:30-13:30" },
  { id: "6", start: "13:30", end: "14:30", label: "13:30-14:30" },
  { id: "7", start: "14:30", end: "15:30", label: "14:30-15:30" },
  { id: "8", start: "15:30", end: "16:30", label: "15:30-16:30" },
  { id: "9", start: "16:30", end: "17:00", label: "16:30-17:00" },
  { id: "10", start: "17:00", end: "18:00", label: "17:00-18:00" },
  { id: "11", start: "18:00", end: "19:00", label: "18:00-19:00" },
  { id: "12", start: "19:00", end: "20:00", label: "19:00-20:00" },
];

/**
 * Get the current time slot based on the current time
 * @returns The current time slot if found, otherwise null
 */
export const getCurrentTimeSlot = (): TimeSlot | null => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  return (
    TIME_SLOTS.find((slot) => {
      return currentTime >= slot.start && currentTime < slot.end;
    }) || null
  );
};

/**
 * Get all completed time slots (time slots that have ended)
 * @returns Array of completed time slots
 */
export const getCompletedTimeSlots = (): TimeSlot[] => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  return TIME_SLOTS.filter((slot) => currentTime > slot.end);
};

/**
 * Get all pending time slots (time slots that have not started yet)
 * @returns Array of pending time slots
 */
export const getPendingTimeSlots = (): TimeSlot[] => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  return TIME_SLOTS.filter((slot) => currentTime < slot.start);
};