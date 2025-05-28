'use client';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useDigitalFormMutations } from './useDigitalFormMutations';
import { useDigitalFormQueries } from './useDigitalFormQueries';
import { useWorkShifts } from './useWorkShifts';

import { getCurrentTimeSlot } from '@/common/constants/time-slots';
import {
  AttendanceStatus,
  DigitalForm,
  DigitalFormEntry,
  ProductionIssue,
  RecordStatus,
  ShiftType,
} from '@/common/types/digital-form';
import {
  DigitalFormCreateRequest,
  DigitalFormEntryRequest,
  DigitalFormSubmitRequest,
  DigitalFormUpdateRequest,
  FormEntryUpdateRequest,
} from '@/common/types/digital-form-dto';

// Define context shape
interface DigitalFormContextProps {
  // Data
  form: DigitalForm | null;
  entries: DigitalFormEntry[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Form status and capabilities
  isEditable: boolean;
  isApprovable: boolean;
  isRejectable: boolean;

  // Time tracking
  currentTimeSlot: string | null;
  timeSlots: any[];

  // Form CRUD operations
  loadForm: (formId: string) => Promise<void>;
  createForm: (data: DigitalFormCreateRequest) => Promise<string | null>;
  updateForm: (formId: string, data: DigitalFormUpdateRequest) => Promise<boolean>;
  deleteForm: (formId: string) => Promise<boolean>;

  // Entry operations
  addEntry: (formId: string, data: DigitalFormEntryRequest) => Promise<string | null>;
  updateEntry: (formId: string, entryId: string, data: FormEntryUpdateRequest) => Promise<boolean>;
  updateHourlyData: (
    formId: string,
    entryId: string,
    timeSlot: string,
    quantity: number,
  ) => Promise<boolean>;
  updateAttendance: (
    formId: string,
    entryId: string,
    status: AttendanceStatus,
    note?: string,
  ) => Promise<boolean>;
  updateShiftType: (formId: string, entryId: string, shiftType: ShiftType) => Promise<boolean>;
  deleteEntry: (formId: string, entryId: string) => Promise<boolean>;

  // Issue management
  addIssue: (formId: string, entryId: string, issue: ProductionIssue) => Promise<boolean>;
  removeIssue: (formId: string, entryId: string, issueIndex: number) => Promise<boolean>;

  // Form workflow operations
  submitForm: (formId: string, data?: DigitalFormSubmitRequest) => Promise<boolean>;
  approveForm: (formId: string) => Promise<boolean>;
  rejectForm: (formId: string) => Promise<boolean>;

  // Utilities
  refreshData: () => Promise<void>;
  clearError: () => void;
}

// Create the context with default values
const DigitalFormContext = createContext<DigitalFormContextProps>({
  form: null,
  entries: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  isEditable: false,
  isApprovable: false,
  isRejectable: false,

  currentTimeSlot: null,
  timeSlots: [],

  loadForm: async () => {},
  createForm: async () => null,
  updateForm: async () => false,
  deleteForm: async () => false,

  addEntry: async () => null,
  updateEntry: async () => false,
  updateHourlyData: async () => false,
  updateAttendance: async () => false,
  updateShiftType: async () => false,
  deleteEntry: async () => false,

  addIssue: async () => false,
  removeIssue: async () => false,

  submitForm: async () => false,
  approveForm: async () => false,
  rejectForm: async () => false,

  refreshData: async () => {},
  clearError: () => {},
});

// Props for the provider component
interface DigitalFormProviderProps {
  children: ReactNode;
  initialFormId?: string;
}

// Provider component
export const DigitalFormProvider = ({ children, initialFormId }: DigitalFormProviderProps) => {
  // State
  const [formId, setFormId] = useState<string | null>(initialFormId || null);
  const [form, setForm] = useState<DigitalForm | null>(null);
  const [entries, setEntries] = useState<DigitalFormEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!initialFormId);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Current time tracking
  const [currentTimeSlot, setCurrentTimeSlot] = useState<string | null>(null);

