// hooks/digital-form/useDigitalFormMutations.ts
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { DigitalFormService } from '@/services/form/digitalFormService';
import { toast } from '@/hooks/use-toast';
import { 
  TDigitalFormCreate, 
  TDigitalFormUpdate, 
  TDigitalFormSubmit, 
  TDigitalFormEntry 
} from '@/schemas/digital-form.schema';
import { RecordStatus } from '@/common/types/digital-form';
import { useCallback, useRef } from 'react';
import { ApiResponse } from './useDigitalFormQueries';

interface BatchOperation {
  formIds: string[];
}

/**
 * Hook quản lý tất cả mutations liên quan đến Digital Forms
 * Hỗ trợ optimistic updates để cải thiện UX
 */
export const useDigitalFormMutations = () => {
  const queryClient = useQueryClient();
  const pendingMutationsRef = useRef(new Set<string>());

  // Utility to safely show toast notifications
  const showToast = useCallback((options: { 
    title: string, 
    description?: string, 
    variant?: 'default' | 'destructive',
    duration?: number
  }) => {
    try {
      toast({
        title: options.title,
        description: options.description,
        variant: options.variant || 'default',
        duration: options.duration || 3000
      });
    } catch (error) {
      console.warn('Failed to show toast notification:', error);
    }
  }, []);

  // Centralized error logging
  const logError = useCallback((context: string, error: any) => {
    console.error(`DigitalForms Error (${context}):`, error);
  }, []);

  /**
   * Create new form with optimistic UI updates and smarter cache handling
   */
  const createFormMutation: UseMutationResult<ApiResponse<{id: string}>, Error, TDigitalFormCreate> = useMutation({
    mutationFn: async (data: TDigitalFormCreate) => {
      const mutationId = `create-${Date.now()}`;
      try {
        pendingMutationsRef.current.add(mutationId);
        return await DigitalFormService.createForm(data);
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onSuccess: (response) => {
      showToast({
        title: 'Đã tạo phiếu công đoạn mới',
        variant: 'default',
        duration: 3000,
      });
      
      // Only invalidate the list query without forcing a refetch
      queryClient.invalidateQueries({ 
        queryKey: ['digital-forms'],
        refetchType: 'none'
      });
      
      // If we have the new form ID, prefetch its data for better UX
      if (response?.data?.id) {
        // Prefetch both the form and its entries
        queryClient.prefetchQuery({
          queryKey: ['digital-form', response.data.id],
          queryFn: () => DigitalFormService.getForm(response.data.id),
          staleTime: 2 * 60 * 1000
        });
        
        queryClient.prefetchQuery({
          queryKey: ['digital-form-with-entries', response.data.id],
          queryFn: () => DigitalFormService.getFormWithEntries(response.data.id),
          staleTime: 60 * 1000
        });
      }
    },
    onError: (error: any) => {
      showToast({
        title: 'Không thể tạo phiếu công đoạn',
        description: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
        duration: 4000,
      });
      logError('createFormMutation', error);
    },
  });

  /**
   * Update form with optimistic updates and improved error recovery
   */
  const updateFormMutation: UseMutationResult<ApiResponse<void>, Error, { id: string; data: TDigitalFormUpdate }> = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TDigitalFormUpdate }) => {
      const mutationId = `update-${id}-${Date.now()}`;
      try {
        pendingMutationsRef.current.add(mutationId);
        return await DigitalFormService.updateForm(id, data);
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form', id] });
      
      // Save previous form state
      const previousForm = queryClient.getQueryData(['digital-form', id]);
      
      // Optimistically update the form data
      queryClient.setQueryData(['digital-form', id], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            ...data,
            updatedAt: new Date().toISOString()
          }
        };
      });
      
      return { previousForm };
    },
    onSuccess: (_, variables) => {
      showToast({
        title: 'Đã cập nhật phiếu công đoạn',
        variant: 'default',
        duration: 3000,
      });
      
      // Smart invalidation without forcing refetches
      queryClient.invalidateQueries({ 
        queryKey: ['digital-form', variables.id],
        refetchType: 'none'
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['digital-forms'],
        refetchType: 'none'
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['digital-form-with-entries', variables.id],
        refetchType: 'none'
      });
    },
    onError: (error: any, variables, context: any) => {
      // Restore previous form data
      if (context?.previousForm) {
        queryClient.setQueryData(['digital-form', variables.id], context.previousForm);
      }
      
      showToast({
        title: 'Không thể cập nhật phiếu công đoạn',
        description: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
        duration: 4000,
      });
      logError(`updateFormMutation(${variables.id})`, error);
    },
  });

  /**
   * Delete form with optimistic updates and rollback capability
   */
  const deleteFormMutation: UseMutationResult<ApiResponse<void>, Error, string> = useMutation({
    mutationFn: async (id: string) => {
      const mutationId = `delete-${id}-${Date.now()}`;
      try {
        pendingMutationsRef.current.add(mutationId);
        return await DigitalFormService.deleteForm(id);
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form', id] });
      await queryClient.cancelQueries({ queryKey: ['digital-forms'] });
      
      // Save previous form and forms list state
      const previousForm = queryClient.getQueryData(['digital-form', id]);
      const previousFormsList = queryClient.getQueriesData({ queryKey: ['digital-forms'] });
      
      // Optimistically remove form from list
      queryClient.setQueriesData({ queryKey: ['digital-forms'] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((form: any) => form.id !== id),
          total: Math.max(0, (oldData.total || 0) - 1)
        };
      });
      
      // Remove specific form data from cache
      queryClient.removeQueries({ queryKey: ['digital-form', id] });
      queryClient.removeQueries({ queryKey: ['digital-form-with-entries', id] });
      queryClient.removeQueries({ queryKey: ['digital-form-print', id] });
      
      return { previousForm, previousFormsList };
    },
    onSuccess: () => {
      showToast({
        title: 'Đã xóa phiếu công đoạn',
        variant: 'default',
        duration: 3000,
      });
    },
    onError: (error: any, id, context: any) => {
      // Restore previous data
      if (context?.previousForm) {
        queryClient.setQueryData(['digital-form', id], context.previousForm);
      }
      
      if (context?.previousFormsList) {
        for (const [queryKey, queryData] of context.previousFormsList) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
      
      showToast({
        title: 'Không thể xóa phiếu công đoạn',
        description: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
        duration: 4000,
      });
      logError(`deleteFormMutation(${id})`, error);
    },
    onSettled: () => {
      // Always refetch form list to ensure up-to-date data, but with a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['digital-forms'],
          refetchType: 'none'
        });
      }, 300);
    }
  });

  /**
   * Batch delete forms mutation
   */
  const batchDeleteFormsMutation: UseMutationResult<ApiResponse<{count: number}>, Error, string[]> = useMutation({
    mutationFn: async (formIds: string[]) => {
      const mutationId = `batch-delete-${Date.now()}`;
      try {
        pendingMutationsRef.current.add(mutationId);
        return await DigitalFormService.batchDeleteForms({ formIds });
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onMutate: async (formIds) => {
      // Cancel any outgoing refetches for affected forms
      await Promise.all([
        ...formIds.map(id => queryClient.cancelQueries({ queryKey: ['digital-form', id] })),
        queryClient.cancelQueries({ queryKey: ['digital-forms'] })
      ]);
      
      // Save previous states
      const previousStates = new Map();
      formIds.forEach(id => {
        previousStates.set(id, queryClient.getQueryData(['digital-form', id]));
      });
      const previousFormsList = queryClient.getQueriesData({ queryKey: ['digital-forms'] });
      
      // Optimistically remove forms from list
      queryClient.setQueriesData({ queryKey: ['digital-forms'] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((form: any) => !formIds.includes(form.id)),
          total: Math.max(0, (oldData.total || 0) - formIds.length)
        };
      });
      
      // Remove specific form data from cache
      formIds.forEach(id => {
        queryClient.removeQueries({ queryKey: ['digital-form', id] });
        queryClient.removeQueries({ queryKey: ['digital-form-with-entries', id] });
        queryClient.removeQueries({ queryKey: ['digital-form-print', id] });
      });
      
      return { previousStates, previousFormsList };
    },
    onSuccess: (response) => {
      showToast({
        title: 'Đã xóa phiếu công đoạn',
        description: `Đã xóa ${response.data.count} phiếu công đoạn`,
        variant: 'default',
        duration: 3000,
      });
    },
    onError: (error: any, formIds, context: any) => {
      // Restore previous data
      if (context?.previousStates) {
        context.previousStates.forEach((data: any, id: string) => {
          if (data) queryClient.setQueryData(['digital-form', id], data);
        });
      }
      
      if (context?.previousFormsList) {
        for (const [queryKey, queryData] of context.previousFormsList) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
      
      showToast({
        title: 'Không thể xóa phiếu công đoạn',
        description: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
        duration: 4000,
      });
      logError(`batchDeleteFormsMutation`, error);
    },
    onSettled: () => {
      // Always refetch form list to ensure up-to-date data, but with a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['digital-forms'],
          refetchType: 'none'
        });
      }, 300);
    }
  });

  /**
   * Add entry to form with optimistic updates and detailed type checking
   */
  const addFormEntryMutation: UseMutationResult<ApiResponse<{id: string}>, Error, { formId: string; data: TDigitalFormEntry }> = useMutation({
    mutationFn: async ({ formId, data }: { formId: string; data: TDigitalFormEntry }) => {
      const mutationId = `add-entry-${formId}-${Date.now()}`;
      try {
        pendingMutationsRef.current.add(mutationId);
        return await DigitalFormService.addFormEntry(formId, data);
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onMutate: async ({ formId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', formId] });
      
      // Save previous form with entries state
      const previousFormWithEntries = queryClient.getQueryData(['digital-form-with-entries', formId]);
      
      // Create optimistic entry with temporary ID
      const optimisticEntry = {
        ...data,
        id: `temp-${Date.now()}`,
        formId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _isOptimistic: true // Mark as optimistic for identification
      };
      
      // Optimistically update form with entries
      queryClient.setQueryData(['digital-form-with-entries', formId], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        // If this is an update (same userId, processId combination), replace it
        const isUpdate = oldData.data?.entries?.some((entry: any) => 
          entry.userId === data.userId && 
          entry.processId === data.processId && 
          entry.handBagId === data.handBagId && 
          entry.bagColorId === data.bagColorId
        );
        
        if (isUpdate) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              entries: oldData.data.entries.map((entry: any) => 
                (entry.userId === data.userId && 
                 entry.processId === data.processId && 
                 entry.handBagId === data.handBagId && 
                 entry.bagColorId === data.bagColorId)
                  ? optimisticEntry : entry
              )
            }
          };
        }
        
        // Otherwise add as new entry
        return {
          ...oldData,
          data: {
            ...oldData.data,
            entries: [...(oldData.data.entries || []), optimisticEntry]
          }
        };
      });
      
      return { previousFormWithEntries };
    },
    onSuccess: (_, variables) => {
      showToast({
        title: 'Đã thêm dữ liệu công nhân',
        variant: 'default',
        duration: 3000,
      });
      
      // Invalidate form with entries
      queryClient.invalidateQueries({ 
        queryKey: ['digital-form-with-entries', variables.formId] 
      });
      
      // Also update the basic form data as metrics might have changed
      queryClient.invalidateQueries({ 
        queryKey: ['digital-form', variables.formId],
        refetchType: 'none' // Don't force refetch
      });
    },
    onError: (error: any, variables, context: any) => {
      // Restore previous form with entries state
      if (context?.previousFormWithEntries) {
        queryClient.setQueryData(
          ['digital-form-with-entries', variables.formId], 
          context.previousFormWithEntries
        );
      }
      
      showToast({
        title: 'Không thể thêm dữ liệu công nhân',
        description: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
        duration: 4000,
      });
      logError(`addFormEntryMutation(${variables.formId})`, error);
    },
  });

  /**
   * Delete form entry with optimistic updates
   */
  const deleteFormEntryMutation: UseMutationResult<ApiResponse<void>, Error, { formId: string; entryId: string }> = useMutation({
    mutationFn: async ({ formId, entryId }: { formId: string; entryId: string }) => {
      const mutationId = `delete-entry-${formId}-${entryId}-${Date.now()}`;
      try {
        pendingMutationsRef.current.add(mutationId);
        return await DigitalFormService.deleteFormEntry(formId, entryId);
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onMutate: async ({ formId, entryId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form-with-entries', formId] });
      
      // Save previous form with entries state
      const previousFormWithEntries = queryClient.getQueryData(['digital-form-with-entries', formId]);
      
      // Optimistically remove entry from form
      queryClient.setQueryData(['digital-form-with-entries', formId], (oldData: any) => {
        if (!oldData || !oldData.data || !oldData.data.entries) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            entries: oldData.data.entries.filter((entry: any) => entry.id !== entryId)
          }
        };
      });
      
      return { previousFormWithEntries };
    },
    onSuccess: (_, variables) => {
      showToast({
        title: 'Đã xóa dữ liệu công nhân',
        variant: 'default',
        duration: 3000,
      });
      
      // Smart cache invalidation
      queryClient.invalidateQueries({ 
        queryKey: ['digital-form-with-entries', variables.formId] 
      });
      
      // Also update the basic form data as metrics might have changed
      queryClient.invalidateQueries({ 
        queryKey: ['digital-form', variables.formId],
        refetchType: 'none' // Don't force refetch
      });
    },
    onError: (error: any, variables, context: any) => {
      // Restore previous form with entries state
      if (context?.previousFormWithEntries) {
        queryClient.setQueryData(
          ['digital-form-with-entries', variables.formId], 
          context.previousFormWithEntries
        );
      }
      
      showToast({
        title: 'Không thể xóa dữ liệu công nhân',
        description: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
        duration: 4000,
      });
      logError(`deleteFormEntryMutation(${variables.formId}, ${variables.entryId})`, error);
    },
  });

  /**
   * Submit form for approval with optimistic updates
   */
  const submitFormMutation: UseMutationResult<ApiResponse<void>, Error, { formId: string; data?: TDigitalFormSubmit }> = useMutation({
    mutationFn: async ({ formId, data = {} }: { formId: string; data?: TDigitalFormSubmit }) => {
      const mutationId = `submit-${formId}-${Date.now()}`;
      try {
        pendingMutationsRef.current.add(mutationId);
        return await DigitalFormService.submitForm(formId, data);
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onMutate: async ({ formId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form', formId] });
      
      // Save previous form state
      const previousForm = queryClient.getQueryData(['digital-form', formId]);
      
      // Optimistically update form status
      queryClient.setQueryData(['digital-form', formId], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            status: RecordStatus.PENDING, // Update to pending status
            submitTime: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      });
      
      // Also update in list if present
      queryClient.setQueriesData({ queryKey: ['digital-forms'] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((form: any) => 
            form.id === formId ? 
              {
                ...form,
                status: RecordStatus.PENDING,
                submitTime: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } : 
              form
          )
        };
      });
      
      return { previousForm };
    },
    onSuccess: (_, variables) => {
      showToast({
        title: 'Đã gửi phiếu công đoạn để phê duyệt',
        variant: 'default',
        duration: 3000,
      });
      
      // Smart invalidation
      queryClient.invalidateQueries({ 
        queryKey: ['digital-form', variables.formId],
        refetchType: 'none'
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['digital-forms'],
        refetchType: 'none'
      });
    },
    onError: (error: any, variables, context: any) => {
      // Restore previous form state
      if (context?.previousForm) {
        queryClient.setQueryData(['digital-form', variables.formId], context.previousForm);
      }
      
      showToast({
        title: 'Không thể gửi phiếu công đoạn',
        description: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
        duration: 4000,
      });
      logError(`submitFormMutation(${variables.formId})`, error);
    },
  });

  /**
   * Approve form with optimistic updates
   */
  const approveFormMutation: UseMutationResult<ApiResponse<void>, Error, string> = useMutation({
    mutationFn: async (formId: string) => {
      const mutationId = `approve-${formId}-${Date.now()}`;
      try {
        pendingMutationsRef.current.add(mutationId);
        return await DigitalFormService.approveForm(formId);
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onMutate: async (formId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form', formId] });
      
      // Save previous form state
      const previousForm = queryClient.getQueryData(['digital-form', formId]);
      
      // Optimistically update form status
      queryClient.setQueryData(['digital-form', formId], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            status: RecordStatus.CONFIRMED, // Update to confirmed status
            approvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      });
      
      // Also update in list if present
      queryClient.setQueriesData({ queryKey: ['digital-forms'] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((form: any) => 
            form.id === formId ? 
              {
                ...form,
                status: RecordStatus.CONFIRMED,
                approvedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } : 
              form
          )
        };
      });
      
      return { previousForm };
    },
    onSuccess: (_, formId) => {
      showToast({
        title: 'Đã phê duyệt phiếu công đoạn',
        variant: 'default',
        duration: 3000,
      });
      
      // Smart invalidation
      queryClient.invalidateQueries({ 
        queryKey: ['digital-form', formId],
        refetchType: 'none'
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['digital-forms'],
        refetchType: 'none'
      });
    },
    onError: (error: any, formId, context: any) => {
      // Restore previous form state
      if (context?.previousForm) {
        queryClient.setQueryData(['digital-form', formId], context.previousForm);
      }
      
      showToast({
        title: 'Không thể phê duyệt phiếu công đoạn',
        description: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
        duration: 4000,
      });
      logError(`approveFormMutation(${formId})`, error);
    },
  });

  /**
   * Reject form with optimistic updates
   */
  const rejectFormMutation: UseMutationResult<ApiResponse<void>, Error, string> = useMutation({
    mutationFn: async (formId: string) => {
      const mutationId = `reject-${formId}-${Date.now()}`;
      try {
        pendingMutationsRef.current.add(mutationId);
        return await DigitalFormService.rejectForm(formId);
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onMutate: async (formId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-form', formId] });
      
      // Save previous form state
      const previousForm = queryClient.getQueryData(['digital-form', formId]);
      
      // Optimistically update form status
      queryClient.setQueryData(['digital-form', formId], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            status: RecordStatus.REJECTED, // Update to rejected status
            updatedAt: new Date().toISOString()
          }
        };
      });
      
      // Also update in list if present
      queryClient.setQueriesData({ queryKey: ['digital-forms'] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((form: any) => 
            form.id === formId ? 
              {
                ...form,
                status: RecordStatus.REJECTED,
                updatedAt: new Date().toISOString()
              } : 
              form
          )
        };
      });
      
      return { previousForm };
    },
    onSuccess: (_, formId) => {
      showToast({
        title: 'Đã từ chối phiếu công đoạn',
        variant: 'default',
        duration: 3000,
      });
      
      // Smart invalidation
      queryClient.invalidateQueries({ 
        queryKey: ['digital-form', formId],
        refetchType: 'none'
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['digital-forms'],
        refetchType: 'none'
      });
    },
    onError: (error: any, formId, context: any) => {
      // Restore previous form state
      if (context?.previousForm) {
        queryClient.setQueryData(['digital-form', formId], context.previousForm);
      }
      
      showToast({
        title: 'Không thể từ chối phiếu công đoạn',
        description: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
        duration: 4000,
      });
      logError(`rejectFormMutation(${formId})`, error);
    },
  });

  /**
   * Export forms to Excel with error handling
   */
  const exportFormsToExcelMutation: UseMutationResult<ApiResponse<{url: string}>, Error, string[]> = useMutation({
    mutationFn: async (formIds: string[]) => {
      const mutationId = `export-${Date.now()}`;
      try {
        pendingMutationsRef.current.add(mutationId);
        return await DigitalFormService.exportFormsToExcel(formIds);
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onSuccess: (response) => {
      if (response?.data?.url) {
        // Trigger download from server-generated URL
        if (typeof window !== 'undefined') {
          window.open(response.data.url, '_blank');
        }
      }
      
      showToast({
        title: 'Đã xuất phiếu công đoạn',
        variant: 'default',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Không thể xuất phiếu công đoạn',
        description: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
        duration: 4000,
      });
      logError('exportFormsToExcelMutation', error);
    },
  });

  // Utility to check if there are any pending mutations
  const hasPendingMutations = useCallback(() => {
    return pendingMutationsRef.current.size > 0;
  }, []);

  // Utility to clear pending mutations (useful for cleanup)
  const clearPendingMutations = useCallback(() => {
    pendingMutationsRef.current.clear();
  }, []);

  return {
    // Form CRUD mutations
    createFormMutation,
    updateFormMutation,
    deleteFormMutation,
    batchDeleteFormsMutation,
    
    // Entry mutations
    addFormEntryMutation,
    deleteFormEntryMutation,
    
    // Workflow mutations
    submitFormMutation,
    approveFormMutation,
    rejectFormMutation,
    
    // Export mutation
    exportFormsToExcelMutation,
    
    // Utilities
    hasPendingMutations,
    clearPendingMutations
  };
};