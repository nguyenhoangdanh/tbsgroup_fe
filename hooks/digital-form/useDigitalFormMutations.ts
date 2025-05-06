// hooks/useDigitalFormMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DigitalFormService } from '@/services/digitalFormService';
import {
  TDigitalFormCreate,
  TDigitalFormUpdate,
  TDigitalFormSubmit,
  TDigitalFormEntry,
  TUpdateFormEntry,
  TShiftTypeFormEntry,
} from '@/schemas/digital-form.schema';
import { toast } from '@/hooks/use-toast';
import { DigitalForm, DigitalFormEntry } from '@/common/types/digital-form';

/**
 * Hook for digital form related mutations with optimistic updates
 */
export const useDigitalFormMutations = () => {
  const queryClient = useQueryClient();

  /**
   * Create a new digital form
   */
  const createFormMutation = useMutation({
    mutationFn: (data: TDigitalFormCreate) =>
      DigitalFormService.createForm(data),
    
    onMutate: async (newFormData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['digital-forms-list'] });

      // Find and store the current query data for list
      const queries = queryClient.getQueriesData({ queryKey: ['digital-forms-list'] });
      const previousListData = Array.from(queries).map(([queryKey, queryData]) => ({
        queryKey,
        queryData,
      }));

      // Create a temporary ID for the optimistic update
      const tempId = `temp-${Date.now()}`;

      // Create optimistic form entry
      const optimisticForm = {
        id: tempId,
        ...newFormData,
        formCode: `TEMP-${Date.now()}`,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: 'current-user', // This would ideally come from auth context
        updatedById: 'current-user',
        submitTime: null,
        approvalRequestId: null,
        approvedAt: null,
        isExported: false,
        syncStatus: null,
      } as unknown as DigitalForm;

      // Update each list query with optimistic data
      for (const { queryKey } of previousListData) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          return {
            ...oldData,
            data: [optimisticForm, ...oldData.data],
            total: oldData.total + 1,
          };
        });
      }

      return { previousListData, tempId };
    },
    
    onSuccess: async (result) => {
      // Show success toast
      toast({
        title: 'Biểu mẫu đã được tạo thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-forms-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-forms-infinite'],
        refetchType: 'none',
      });

      if (result.data?.id) {
        queryClient.invalidateQueries({
          queryKey: ['digital-form', result.data.id],
          refetchType: 'none',
        });
      }
    },
    
    onError: (error, _, context) => {
      toast({
        title: 'Không thể tạo biểu mẫu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Rollback to the previous state
      if (context?.previousListData) {
        for (const { queryKey, queryData } of context.previousListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Update an existing digital form
   */
  const updateFormMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TDigitalFormUpdate }) =>
      DigitalFormService.updateForm(id, data),
    
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-forms-list'] });
      await queryClient.cancelQueries({ queryKey: ['digital-form', id] });
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', id] });

      // Get current data
      const previousItem = queryClient.getQueryData(['digital-form', id]);
      const previousItemWithEntries = queryClient.getQueryData(['digital-form-with-entries', id]);

      // Find and store the current query data for list
      const queries = queryClient.getQueriesData({ queryKey: ['digital-forms-list'] });
      const previousListData = Array.from(queries).map(([queryKey, queryData]) => ({
        queryKey,
        queryData,
      }));

      // Update each list query optimistically
      for (const { queryKey } of previousListData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          
          return {
            ...old,
            data: old.data.map((form: DigitalForm) =>
              form.id === id ? { ...form, ...data, updatedAt: new Date().toISOString() } : form
            ),
          };
        });
      }

      // Update individual item cache if it exists
      if (previousItem) {
        queryClient.setQueryData(['digital-form', id], (old: any) => ({
          ...old,
          ...data,
          updatedAt: new Date().toISOString(),
        }));
      }

      // Update form with entries cache if it exists
      if (previousItemWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', id], (old: any) => {
          if (!old || !old.form) return old;
          
          return {
            ...old,
            form: {
              ...old.form,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          };
        });
      }

      return { previousItem, previousItemWithEntries, previousListData };
    },
    
    onSuccess: async (_, variables) => {
      // Show success toast
      toast({
        title: 'Biểu mẫu đã được cập nhật thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-forms-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-forms-infinite'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-form', variables.id],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', variables.id],
        refetchType: 'none',
      });
    },
    
    onError: (error, variables, context) => {
      toast({
        title: 'Không thể cập nhật biểu mẫu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Restore individual form data
      if (context?.previousItem) {
        queryClient.setQueryData(['digital-form', variables.id], context.previousItem);
      }
      
      // Restore form with entries data
      if (context?.previousItemWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', variables.id], context.previousItemWithEntries);
      }

      // Restore all list queries
      if (context?.previousListData) {
        for (const { queryKey, queryData } of context.previousListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Delete a digital form
   */
  const deleteFormMutation = useMutation({
    mutationFn: (id: string) => DigitalFormService.deleteForm(id),
    
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-forms-list'] });
      await queryClient.cancelQueries({ queryKey: ['digital-form', id] });
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', id] });

      // Find and store the current query data for list
      const queries = queryClient.getQueriesData({ queryKey: ['digital-forms-list'] });
      const previousListData = Array.from(queries).map(([queryKey, queryData]) => ({
        queryKey,
        queryData,
      }));

      // Get the current item data
      const previousItem = queryClient.getQueryData(['digital-form', id]);
      const previousItemWithEntries = queryClient.getQueryData(['digital-form-with-entries', id]);

      // Update each list query optimistically
      for (const { queryKey } of previousListData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          
          return {
            ...old,
            data: old.data.filter((form: DigitalForm) => form.id !== id),
            total: Math.max(0, old.total - 1),
          };
        });
      }

      return { previousListData, previousItem, previousItemWithEntries };
    },
    
    onSuccess: async (_, id) => {
      // Show success toast
      toast({
        title: 'Biểu mẫu đã được xóa thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-forms-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-forms-infinite'],
        refetchType: 'none',
      });

      // Remove the item from cache
      queryClient.removeQueries({ queryKey: ['digital-form', id] });
      queryClient.removeQueries({ queryKey: ['digital-form-with-entries', id] });
      queryClient.removeQueries({ queryKey: ['digital-form-print', id] });
    },
    
    onError: (error, id, context) => {
      toast({
        title: 'Không thể xóa biểu mẫu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Restore all list queries
      if (context?.previousListData) {
        for (const { queryKey, queryData } of context.previousListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }

      // Restore the item if it existed
      if (context?.previousItem) {
        queryClient.setQueryData(['digital-form', id], context.previousItem);
      }
      
      // Restore form with entries if it existed
      if (context?.previousItemWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', id], context.previousItemWithEntries);
      }
    },
  });

  /**
   * Add entry to form mutation
   */
  const addFormEntryMutation = useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: TDigitalFormEntry }) =>
      DigitalFormService.addFormEntry(formId, data),

    onMutate: async ({ formId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', formId] });

      // Get current data
      const previousFormWithEntries = queryClient.getQueryData(['digital-form-with-entries', formId]);

      // Create a temporary ID for the optimistic update
      const tempId = `temp-entry-${Date.now()}`;

      // Create optimistic entry
      const optimisticEntry: DigitalFormEntry = {
        id: tempId,
        formId,
        ...data,
        hourlyData: data.hourlyData || {},
        totalOutput: data.totalOutput || 0,
        checkInTime: data.checkInTime ? new Date(data.checkInTime).toISOString() : null,
        checkOutTime: data.checkOutTime ? new Date(data.checkOutTime).toISOString() : null,
        attendanceNote: data.attendanceNote || null,
        qualityScore: data.qualityScore || 100,
        qualityNotes: data.qualityNotes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as DigitalFormEntry;

      // Update form with entries cache if it exists
      if (previousFormWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', formId], (old: any) => {
          if (!old || !old.entries) return old;
          
          return {
            ...old,
            entries: [...old.entries, optimisticEntry],
          };
        });
      }

      return { previousFormWithEntries, tempId, optimisticEntry };
    },

    onSuccess: (result, variables) => {
      // Show success toast
      toast({
        title: 'Đã thêm dữ liệu thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', variables.formId],
        refetchType: 'none',
      });
    },

    onError: (error, variables, context) => {
      toast({
        title: 'Không thể thêm dữ liệu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Restore form with entries data
      if (context?.previousFormWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', variables.formId], context.previousFormWithEntries);
      }
    },
  });

  /**
   * Update a form entry mutation - Added to fix missing mutation
   */
  const updateFormEntryMutation = useMutation({
    mutationFn: ({ formId, entryId, data }: { formId: string; entryId: string; data: Partial<TUpdateFormEntry> }) =>
      DigitalFormService.updateFormEntry(formId, entryId, data),

    onMutate: async ({ formId, entryId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', formId] });

      // Get current data
      const previousFormWithEntries = queryClient.getQueryData(['digital-form-with-entries', formId]);

      // Update form with entries cache if it exists
      if (previousFormWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', formId], (old: any) => {
          if (!old || !old.entries) return old;
          
          return {
            ...old,
            entries: old.entries.map((entry: DigitalFormEntry) =>
              entry.id === entryId
                ? {
                  ...entry,
                  ...data,
                  updatedAt: new Date().toISOString(),
                  // Recalculate totalOutput if hourlyData is provided
                  totalOutput: data.hourlyData
                    ? Object.values({ ...entry.hourlyData, ...data.hourlyData }).reduce(
                      (sum, output) => sum + (output || 0), 0
                    )
                    : entry.totalOutput
                }
                : entry
            ),
          };
        });
      }

      return { previousFormWithEntries };
    },

    onSuccess: (_, variables) => {
      // Show success toast
      toast({
        title: 'Đã cập nhật dữ liệu thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', variables.formId],
        refetchType: 'none',
      });
    },

    onError: (error, variables, context) => {
      toast({
        title: 'Không thể cập nhật dữ liệu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Restore form with entries data
      if (context?.previousFormWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', variables.formId], context.previousFormWithEntries);
      }
    },
  });

  /**
   * Update hourly data for a form entry - Special use case mutation
   */
  const updateHourlyDataMutation = useMutation({
    mutationFn: ({ formId, entryId, timeSlot, quantity }: {
      formId: string;
      entryId: string;
      timeSlot: string;
      quantity: number;
    }) => DigitalFormService.updateHourlyData(formId, entryId, { [timeSlot]: quantity }),

    onMutate: async ({ formId, entryId, timeSlot, quantity }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', formId] });

      // Get current data
      const previousFormWithEntries = queryClient.getQueryData(['digital-form-with-entries', formId]);

      // Update form with entries cache if it exists
      if (previousFormWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', formId], (old: any) => {
          if (!old || !old.entries) return old;
          
          return {
            ...old,
            entries: old.entries.map((entry: DigitalFormEntry) => {
              if (entry.id !== entryId) return entry;
              
              // Update hourly data and recalculate total
              const updatedHourlyData = { ...(entry.hourlyData || {}) };
              updatedHourlyData[timeSlot] = quantity;
              
              const updatedTotalOutput = Object.values(updatedHourlyData)
                .reduce((sum, val) => sum + (val || 0), 0);
              
              return {
                ...entry,
                hourlyData: updatedHourlyData,
                totalOutput: updatedTotalOutput,
                updatedAt: new Date().toISOString()
              };
            }),
          };
        });
      }

      return { previousFormWithEntries };
    },

    onSuccess: (_, variables) => {
      // We can keep this toast hidden to prevent too many notifications
      // when rapidly updating hourly data
      /* 
      toast({
        title: 'Đã cập nhật dữ liệu thành công',
        duration: 1000,
      });
      */

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', variables.formId],
        refetchType: 'none',
      });
    },

    onError: (error, variables, context) => {
      toast({
        title: 'Không thể cập nhật dữ liệu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Restore form with entries data
      if (context?.previousFormWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', variables.formId], context.previousFormWithEntries);
      }
    },
  });

  /**
   * Delete entry from form mutation
   */
  const deleteFormEntryMutation = useMutation({
    mutationFn: ({ formId, entryId }: { formId: string; entryId: string }) =>
      DigitalFormService.deleteFormEntry(formId, entryId),

    onMutate: async ({ formId, entryId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', formId] });

      // Get current data
      const previousFormWithEntries = queryClient.getQueryData(['digital-form-with-entries', formId]);

      // Update form with entries cache if it exists
      if (previousFormWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', formId], (old: any) => {
          if (!old || !old.entries) return old;
          
          return {
            ...old,
            entries: old.entries.filter((entry: DigitalFormEntry) => entry.id !== entryId),
          };
        });
      }

      return { previousFormWithEntries };
    },

    onSuccess: (_, variables) => {
      // Show success toast
      toast({
        title: 'Đã xóa dữ liệu thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', variables.formId],
        refetchType: 'none',
      });
    },

    onError: (error, variables, context) => {
      toast({
        title: 'Không thể xóa dữ liệu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Restore form with entries data
      if (context?.previousFormWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', variables.formId], context.previousFormWithEntries);
      }
    },
  });

  /**
   * Submit form mutation
   */
  const submitFormMutation = useMutation({
    mutationFn: ({ formId, data }: { formId: string; data?: TDigitalFormSubmit }) =>
      DigitalFormService.submitForm(formId, data || {}),

    onMutate: async ({ formId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-forms-list'] });
      await queryClient.cancelQueries({ queryKey: ['digital-form', formId] });
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', formId] });

      // Get current data
      const previousItem = queryClient.getQueryData(['digital-form', formId]);
      const previousItemWithEntries = queryClient.getQueryData(['digital-form-with-entries', formId]);

      // Find and store the current query data for list
      const queries = queryClient.getQueriesData({ queryKey: ['digital-forms-list'] });
      const previousListData = Array.from(queries).map(([queryKey, queryData]) => ({
        queryKey,
        queryData,
      }));

      // Update each list query optimistically
      for (const { queryKey } of previousListData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          
          return {
            ...old,
            data: old.data.map((form: DigitalForm) =>
              form.id === formId ? {
                ...form,
                status: 'PENDING',
                submitTime: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } : form
            ),
          };
        });
      }

      // Update individual item cache if it exists
      if (previousItem) {
        queryClient.setQueryData(['digital-form', formId], (old: any) => ({
          ...old,
          status: 'PENDING',
          submitTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }

      // Update form with entries cache if it exists
      if (previousItemWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', formId], (old: any) => {
          if (!old || !old.form) return old;
          
          return {
            ...old,
            form: {
              ...old.form,
              status: 'PENDING',
              submitTime: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          };
        });
      }

      return { previousItem, previousItemWithEntries, previousListData };
    },

    onSuccess: (_, variables) => {
      // Show success toast
      toast({
        title: 'Biểu mẫu đã được gửi thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-forms-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-forms-infinite'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-form', variables.formId],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', variables.formId],
        refetchType: 'none',
      });
    },

    onError: (error, variables, context) => {
      toast({
        title: 'Không thể gửi biểu mẫu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Restore individual form data
      if (context?.previousItem) {
        queryClient.setQueryData(['digital-form', variables.formId], context.previousItem);
      }
      
      // Restore form with entries data
      if (context?.previousItemWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', variables.formId], context.previousItemWithEntries);
      }

      // Restore all list queries
      if (context?.previousListData) {
        for (const { queryKey, queryData } of context.previousListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Approve form mutation
   */
  const approveFormMutation = useMutation({
    mutationFn: (formId: string) => DigitalFormService.approveForm(formId),

    onMutate: async (formId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-forms-list'] });
      await queryClient.cancelQueries({ queryKey: ['digital-form', formId] });
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', formId] });

      // Get current data
      const previousItem = queryClient.getQueryData(['digital-form', formId]);
      const previousItemWithEntries = queryClient.getQueryData(['digital-form-with-entries', formId]);

      // Find and store the current query data for list
      const queries = queryClient.getQueriesData({ queryKey: ['digital-forms-list'] });
      const previousListData = Array.from(queries).map(([queryKey, queryData]) => ({
        queryKey,
        queryData,
      }));

      // Update each list query optimistically
      for (const { queryKey } of previousListData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          
          return {
            ...old,
            data: old.data.map((form: DigitalForm) =>
              form.id === formId ? {
                ...form,
                status: 'CONFIRMED',
                approvedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } : form
            ),
          };
        });
      }

      // Update individual item cache if it exists
      if (previousItem) {
        queryClient.setQueryData(['digital-form', formId], (old: any) => ({
          ...old,
          status: 'CONFIRMED',
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }

      // Update form with entries cache if it exists
      if (previousItemWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', formId], (old: any) => {
          if (!old || !old.form) return old;
          
          return {
            ...old,
            form: {
              ...old.form,
              status: 'CONFIRMED',
              approvedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          };
        });
      }

      return { previousItem, previousItemWithEntries, previousListData };
    },

    onSuccess: (_, formId) => {
      // Show success toast
      toast({
        title: 'Biểu mẫu đã được phê duyệt thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-forms-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-forms-infinite'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-form', formId],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', formId],
        refetchType: 'none',
      });
    },

    onError: (error, formId, context) => {
      toast({
        title: 'Không thể phê duyệt biểu mẫu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Restore individual form data
      if (context?.previousItem) {
        queryClient.setQueryData(['digital-form', formId], context.previousItem);
      }
      
      // Restore form with entries data
      if (context?.previousItemWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', formId], context.previousItemWithEntries);
      }

      // Restore all list queries
      if (context?.previousListData) {
        for (const { queryKey, queryData } of context.previousListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Reject form mutation
   */
  const rejectFormMutation = useMutation({
    mutationFn: (formId: string) => DigitalFormService.rejectForm(formId),

    onMutate: async (formId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-forms-list'] });
      await queryClient.cancelQueries({ queryKey: ['digital-form', formId] });
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', formId] });

      // Get current data
      const previousItem = queryClient.getQueryData(['digital-form', formId]);
      const previousItemWithEntries = queryClient.getQueryData(['digital-form-with-entries', formId]);

      // Find and store the current query data for list
      const queries = queryClient.getQueriesData({ queryKey: ['digital-forms-list'] });
      const previousListData = Array.from(queries).map(([queryKey, queryData]) => ({
        queryKey,
        queryData,
      }));

      // Update each list query optimistically
      for (const { queryKey } of previousListData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          
          return {
            ...old,
            data: old.data.map((form: DigitalForm) =>
              form.id === formId ? {
                ...form,
                status: 'REJECTED',
                updatedAt: new Date().toISOString()
              } : form
            ),
          };
        });
      }

      // Update individual item cache if it exists
      if (previousItem) {
        queryClient.setQueryData(['digital-form', formId], (old: any) => ({
          ...old,
          status: 'REJECTED',
          updatedAt: new Date().toISOString(),
        }));
      }

      // Update form with entries cache if it exists
      if (previousItemWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', formId], (old: any) => {
          if (!old || !old.form) return old;
          
          return {
            ...old,
            form: {
              ...old.form,
              status: 'REJECTED',
              updatedAt: new Date().toISOString(),
            }
          };
        });
      }

      return { previousItem, previousItemWithEntries, previousListData };
    },

    onSuccess: (_, formId) => {
      // Show success toast
      toast({
        title: 'Biểu mẫu đã bị từ chối',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-forms-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-forms-infinite'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-form', formId],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', formId],
        refetchType: 'none',
      });
    },

    onError: (error, formId, context) => {
      toast({
        title: 'Không thể từ chối biểu mẫu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Restore individual form data
      if (context?.previousItem) {
        queryClient.setQueryData(['digital-form', formId], context.previousItem);
      }
      
      // Restore form with entries data
      if (context?.previousItemWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', formId], context.previousItemWithEntries);
      }

      // Restore all list queries
      if (context?.previousListData) {
        for (const { queryKey, queryData } of context.previousListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Export report mutation
   */
  const exportReportMutation = useMutation({
    mutationFn: ({
      reportType,
      parameters,
      format
    }: {
      reportType: 'team' | 'group' | 'comparison';
      parameters: any;
      format: 'pdf' | 'excel' | 'csv';
    }) => DigitalFormService.exportReport(reportType, parameters, format),

    onMutate: () => {
      // Show a loading toast
      toast({
        title: 'Đang xuất báo cáo...',
        description: 'Quá trình này có thể mất vài giây.',
        duration: 5000,
      });
    },

    onSuccess: (result) => {
      // Show success toast
      toast({
        title: 'Báo cáo đã được xuất thành công',
        description: 'File sẽ được tải xuống sau ít giây.',
        duration: 2000,
      });

      // Trigger download if fileUrl is available
      if (result?.data?.fileUrl) {
        // This would be replaced with your app's download handler
        window.open(result.data.fileUrl, '_blank');
      }
    },

    onError: (error) => {
      toast({
        title: 'Không thể xuất báo cáo',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 3000,
      });
    },
  });

   /**
   * Export single form data mutation
   */
   const exportFormMutation = useMutation({
    mutationFn: ({ formId, format }: { formId: string; format: 'excel' | 'pdf' }) =>
      DigitalFormService.exportForm(formId, format),

    onMutate: () => {
      // Show a loading toast
      toast({
        title: 'Đang xuất biểu mẫu...',
        description: 'Quá trình này có thể mất vài giây.',
        duration: 5000,
      });
    },

    onSuccess: (result) => {
      // Show success toast
      toast({
        title: 'Biểu mẫu đã được xuất thành công',
        description: 'File sẽ được tải xuống sau ít giây.',
        duration: 2000,
      });

      // Trigger download if fileUrl is available
      if (result?.data?.fileUrl) {
        window.open(result.data.fileUrl, '_blank');
      }
    },

    onError: (error) => {
      toast({
        title: 'Không thể xuất biểu mẫu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 3000,
      });
    },
  });


  const updateShiftTypeMutation = useMutation({
    mutationFn: ({ formId, entryId, data }: { formId: string; entryId: string; data: TShiftTypeFormEntry }) =>
      DigitalFormService.updateShiftTypeFormEntry(formId, entryId, data),

    onMutate: async ({ formId, entryId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', formId] });

      // Get current data
      const previousFormWithEntries = queryClient.getQueryData(['digital-form-with-entries', formId]);

      // Update form with entries cache if it exists
      if (previousFormWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', formId], (old: any) => {
          if (!old || !old.entries) return old;
          
          return {
            ...old,
            entries: old.entries.map((entry: DigitalFormEntry) => {
              if (entry.id !== entryId) return entry;
              
              // Update the shift type in the optimistic update
              return {
                ...entry,
                shiftType: data.shiftType,
                updatedAt: new Date().toISOString()
              };
            }),
          };
        });
      }

      return { previousFormWithEntries };
    },

    onSuccess: (_, variables) => {
      // Show success toast
      toast({
        title: 'Đã cập nhật dữ liệu thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetching
      queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', variables.formId],
      });
    },

    onError: (error, variables, context) => {
      toast({
        title: 'Không thể cập nhật dữ liệu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 2000,
      });

      // Restore form with entries data
      if (context?.previousFormWithEntries) {
        queryClient.setQueryData(['digital-form-with-entries', variables.formId], context.previousFormWithEntries);
      }
    },
  });


  return {
    createFormMutation,
    updateFormMutation,
    deleteFormMutation,
    addFormEntryMutation,
    updateFormEntryMutation, // Added the missing mutation
    updateHourlyDataMutation, // Added specific mutation for hourly data
    updateShiftTypeMutation,
    deleteFormEntryMutation,
    submitFormMutation,
    approveFormMutation,
    rejectFormMutation,
    exportReportMutation,
    exportFormMutation,
  };
}