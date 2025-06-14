import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toast-kit';


import { AttendanceStatus, ShiftType } from '@/common/types/digital-form';
import {
  DigitalFormCreateRequest,
  DigitalFormUpdateRequest,
  DigitalFormEntryRequest,
  FormEntryUpdateRequest,
  DigitalFormSubmitRequest,
} from '@/common/types/digital-form-dto';
import digitalFormApi from '@/services/api/digitalFormApi';

import { digitalFormKeys } from './useDigitalFormQueries';

/**
 * React Query hook for digital form mutations (create, update, delete operations)
 * Handles automatic cache invalidation and optimistic updates
 */
export const useDigitalFormMutations = (onError?: (error: any, operation: string) => void) => {
  const queryClient = useQueryClient();

  // Default error handler if not provided
  const defaultErrorHandler = (error: any, operation: string) => {
    console.error(`Error during ${operation}:`, error);
    toast.error(`Operation failed: ${error.message || 'Unknown error'}`);
  };

  // Use provided error handler or default
  const handleError = onError || defaultErrorHandler;

  // Create a new digital form
  const createFormMutation = useMutation({
    mutationFn: async (data: DigitalFormCreateRequest) => {
      const response = await digitalFormApi.createDigitalForm(data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create form');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate list queries to refetch the list after creation
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.lists() });
      toast.success('Digital form created successfully');
    },
    onError: error => handleError(error, 'creating form'),
  });

  // Create a form for a specific worker
  const createWorkerFormMutation = useMutation({
    mutationFn: async (workerId: string) => {
      const response = await digitalFormApi.createDigitalFormForWorker(workerId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create worker form');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.lists() });
      toast.success('Worker form created successfully');
    },
    onError: error => handleError(error, 'creating worker form'),
  });

  // Generate daily forms (admin function)
  const generateDailyFormsMutation = useMutation({
    mutationFn: async (options?: {
      handBagId?: string;
      bagProcessId?: string;
      bagColorId?: string;
    }) => {
      const response = await digitalFormApi.generateDailyForms(options);
      if (!response.success) {
        throw new Error(response.message || 'Failed to generate daily forms');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.lists() });
      toast.success('Daily forms generated successfully');
    },
    onError: error => handleError(error, 'generating daily forms'),
  });

  // Update digital form
  const updateFormMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DigitalFormUpdateRequest }) => {
      const response = await digitalFormApi.updateDigitalForm(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update form');
      }
      return { id, ...data };
    },
    onSuccess: result => {
      // Invalidate specific form and list queries
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.detail(result.id) });
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.lists() });
      toast.success('Form updated successfully');
    },
    onError: error => handleError(error, 'updating form'),
  });

  // Delete digital form
  const deleteFormMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await digitalFormApi.deleteDigitalForm(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete form');
      }
      return id;
    },
    onSuccess: id => {
      // Invalidate specific form and list queries
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.lists() });
      toast.success('Form deleted successfully');
    },
    onError: error => handleError(error, 'deleting form'),
  });

  // Add entry to form
  const addFormEntryMutation = useMutation({
    mutationFn: async ({ formId, data }: { formId: string; data: DigitalFormEntryRequest }) => {
      const response = await digitalFormApi.addFormEntry(formId, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to add entry');
      }
      return { formId, entryId: response.data?.id };
    },
    onSuccess: result => {
      // Invalidate form with entries and detail queries
      queryClient.invalidateQueries({
        queryKey: digitalFormKeys.detailWithEntries(result.formId),
      });
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.detail(result.formId) });
      toast.success('Entry added successfully');
    },
    onError: error => handleError(error, 'adding form entry'),
  });

  // Add bulk entries to form
  const addBulkEntriesMutation = useMutation({
    mutationFn: async ({
      formId,
      entries,
    }: {
      formId: string;
      entries: Array<{
        handBagId: string;
        bagColorId: string;
        processId: string;
        plannedOutput: number;
      }>;
    }) => {
      const response = await digitalFormApi.addBulkEntries(formId, entries);
      if (!response.success) {
        throw new Error(response.message || 'Failed to add bulk entries');
      }
      return { formId, entries: response.data?.entries || [] };
    },
    onSuccess: result => {
      // Invalidate form with entries and detail queries
      queryClient.invalidateQueries({
        queryKey: digitalFormKeys.detailWithEntries(result.formId),
      });
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.detail(result.formId) });
      toast.success(`${result.entries.length} entries added successfully`);
    },
    onError: error => handleError(error, 'adding bulk entries'),
  });

  // Update form entry
  const updateFormEntryMutation = useMutation({
    mutationFn: async ({
      formId,
      entryId,
      data,
    }: {
      formId: string;
      entryId: string;
      data: FormEntryUpdateRequest;
    }) => {
      const response = await digitalFormApi.updateEntry(formId, entryId, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update entry');
      }
      return { formId, entryId };
    },
    onSuccess: result => {
      // Invalidate form with entries queries
      queryClient.invalidateQueries({
        queryKey: digitalFormKeys.detailWithEntries(result.formId),
      });
      toast.success('Entry updated successfully');
    },
    onError: error => handleError(error, 'updating entry'),
  });

  // Update hourly data
  const updateHourlyDataMutation = useMutation({
    mutationFn: async ({
      formId,
      entryId,
      handBagId,
      bagColorId,
      processId,
      hourlyData,
    }: {
      formId: string;
      entryId: string;
      handBagId: string;
      bagColorId: string;
      processId: string;
      hourlyData: Record<string, number>;
    }) => {
      const response = await digitalFormApi.updateEntryHourlyData(formId, entryId, {
        handBagId,
        bagColorId,
        processId,
        hourlyData,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update hourly data');
      }
      return { formId, entryId, hourlyData };
    },
    onSuccess: result => {
      // Invalidate form with entries queries
      queryClient.invalidateQueries({
        queryKey: digitalFormKeys.detailWithEntries(result.formId),
      });
      // Don't show toast on hourly data update to avoid spamming
    },
    onError: error => handleError(error, 'updating hourly data'),
  });

  // Update attendance status
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({
      formId,
      entryId,
      handBagId,
      bagColorId,
      processId,
      attendanceStatus,
      attendanceNote,
    }: {
      formId: string;
      entryId: string;
      handBagId: string;
      bagColorId: string;
      processId: string;
      attendanceStatus: AttendanceStatus;
      attendanceNote?: string;
    }) => {
      const response = await digitalFormApi.updateEntryAttendance(formId, entryId, {
        handBagId,
        bagColorId,
        processId,
        attendanceStatus,
        attendanceNote,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update attendance');
      }
      return { formId, entryId, attendanceStatus };
    },
    onSuccess: result => {
      // Invalidate form with entries queries
      queryClient.invalidateQueries({
        queryKey: digitalFormKeys.detailWithEntries(result.formId),
      });
      toast.success('Attendance status updated');
    },
    onError: error => handleError(error, 'updating attendance'),
  });

  // Update shift type
  const updateShiftTypeMutation = useMutation({
    mutationFn: async ({
      formId,
      entryId,
      shiftType,
    }: {
      formId: string;
      entryId: string;
      shiftType: ShiftType;
    }) => {
      const response = await digitalFormApi.updateEntryShiftType(formId, entryId, shiftType);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update shift type');
      }
      return { formId, entryId, shiftType };
    },
    onSuccess: result => {
      // Invalidate form with entries queries
      queryClient.invalidateQueries({
        queryKey: digitalFormKeys.detailWithEntries(result.formId),
      });
      toast.success('Shift type updated');
    },
    onError: error => handleError(error, 'updating shift type'),
  });

  // Delete form entry
  const deleteFormEntryMutation = useMutation({
    mutationFn: async ({ formId, entryId }: { formId: string; entryId: string }) => {
      const response = await digitalFormApi.deleteFormEntry(formId, entryId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete entry');
      }
      return { formId, entryId };
    },
    onSuccess: result => {
      // Invalidate form with entries queries
      queryClient.invalidateQueries({
        queryKey: digitalFormKeys.detailWithEntries(result.formId),
      });
      toast.success('Entry deleted successfully');
    },
    onError: error => handleError(error, 'deleting entry'),
  });

  // Submit form for approval
  const submitFormMutation = useMutation({
    mutationFn: async ({ formId, data }: { formId: string; data?: DigitalFormSubmitRequest }) => {
      const response = await digitalFormApi.submitDigitalForm(formId, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to submit form');
      }
      return { formId };
    },
    onSuccess: result => {
      // Invalidate specific form and list queries
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.detail(result.formId) });
      queryClient.invalidateQueries({
        queryKey: digitalFormKeys.detailWithEntries(result.formId),
      });
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.lists() });
      toast.success('Form submitted for approval');
    },
    onError: error => handleError(error, 'submitting form'),
  });

  // Approve form
  const approveFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      const response = await digitalFormApi.approveDigitalForm(formId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to approve form');
      }
      return { formId };
    },
    onSuccess: result => {
      // Invalidate specific form and list queries
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.detail(result.formId) });
      queryClient.invalidateQueries({
        queryKey: digitalFormKeys.detailWithEntries(result.formId),
      });
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.lists() });
      toast.success('Form approved successfully');
    },
    onError: error => handleError(error, 'approving form'),
  });

  // Reject form
  const rejectFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      const response = await digitalFormApi.rejectDigitalForm(formId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to reject form');
      }
      return { formId };
    },
    onSuccess: result => {
      // Invalidate specific form and list queries
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.detail(result.formId) });
      queryClient.invalidateQueries({
        queryKey: digitalFormKeys.detailWithEntries(result.formId),
      });
      queryClient.invalidateQueries({ queryKey: digitalFormKeys.lists() });
      toast.success('Form rejected');
    },
    onError: error => handleError(error, 'rejecting form'),
  });

  // Export forms to Excel
  const exportFormsMutation = useMutation({
    mutationFn: async (formIds: string[]) => {
      const response = await digitalFormApi.exportFormsToExcel(formIds);
      if (!response.success) {
        throw new Error(response.message || 'Failed to export forms');
      }
      return response.data || { url: '' };
    },
    onSuccess: () => {
      toast.success('Forms exported successfully');
      // We could auto-download the file here if needed
      // window.open(data.url, '_blank');
    },
    onError: error => handleError(error, 'exporting forms'),
  });

  // Export production report
  const exportReportMutation = useMutation({
    mutationFn: async ({
      reportType,
      parameters,
      format,
    }: {
      reportType: 'team' | 'group' | 'comparison' | 'factory' | 'line';
      parameters: any;
      format: 'pdf' | 'excel' | 'csv';
    }) => {
      const response = await digitalFormApi.exportProductionReport(reportType, parameters, format);
      if (!response.success) {
        throw new Error(response.message || 'Failed to export report');
      }
      return response.data || { url: '' };
    },
    onSuccess: () => {
      toast.success('Report exported successfully');
      // We could auto-download the file here if needed
      // window.open(data.url, '_blank');
    },
    onError: error => handleError(error, 'exporting report'),
  });

  return {
    // Form CRUD operations
    createFormMutation,
    createWorkerFormMutation,
    generateDailyFormsMutation,
    updateFormMutation,
    deleteFormMutation,

    // Entry operations
    addFormEntryMutation,
    addBulkEntriesMutation,
    updateFormEntryMutation,
    updateHourlyDataMutation,
    updateAttendanceMutation,
    updateShiftTypeMutation,
    deleteFormEntryMutation,

    // Form workflow operations
    submitFormMutation,
    approveFormMutation,
    rejectFormMutation,

    // Export operations
    exportFormsMutation,
    exportReportMutation,

    // Utility to invalidate all form-related queries
    invalidateFormQueries: () => queryClient.invalidateQueries({ queryKey: digitalFormKeys.all }),
  };
};

export default useDigitalFormMutations;