  // Hooks
  const { getFormWithEntries } = useDigitalFormQueries();
  const mutations = useDigitalFormMutations((err, operation) =>
    setError(`Error during ${operation}: ${err.message || 'Unknown error'}`),
  );

  const { timeSlots } = useWorkShifts(form?.shiftType);

  // Form status
  const isEditable = useMemo(() => {
    return form?.status === RecordStatus.DRAFT || form?.status === RecordStatus.REJECTED;
  }, [form]);

  const isApprovable = useMemo(() => {
    return form?.status === RecordStatus.PENDING;
  }, [form]);

  const isRejectable = useMemo(() => {
    return form?.status === RecordStatus.PENDING;
  }, [form]);

  // Update current time slot every minute
  useEffect(() => {
    const updateCurrentTimeSlot = () => {
      const currentSlot = getCurrentTimeSlot();
      setCurrentTimeSlot(currentSlot?.label || null);
    };

    updateCurrentTimeSlot(); // Initial update

    const intervalId = setInterval(updateCurrentTimeSlot, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  // Load form data
  const loadForm = useCallback(
    async (id: string) => {
      if (!id) return;

      setFormId(id);
      setIsLoading(true);
      setError(null);

      try {
        const { data: formWithEntries } = await getFormWithEntries(id).refetch();

        if (formWithEntries) {
          setForm(formWithEntries.form);
          setEntries(formWithEntries.entries || []);
        } else {
          setError('Form not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form');
      } finally {
        setIsLoading(false);
      }
    },
    [getFormWithEntries],
  );

  // Load the initial form if provided
  useEffect(() => {
    if (initialFormId) {
      loadForm(initialFormId);
    }
  }, [initialFormId, loadForm]);

  // Function to refresh data
  const refreshData = useCallback(async () => {
    if (formId) {
      await loadForm(formId);
    }
  }, [formId, loadForm]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Create a new form
  const createForm = useCallback(
    async (data: DigitalFormCreateRequest): Promise<string | null> => {
      try {
        setIsSubmitting(true);
        setError(null);

        const result = await mutations.createFormMutation.mutateAsync(data);
        return result?.id || null;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create form');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mutations.createFormMutation],
  );

  // Update form
  const updateForm = useCallback(
    async (id: string, data: DigitalFormUpdateRequest): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        setError(null);

        await mutations.updateFormMutation.mutateAsync({ id, data });
        if (id === formId) {
          await refreshData();
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update form');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formId, mutations.updateFormMutation, refreshData],
  );

  // Delete form
  const deleteForm = useCallback(
    async (id: string): Promise<boolean> => {
      if (
        !window.confirm('Are you sure you want to delete this form? This action cannot be undone.')
      ) {
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        await mutations.deleteFormMutation.mutateAsync(id);
        if (id === formId) {
          setForm(null);
          setEntries([]);
          setFormId(null);
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete form');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formId, mutations.deleteFormMutation],
  );

  // Add entry to form
  const addEntry = useCallback(
    async (fId: string, data: DigitalFormEntryRequest): Promise<string | null> => {
      try {
        setIsSubmitting(true);
        setError(null);

        const result = await mutations.addFormEntryMutation.mutateAsync({
          formId: fId,
          data,
        });

        if (fId === formId) {
          await refreshData();
        }

        return result?.entryId || null;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add entry');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formId, mutations.addFormEntryMutation, refreshData],
  );

  // Update entry
  const updateEntry = useCallback(
    async (fId: string, entryId: string, data: FormEntryUpdateRequest): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        setError(null);

        await mutations.updateFormEntryMutation.mutateAsync({
          formId: fId,
          entryId,
          data,
        });

        if (fId === formId) {
          await refreshData();
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update entry');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formId, mutations.updateFormEntryMutation, refreshData],
  );

  // Update hourly data
  const updateHourlyData = useCallback(
    async (fId: string, entryId: string, timeSlot: string, quantity: number): Promise<boolean> => {
      try {
        if (fId !== formId) return false;

        const entry = entries.find(e => e.id === entryId);
        if (!entry) return false;

        // Update locally first for optimistic UI update
        const newEntries = entries.map(e => {
          if (e.id === entryId) {
            const hourlyData = { ...(e.hourlyData || {}) };
            hourlyData[timeSlot] = quantity;
            return { ...e, hourlyData };
          }
          return e;
        });

        setEntries(newEntries);

        // Send to API
        await mutations.updateHourlyDataMutation.mutateAsync({
          formId: fId,
          entryId,
          handBagId: entry.handBagId,
          bagColorId: entry.bagColorId,
          processId: entry.processId,
          hourlyData: {
            ...entry.hourlyData,
            [timeSlot]: quantity,
          },
        });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update hourly data');
        await refreshData(); // Refresh to get correct data
        return false;
      }
    },
    [entries, formId, mutations.updateHourlyDataMutation, refreshData],
  );

  // Update attendance
  const updateAttendance = useCallback(
    async (
      fId: string,
      entryId: string,
      status: AttendanceStatus,
      note?: string,
    ): Promise<boolean> => {
      try {
        if (fId !== formId) return false;

        const entry = entries.find(e => e.id === entryId);
        if (!entry) return false;

        // Update locally first for optimistic UI update
        const newEntries = entries.map(e => {
          if (e.id === entryId) {
            return {
              ...e,
              attendanceStatus: status,
              attendanceNote: note || e.attendanceNote,
            };
          }
          return e;
        });

        setEntries(newEntries);

        // Send to API
        await mutations.updateAttendanceMutation.mutateAsync({
          formId: fId,
          entryId,
          handBagId: entry.handBagId,
          bagColorId: entry.bagColorId,
          processId: entry.processId,
          attendanceStatus: status,
          attendanceNote: note,
        });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update attendance');
        await refreshData(); // Refresh to get correct data
        return false;
      }
    },
    [entries, formId, mutations.updateAttendanceMutation, refreshData],
  );

  // Update shift type
  const updateShiftType = useCallback(
    async (fId: string, entryId: string, shiftType: ShiftType): Promise<boolean> => {
      try {
        if (fId !== formId) return false;

        // Send to API
        await mutations.updateShiftTypeMutation.mutateAsync({
          formId: fId,
          entryId,
          shiftType,
        });

        await refreshData(); // Need to refresh as shift type affects time slots
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update shift type');
        return false;
      }
    },
    [formId, mutations.updateShiftTypeMutation, refreshData],
  );

  // Delete entry
  const deleteEntry = useCallback(
    async (fId: string, entryId: string): Promise<boolean> => {
      if (
        !window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')
      ) {
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        await mutations.deleteFormEntryMutation.mutateAsync({
          formId: fId,
          entryId,
        });

        if (fId === formId) {
          // Update locally for faster UI feedback
          setEntries(entries.filter(e => e.id !== entryId));
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete entry');
        if (fId === formId) {
          await refreshData(); // Refresh to ensure data consistency
        }
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formId, entries, mutations.deleteFormEntryMutation, refreshData],
  );

  // Add issue to entry
  const addIssue = useCallback(
    async (fId: string, entryId: string, issue: ProductionIssue): Promise<boolean> => {
      try {
        if (fId !== formId) return false;

        const entry = entries.find(e => e.id === entryId);
        if (!entry) return false;

        // Update locally first for optimistic UI update
        const newEntries = entries.map(e => {
          if (e.id === entryId) {
            const issues = [...(e.issues || []), issue];
            return { ...e, issues };
          }
          return e;
        });

        setEntries(newEntries);

        // Send to API via entry update
        await mutations.updateFormEntryMutation.mutateAsync({
          formId: fId,
          entryId,
          data: {
            issues: [...(entry.issues || []), issue],
          },
        });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add issue');
        await refreshData(); // Refresh to get correct data
        return false;
      }
    },
    [entries, formId, mutations.updateFormEntryMutation, refreshData],
  );

  // Remove issue from entry
  const removeIssue = useCallback(
    async (fId: string, entryId: string, issueIndex: number): Promise<boolean> => {
      try {
        if (fId !== formId) return false;

        const entry = entries.find(e => e.id === entryId);
        if (!entry || !entry.issues || issueIndex >= entry.issues.length) return false;

        // Update locally first for optimistic UI update
        const newEntries = entries.map(e => {
          if (e.id === entryId && e.issues) {
            const issues = [...e.issues];
            issues.splice(issueIndex, 1);
            return { ...e, issues };
          }
          return e;
        });

        setEntries(newEntries);

        // Send to API via entry update
        const updatedIssues = [...(entry.issues || [])];
        updatedIssues.splice(issueIndex, 1);

        await mutations.updateFormEntryMutation.mutateAsync({
          formId: fId,
          entryId,
          data: {
            issues: updatedIssues,
          },
        });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove issue');
        await refreshData(); // Refresh to get correct data
        return false;
      }
    },
    [entries, formId, mutations.updateFormEntryMutation, refreshData],
  );

  // Submit form
  const submitForm = useCallback(
    async (fId: string, data?: DigitalFormSubmitRequest): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        setError(null);

        await mutations.submitFormMutation.mutateAsync({ formId: fId, data });

        if (fId === formId) {
          // Update form status locally for immediate feedback
          setForm(prev =>
            prev
              ? {
                  ...prev,
                  status: RecordStatus.PENDING,
                }
              : null,
          );
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit form');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formId, mutations.submitFormMutation],
  );

  // Approve form
  const approveForm = useCallback(
    async (fId: string): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        setError(null);

        await mutations.approveFormMutation.mutateAsync(fId);

        if (fId === formId) {
          // Update form status locally for immediate feedback
          setForm(prev =>
            prev
              ? {
                  ...prev,
                  status: RecordStatus.CONFIRMED,
                }
              : null,
          );
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to approve form');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formId, mutations.approveFormMutation],
  );

  // Reject form
  const rejectForm = useCallback(
    async (fId: string): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        setError(null);

        await mutations.rejectFormMutation.mutateAsync(fId);

        if (fId === formId) {
          // Update form status locally for immediate feedback
          setForm(prev =>
            prev
              ? {
                  ...prev,
                  status: RecordStatus.REJECTED,
                }
              : null,
          );
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reject form');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formId, mutations.rejectFormMutation],
  );

  // Combine context value
  const contextValue = {
    form,
    entries,
    isLoading,
    isSubmitting,
    error,

    isEditable,
    isApprovable,
    isRejectable,

    currentTimeSlot,
    timeSlots,

    loadForm,
    createForm,
    updateForm,
    deleteForm,

    addEntry,
    updateEntry,
    updateHourlyData,
    updateAttendance,
    updateShiftType,
    deleteEntry,

    addIssue,
    removeIssue,

    submitForm,
    approveForm,
    rejectForm,

    refreshData,
    clearError,
  };

  return <DigitalFormContext.Provider value={contextValue}>{children}</DigitalFormContext.Provider>;
};

// Custom hook to use the context
export const useDigitalFormContext = () => {
  const context = useContext(DigitalFormContext);

  if (!context) {
    throw new Error('useDigitalFormContext must be used within a DigitalFormProvider');
  }

  return context;
};

// Create a specialized custom hook based on our new modular approach
export const useCustomDigitalForm = () => {
  // You can implement custom digital form logic here by combining
  // the context with other hooks like useDigitalFormQueries,
  // useDigitalFormMutations, useDigitalFormStats, etc.

  const context = useDigitalFormContext();

  // Add any additional custom logic here

  return context;
};

// Export the context and provider
export default DigitalFormContext;
