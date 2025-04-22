// hooks/digital-form/useDigitalForms.ts
import { useCallback, useRef } from 'react';
import { useDigitalFormQueries } from './useDigitalFormQueries';
import { useDigitalFormMutations } from './useDigitalFormMutations';
import { useDigitalFormCache } from './useDigitalFormCache';
import { DigitalFormCondition, PaginationParams } from '@/services/form/digitalFormService';
import { 
  TDigitalFormCreate, 
  TDigitalFormUpdate, 
  TDigitalFormSubmit, 
  TDigitalFormEntry 
} from '@/schemas/digital-form.schema';
import { toast } from '@/hooks/use-toast';

/**
 * Hook tổng hợp cho Digital Forms
 * Tích hợp cả queries, mutations và cache management
 * Được thiết kế cho hiệu suất cao với 5000+ người dùng
 */
export const useDigitalForms = () => {
  // Sử dụng các hooks con
  const queries = useDigitalFormQueries();
  const mutations = useDigitalFormMutations();
  const cache = useDigitalFormCache();
  
  // State tracking
  const isLoadingRef = useRef(false);
  
  // Centralized error logging
  const logError = useCallback((context: string, error: any) => {
    console.error(`DigitalForms Error (${context}):`, error);
  }, []);
  
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

  /**
   * Check if there are any background operations
   */
  const isLoading = useCallback(() => {
    return isLoadingRef.current || 
           mutations.hasPendingMutations();
  }, [mutations]);

  /**
   * Create form with enhanced error handling and prefetching
   */
  const createForm = useCallback(async (data: TDigitalFormCreate) => {
    try {
      isLoadingRef.current = true;
      const result = await mutations.createFormMutation.mutateAsync(data);
      
      if (result?.data?.id) {
        // Prefetch data for the new form for better UX
        await cache.prefetchFormData(result.data.id);
      }
      
      return result;
    } catch (error) {
      logError('createForm', error);
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.createFormMutation, cache.prefetchFormData, logError]);

  /**
   * Update form with loading state tracking
   */
  const updateForm = useCallback(async (id: string, data: TDigitalFormUpdate) => {
    try {
      isLoadingRef.current = true;
      return await mutations.updateFormMutation.mutateAsync({ id, data });
    } catch (error) {
      logError(`updateForm(${id})`, error);
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.updateFormMutation, logError]);

  /**
   * Delete form with confirmation and prefetching cancellation
   */
  const deleteForm = useCallback(async (id: string) => {
    try {
      isLoadingRef.current = true;
      return await mutations.deleteFormMutation.mutateAsync(id);
    } catch (error) {
      logError(`deleteForm(${id})`, error);
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.deleteFormMutation, logError]);

  /**
   * Batch delete forms with enhanced error handling
   */
  const batchDeleteForms = useCallback(async (formIds: string[]) => {
    if (!formIds.length) {
      return { success: false, data: { count: 0 } };
    }
    
    try {
      isLoadingRef.current = true;
      return await mutations.batchDeleteFormsMutation.mutateAsync(formIds);
    } catch (error) {
      logError('batchDeleteForms', error);
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.batchDeleteFormsMutation, logError]);

  /**
   * Add entry to form with loading state and prefetching
   */
  const addFormEntry = useCallback(async (formId: string, data: TDigitalFormEntry) => {
    try {
      isLoadingRef.current = true;
      return await mutations.addFormEntryMutation.mutateAsync({ formId, data });
    } catch (error) {
      logError(`addFormEntry(${formId})`, error);
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.addFormEntryMutation, logError]);

  /**
   * Delete entry from form with loading state
   */
  const deleteFormEntry = useCallback(async (formId: string, entryId: string) => {
    try {
      isLoadingRef.current = true;
      return await mutations.deleteFormEntryMutation.mutateAsync({ formId, entryId });
    } catch (error) {
      logError(`deleteFormEntry(${formId}, ${entryId})`, error);
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.deleteFormEntryMutation, logError]);

  /**
   * Submit form with loading state
   */
  const submitForm = useCallback(async (formId: string, data: TDigitalFormSubmit = {}) => {
    try {
      isLoadingRef.current = true;
      return await mutations.submitFormMutation.mutateAsync({ formId, data });
    } catch (error) {
      logError(`submitForm(${formId})`, error);
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.submitFormMutation, logError]);

  /**
   * Approve form with loading state
   */
  const approveForm = useCallback(async (formId: string) => {
    try {
      isLoadingRef.current = true;
      return await mutations.approveFormMutation.mutateAsync(formId);
    } catch (error) {
      logError(`approveForm(${formId})`, error);
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.approveFormMutation, logError]);

  /**
   * Reject form with loading state
   */
  const rejectForm = useCallback(async (formId: string) => {
    try {
      isLoadingRef.current = true;
      return await mutations.rejectFormMutation.mutateAsync(formId);
    } catch (error) {
      logError(`rejectForm(${formId})`, error);
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.rejectFormMutation, logError]);

  /**
   * Export forms to Excel
   */
  const exportFormsToExcel = useCallback(async (formIds: string[]) => {
    if (!formIds.length) {
      showToast({
        title: 'Không có phiếu công đoạn nào được chọn',
        variant: 'destructive',
        duration: 3000,
      });
      return null;
    }
    
    try {
      isLoadingRef.current = true;
      return await mutations.exportFormsToExcelMutation.mutateAsync(formIds);
    } catch (error) {
      logError('exportFormsToExcel', error);
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.exportFormsToExcelMutation, showToast, logError]);

  /**
   * Load forms with automatic prefetching of first page items
   */
  const loadForms = useCallback((params: DigitalFormCondition & PaginationParams = {}) => {
    const result = queries.listForms(params);
    
    // Prefetch first 3 forms for better UX when user clicks on them
    if (result.data?.data && result.data.data.length > 0) {
      const formIds = result.data.data.slice(0, 3).map(form => form.id);
      
      if (formIds.length) {
        // Use setTimeout to defer prefetching until after rendering
        setTimeout(() => {
          cache.batchPrefetchForms(formIds).catch(err => 
            console.warn('Failed to prefetch form data:', err)
          );
        }, 50);
      }
    }
  
    console.log('result', result);
    
    return result;
  }, [queries.listForms, cache.batchPrefetchForms]);
  
  // Return combined API
  return {
    // Base query operations
    listForms: loadForms,
    getForm: queries.getForm,
    getFormWithEntries: queries.getFormWithEntries,
    getFormPrintVersion: queries.getFormPrintVersion,
    getFormStats: queries.getFormStats,
    
    // Enhanced mutation operations with loading state
    createForm,
    updateForm,
    deleteForm,
    batchDeleteForms,
    addFormEntry,
    deleteFormEntry,
    submitForm,
    approveForm,
    rejectForm,
    exportFormsToExcel,
    
    // Cache operations
    prefetchFormData: cache.prefetchFormData,
    prefetchFormWithEntries: cache.prefetchFormWithEntries,
    batchPrefetchForms: cache.batchPrefetchForms,
    prewarmListCache: cache.prewarmListCache,
    invalidateFormData: cache.invalidateFormData,
    invalidateFormWithEntries: cache.invalidateFormWithEntries,
    invalidateFormsList: cache.invalidateFormsList,
    invalidateAllFormData: cache.invalidateAllFormData,
    
    // State tracking
    isLoading,
    hasPendingMutations: mutations.hasPendingMutations,
    clearPendingMutations: mutations.clearPendingMutations,
    
    // Original mutation objects for advanced use cases
    createFormMutation: mutations.createFormMutation,
    updateFormMutation: mutations.updateFormMutation,
    deleteFormMutation: mutations.deleteFormMutation,
    batchDeleteFormsMutation: mutations.batchDeleteFormsMutation,
    addFormEntryMutation: mutations.addFormEntryMutation,
    deleteFormEntryMutation: mutations.deleteFormEntryMutation,
    submitFormMutation: mutations.submitFormMutation,
    approveFormMutation: mutations.approveFormMutation,
    rejectFormMutation: mutations.rejectFormMutation,
    exportFormsToExcelMutation: mutations.exportFormsToExcelMutation,
  };
};