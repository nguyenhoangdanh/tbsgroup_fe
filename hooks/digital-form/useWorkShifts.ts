import { useMemo } from 'react';

import {
  REGULAR_TIME_SLOTS,
  EXTENDED_TIME_SLOTS,
  OVERTIME_TIME_SLOTS,
  getCurrentTimeSlot,
  isTimeInTimeSlot,
} from '@/common/constants/time-slots';
import { WORK_SCHEDULES } from '@/common/constants/work-schedules';
import { ShiftType, TimeInterval } from '@/common/types/digital-form';

/**
 * Hook for managing work shifts and time slots
 * Provides utilities for working with time slots in digital forms
 */
export const useWorkShifts = (shiftType: ShiftType = ShiftType.REGULAR) => {
  // Get the time slots for the current shift type
  const timeSlots = useMemo(() => {
    switch (shiftType) {
      case ShiftType.REGULAR:
        return REGULAR_TIME_SLOTS;
      case ShiftType.EXTENDED:
        return [...REGULAR_TIME_SLOTS, ...EXTENDED_TIME_SLOTS];
      case ShiftType.OVERTIME:
        return [...REGULAR_TIME_SLOTS, ...EXTENDED_TIME_SLOTS, ...OVERTIME_TIME_SLOTS];
      default:
        return REGULAR_TIME_SLOTS;
    }
  }, [shiftType]);

  // Get the current time slot
  const currentSlot = useMemo(() => {
    return getCurrentTimeSlot();
  }, []);

  // Get the shift schedule information
  const shiftSchedule = useMemo(() => {
    return WORK_SCHEDULES[shiftType];
  }, [shiftType]);

  // Calculate total working hours for this shift
  const totalWorkingHours = useMemo(() => {
    let totalMinutes = 0;

    timeSlots.forEach(slot => {
      // Calculate duration of each time slot in minutes
      const startTime = new Date(`1970-01-01T${slot.start}:00`);
      const endTime = new Date(`1970-01-01T${slot.end}:00`);

      // If end time is before start time, it means the slot crosses midnight
      // Add 24 hours (in milliseconds) to the end time
      const endTimeValue =
        endTime < startTime ? endTime.getTime() + 24 * 60 * 60 * 1000 : endTime.getTime();

      const durationMinutes = (endTimeValue - startTime.getTime()) / (1000 * 60);
      totalMinutes += durationMinutes;
    });

    // Convert total minutes to hours and round to 2 decimal places
    return Math.round((totalMinutes / 60) * 100) / 100;
  }, [timeSlots]);

  // Check if a specific time is within the current shift
  const isTimeInShift = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const timeValue = hours * 60 + minutes;

    const [startHours, startMinutes] = shiftSchedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = shiftSchedule.endTime.split(':').map(Number);

    const shiftStartValue = startHours * 60 + startMinutes;
    const shiftEndValue = endHours * 60 + endMinutes;

    return timeValue >= shiftStartValue && timeValue <= shiftEndValue;
  };

  // Check if a time is during a break
  const isBreakTime = (time: string) => {
    return shiftSchedule.breakTimes.some(breakTime => {
      const [breakStartHours, breakStartMinutes] = breakTime.start.split(':').map(Number);
      const [breakEndHours, breakEndMinutes] = breakTime.end.split(':').map(Number);

      const breakStartValue = breakStartHours * 60 + breakStartMinutes;
      const breakEndValue = breakEndHours * 60 + breakEndMinutes;

      const [timeHours, timeMinutes] = time.split(':').map(Number);
      const timeValue = timeHours * 60 + timeMinutes;

      return timeValue >= breakStartValue && timeValue < breakEndValue;
    });
  };

  // Get productivity time slots (excluding breaks)
  const productivityTimeSlots = useMemo(() => {
    return timeSlots.filter(slot => {
      // Check if this slot overlaps with any break time
      const isBreak = shiftSchedule.breakTimes.some(breakTime => {
        // Check if the slot overlaps with break time
        const [slotStartHours, slotStartMinutes] = slot.start.split(':').map(Number);
        const [slotEndHours, slotEndMinutes] = slot.end.split(':').map(Number);
        const [breakStartHours, breakStartMinutes] = breakTime.start.split(':').map(Number);
        const [breakEndHours, breakEndMinutes] = breakTime.end.split(':').map(Number);

        const slotStartValue = slotStartHours * 60 + slotStartMinutes;
        const slotEndValue = slotEndHours * 60 + slotEndMinutes;
        const breakStartValue = breakStartHours * 60 + breakStartMinutes;
        const breakEndValue = breakEndHours * 60 + breakEndMinutes;

        // Check for any overlap between slot and break
        return !(slotEndValue <= breakStartValue || slotStartValue >= breakEndValue);
      });

      return !isBreak;
    });
  }, [timeSlots, shiftSchedule]);

  // Format time slot for display
  const formatTimeSlot = (slot: TimeInterval) => {
    return `${slot.start} - ${slot.end}`;
  };

  // Get time slot labels for UI display
  const timeSlotLabels = useMemo(() => {
    return timeSlots.map(slot => slot.label);
  }, [timeSlots]);

  // Convert hourly data to a time-indexed object
  const formatHourlyData = (hourlyData: Record<string, number> = {}) => {
    return timeSlots.reduce<Record<string, number>>((acc, slot) => {
      acc[slot.label] = hourlyData[slot.label] || 0;
      return acc;
    }, {});
  };

  // Calculate total output from hourly data
  const calculateTotalOutput = (hourlyData: Record<string, number> = {}) => {
    return Object.values(hourlyData).reduce((total, value) => total + (value || 0), 0);
  };

  // Check if the current time is within a specific time slot
  const isCurrentTimeInSlot = (slot: TimeInterval) => {
    return isTimeInTimeSlot(new Date(), slot);
  };

  // Get all slots before the current time
  const getPreviousTimeSlots = () => {
    if (!currentSlot) return [];

    const currentSlotIndex = timeSlots.findIndex(slot => slot.label === currentSlot.label);

    if (currentSlotIndex === -1) return [];

    return timeSlots.slice(0, currentSlotIndex);
  };

  return {
    // Time slot data
    timeSlots,
    productivityTimeSlots,
    currentSlot,
    timeSlotLabels,

    // Shift information
    shiftType,
    shiftSchedule,
    totalWorkingHours,

    // Utility functions
    isTimeInShift,
    isBreakTime,
    isTimeInSlot: isTimeInTimeSlot,
    formatTimeSlot,
    formatHourlyData,
    calculateTotalOutput,
    isCurrentTimeInSlot,
    getPreviousTimeSlots,
  };
};

export default useWorkShifts;
