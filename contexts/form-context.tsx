'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

import { getIntervalsByShiftType, getCurrentTimeInterval } from '@/common/constants/time-intervals';
import {
  DigitalForm,
  DigitalFormEntry,
  ShiftType,
  AttendanceStatus,
  RecordStatus,
} from '@/common/types/digital-form';
import useDigitalFormMutations from '@/hooks/digital-form/useDigitalFormMutations';
import useDigitalFormQueries from '@/hooks/digital-form/useDigitalFormQueries';
import { useMultiBagTimeSlot } from '@/hooks/digital-form/useMultiBagTimeSlot';

// Context interface
interface FormContextType {
  // Form data
  form: DigitalForm | null;
  entries: DigitalFormEntry[];
  loading: boolean;
  error: string | null;

  // Time intervals
  timeIntervals: any[];
  currentInterval: ReturnType<typeof getCurrentTimeInterval>;
  getTimeIntervalsByShiftType: typeof getIntervalsByShiftType;

  // Form state
  isEditable: boolean;
  isSubmittable: boolean;
  isApprovable: boolean;

  // Multi-bag operations
  multiBag: ReturnType<typeof useMultiBagTimeSlot> | null;

  // Actions
  loadForm: (formId: string) => Promise<void>;
  updateEntry: (entryId: string, updates: Partial<DigitalFormEntry>) => Promise<boolean>;
  updateHourlyData: (entryId: string, timeInterval: string, quantity: number) => Promise<boolean>;
  updateAttendanceStatus: (entryId: string, status: AttendanceStatus) => Promise<boolean>;
  submitForm: () => Promise<boolean>;
  approveForm: () => Promise<boolean>;
  rejectForm: () => Promise<boolean>;
}

// Create the context with default values
const FormContext = createContext<FormContextType>({
  form: null,
  entries: [],
  loading: false,
  error: null,

  timeIntervals: [],
  currentInterval: null,
  getTimeIntervalsByShiftType: getIntervalsByShiftType,

  isEditable: false,
  isSubmittable: false,
  isApprovable: false,

  multiBag: null,

  loadForm: async () => {},
  updateEntry: async () => false,
  updateHourlyData: async () => false,
  updateAttendanceStatus: async () => false,
  submitForm: async () => false,
  approveForm: async () => false,
  rejectForm: async () => false,
});

// Provider props
interface FormProviderProps {
  children: ReactNode;
}

