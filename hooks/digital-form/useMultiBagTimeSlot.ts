// hooks/digital-form-hooks/useMultiBagTimeSlot.ts
import {useCallback} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {toast} from '@/hooks/use-toast';
import {useDigitalFormMutations} from './useDigitalFormMutations';
import {DigitalFormEntry} from '@/common/types/digital-form';
import {TDigitalFormEntry} from '@/schemas/digital-form.schema';

/**
 * Hook for managing multiple bag entries per worker per time slot
 */
export const useMultiBagTimeSlot = (formId: string) => {
  const queryClient = useQueryClient();
  const {addFormEntryMutation, updateHourlyDataMutation} = useDigitalFormMutations();

  /**
   * Add a new bag entry for a worker in a specific time slot
   */
  const addBagForTimeSlot = useCallback(
    async (
      workerId: string,
      bagData: {
        bagId: string;
        bagName: string;
        processId: string;
        processName: string;
        colorId: string;
        colorName: string;
        timeSlot: string;
        quantity: number;
      },
    ) => {
      if (!formId) {
        toast({
          title: 'Error',
          description: 'Form ID is required',
          variant: 'destructive',
        });
        return false;
      }

      try {
        // First, get worker's information from the existing entries
        const workerEntries = queryClient.getQueryData<{form: any; entries: DigitalFormEntry[]}>([
          'digital-form-with-entries',
          formId,
        ]);
        const existingEntry = workerEntries?.entries.find(entry => entry.id === workerId);

        if (!existingEntry || !existingEntry.userId) {
          throw new Error('Worker information not found');
        }

        // Check if an entry already exists for this worker with the same bag/process/color combination
        const existingBagEntry = workerEntries?.entries.find(
          entry =>
            entry.userId === existingEntry.userId &&
            entry.handBagId === bagData.bagId &&
            entry.processId === bagData.processId &&
            entry.bagColorId === bagData.colorId,
        );

        if (existingBagEntry) {
          // Update existing entry with new hourly data for this time slot
          const hourlyData = {
            ...existingBagEntry.hourlyData,
            [bagData.timeSlot]: bagData.quantity,
          };

          // Calculate new total
          const newTotal = Object.values(hourlyData).reduce((sum, val) => sum + (val || 0), 0);

          // Use updateHourlyDataMutation to update the entry
          await updateHourlyDataMutation.mutateAsync({
            formId,
            entryId: existingBagEntry.id,
            timeSlot: bagData.timeSlot,
            quantity: bagData.quantity,
          });

          toast({
            title: 'Bag Updated',
            description: `Updated ${bagData.bagName} output for ${bagData.timeSlot}`,
          });
        } else {
          // Create a new entry for this bag
          const newEntryData: TDigitalFormEntry = {
            userId: existingEntry.userId,
            handBagId: bagData.bagId,
            processId: bagData.processId,
            bagColorId: bagData.colorId,
            hourlyData: {[bagData.timeSlot]: bagData.quantity},
            attendanceStatus: existingEntry.attendanceStatus,
            totalOutput: bagData.quantity, // Initial total is just the quantity for this time slot
            shiftType: existingEntry.shiftType,
          };

          // Add the new entry
          await addFormEntryMutation.mutateAsync({formId, data: newEntryData});

          toast({
            title: 'New Bag Added',
            description: `Added ${bagData.bagName} for ${bagData.timeSlot}`,
          });
        }

        // Refresh data
        await queryClient.invalidateQueries({queryKey: ['digital-form-with-entries', formId]});

        return true;
      } catch (error) {
        console.error('Error adding bag for time slot:', error);
        toast({
          title: 'Error Adding Bag',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive',
        });
        return false;
      }
    },
    [formId, queryClient, addFormEntryMutation, updateHourlyDataMutation],
  );

  /**
   * Update output for a specific bag in a specific time slot
   */
  const updateBagTimeSlotOutput = useCallback(
    async (entryId: string, timeSlot: string, quantity: number) => {
      if (!formId) {
        toast({
          title: 'Error',
          description: 'Form ID is required',
          variant: 'destructive',
        });
        return false;
      }

      try {
        // Update hourly data for this specific entry and time slot
        await updateHourlyDataMutation.mutateAsync({
          formId,
          entryId,
          timeSlot,
          quantity,
        });

        toast({
          title: 'Output Updated',
          description: `Updated output for ${timeSlot}`,
        });

        // Refresh data
        await queryClient.invalidateQueries({queryKey: ['digital-form-with-entries', formId]});

        return true;
      } catch (error) {
        console.error('Error updating bag time slot output:', error);
        toast({
          title: 'Error Updating Output',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive',
        });
        return false;
      }
    },
    [formId, queryClient, updateHourlyDataMutation],
  );

  /**
   * Get all bags and their outputs for a worker in a specific time slot
   */
  const getBagsForTimeSlot = useCallback(
    (workerId: string, timeSlot: string, allWorkerEntries: DigitalFormEntry[]) => {
      if (!allWorkerEntries || allWorkerEntries.length === 0) {
        return [];
      }

      // First, find the worker to get the userId
      const workerEntry = allWorkerEntries.find(entry => entry.id === workerId);
      if (!workerEntry || !workerEntry.userId) {
        return [];
      }

      // Find all entries for this user
      const userEntries = allWorkerEntries.filter(entry => entry.userId === workerEntry.userId);

      console.log('userEntries', userEntries);

      // Get all bags with output in this time slot
      return userEntries
        .map(entry => ({
          entryId: entry.id,
          bagId: entry.handBagId,
          bagName: entry.handBagName || 'Unknown Bag',
          processId: entry.processId,
          processName: entry.processName || 'Unknown Process',
          colorId: entry.bagColorId,
          colorName: entry.bagColorName || 'Unknown Color',
          output: entry.hourlyData?.[timeSlot] || 0,
        }))
        .filter(bag => bag.output > 0 || timeSlot === '');
    },
    [],
  );

  /**
   * Calculate hourly data organized by time slot for a worker
   */
  const getHourlyDataByTimeSlot = useCallback(
    (workerId: string, allWorkerEntries: DigitalFormEntry[]) => {
      if (!allWorkerEntries || allWorkerEntries.length === 0) {
        return {};
      }

      // Find the worker to get the userId
      const workerEntry = allWorkerEntries.find(entry => entry.id === workerId);
      if (!workerEntry || !workerEntry.userId) {
        return {};
      }

      // Find all entries for this user
      const userEntries = allWorkerEntries.filter(entry => entry.userId === workerEntry.userId);

      // Organize hourly data by time slot
      const result: Record<
        string,
        {
          totalOutput: number;
          bags: Array<{
            entryId: string;
            bagId: string;
            bagName: string;
            processId: string;
            processName: string;
            colorId: string;
            colorName: string;
            output: number;
          }>;
        }
      > = {};

      // Initialize with empty data for all time slots
      const timeSlots = [
        '07:30-08:30',
        '08:30-09:30',
        '09:30-10:30',
        '10:30-11:30',
        '12:30-13:30',
        '13:30-14:30',
        '14:30-15:30',
        '15:30-16:30',
        '16:30-17:00',
        '17:00-18:00',
        '18:00-19:00',
        '19:00-20:00',
      ];

      timeSlots.forEach(slot => {
        result[slot] = {totalOutput: 0, bags: []};
      });

      // Fill in data from entries
      userEntries.forEach(entry => {
        if (!entry.hourlyData) return;

        Object.entries(entry.hourlyData).forEach(([timeSlot, output]) => {
          if (!result[timeSlot]) {
            result[timeSlot] = {totalOutput: 0, bags: []};
          }

          // Add to total output for this time slot
          result[timeSlot].totalOutput += output;

          // Add bag info
          result[timeSlot].bags.push({
            entryId: entry.id,
            bagId: entry.handBagId || '',
            bagName: entry.handBagName || 'Unknown Bag',
            processId: entry.processId || '',
            processName: entry.processName || 'Unknown Process',
            colorId: entry.bagColorId || '',
            colorName: entry.bagColorName || 'Unknown Color',
            output: output,
          });
        });
      });

      return result;
    },
    [],
  );

  return {
    addBagForTimeSlot,
    updateBagTimeSlotOutput,
    getBagsForTimeSlot,
    getHourlyDataByTimeSlot,
  };
};