// Create the provider component
export const FormProvider = ({ children }: FormProviderProps) => {
  // State
  const [formId, setFormId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get queries and mutations
  const queries = useDigitalFormQueries(handleError);
  const mutations = useDigitalFormMutations(handleError);

  // Handle errors
  function handleError(err: any, operationName: string) {
    console.error(`Error in ${operationName}:`, err);
    setError(`Operation ${operationName} failed: ${err.message || 'Unknown error'}`);
  }

  // Get form data with entries
  const {
    data: formWithEntries,
    isLoading,
    isError,
  } = queries.useDigitalFormWithEntries(formId || '', {
    enabled: !!formId,
  });

  // Extract form and entries from data
  const form = formWithEntries?.data?.form || null;
  const entries = formWithEntries?.data?.entries || [];

  // Calculate form state flags
  const isEditable = useMemo(() => {
    return form?.status === RecordStatus.DRAFT || form?.status === RecordStatus.REJECTED;
  }, [form]);

  const isSubmittable = useMemo(() => {
    return form?.status === RecordStatus.DRAFT;
  }, [form]);

  const isApprovable = useMemo(() => {
    return form?.status === RecordStatus.PENDING;
  }, [form]);

  // Initialize multi-bag hook when form loaded
  const multiBag = useMultiBagTimeSlot(formId || '', entries, !isEditable);

  // Current time interval
  const currentInterval = useMemo(() => getCurrentTimeInterval(), []);

  // Get time intervals
  const timeIntervals = useMemo(() => {
    const shiftType = form?.shiftType || ShiftType.REGULAR;
    const shiftTypeMapping = {
      [ShiftType.REGULAR]: 'standard',
      [ShiftType.EXTENDED]: 'extended',
      [ShiftType.OVERTIME]: 'overtime',
    };
    return getIntervalsByShiftType(
      shiftTypeMapping[shiftType] as 'standard' | 'extended' | 'overtime',
    );
  }, [form?.shiftType]);

  // Load form function
  const loadForm = useCallback(async (id: string) => {
    try {
      setFormId(id);
      setError(null);
    } catch (err) {
      console.error('Error loading form:', err);
      setError('Failed to load form data');
    }
  }, []);

  // Update entry function
  const updateEntry = useCallback(
    async (entryId: string, updates: Partial<DigitalFormEntry>) => {
      if (!formId || !isEditable) return false;

      try {
        const result = await mutations.updateFormEntryMutation.mutateAsync({
          formId,
          entryId,
          data: updates,
        });

        return result.success;
      } catch (err) {
        console.error('Error updating entry:', err);
        return false;
      }
    },
    [formId, isEditable, mutations.updateFormEntryMutation],
  );

  // Update hourly data function
  const updateHourlyData = useCallback(
    async (entryId: string, timeInterval: string, quantity: number) => {
      if (!formId || !isEditable) return false;

      try {
        const result = await mutations.updateHourlyDataMutation.mutateAsync({
          formId,
          entryId,
          timeSlot: timeInterval,
          quantity,
        });

        return result.success;
      } catch (err) {
        console.error('Error updating hourly data:', err);
        return false;
      }
    },
    [formId, isEditable, mutations.updateHourlyDataMutation],
  );

  // Update attendance status function
  const updateAttendanceStatus = useCallback(
    async (entryId: string, status: AttendanceStatus) => {
      if (!formId || !isEditable) return false;

      try {
        const result = await mutations.updateFormEntryMutation.mutateAsync({
          formId,
          entryId,
          data: { attendanceStatus: status },
        });

        return result.success;
      } catch (err) {
        console.error('Error updating attendance status:', err);
        return false;
      }
    },
    [formId, isEditable, mutations.updateFormEntryMutation],
  );

  // Submit form function
  const submitForm = useCallback(async () => {
    if (!formId || !isSubmittable) return false;

    try {
      const result = await mutations.submitFormMutation.mutateAsync({ formId });

      return result.success;
    } catch (err) {
      console.error('Error submitting form:', err);
      return false;
    }
  }, [formId, isSubmittable, mutations.submitFormMutation]);

  // Approve form function
  const approveForm = useCallback(async () => {
    if (!formId || !isApprovable) return false;

    try {
      const result = await mutations.approveFormMutation.mutateAsync(formId);

      return result.success;
    } catch (err) {
      console.error('Error approving form:', err);
      return false;
    }
  }, [formId, isApprovable, mutations.approveFormMutation]);

  // Reject form function
  const rejectForm = useCallback(async () => {
    if (!formId || !isApprovable) return false;

    try {
      const result = await mutations.rejectFormMutation.mutateAsync(formId);

      return result.success;
    } catch (err) {
      console.error('Error rejecting form:', err);
      return false;
    }
  }, [formId, isApprovable, mutations.rejectFormMutation]);

  // Create context value
  const contextValue = {
    form,
    entries,
    loading: isLoading,
    error: isError ? 'Failed to load form data' : error,

    timeIntervals,
    currentInterval,
    getTimeIntervalsByShiftType: getIntervalsByShiftType,

    isEditable,
    isSubmittable,
    isApprovable,

    multiBag,

    loadForm,
    updateEntry,
    updateHourlyData,
    updateAttendanceStatus,
    submitForm,
    approveForm,
    rejectForm,
  };

  return <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>;
};

// Hook for using the form context
export const useForm = () => {
  const context = useContext(FormContext);

  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }

  return context;
};

// Specialized hook that focuses just on time intervals
export const useTimeIntervals = () => {
  const { timeIntervals, currentInterval, getTimeIntervalsByShiftType } = useContext(FormContext);

  return { timeIntervals, currentInterval, getTimeIntervalsByShiftType };
};

// Specialized hook for multi-bag operations
export const useFormMultiBag = () => {
  const { multiBag } = useContext(FormContext);

  if (!multiBag) {
    throw new Error('useFormMultiBag must be used within a FormProvider with a loaded form');
  }

  return multiBag;
};
