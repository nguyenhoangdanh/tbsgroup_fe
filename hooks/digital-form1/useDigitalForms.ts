// hooks/digital-form/useDigitalForms.ts
import { useCallback, useRef, useMemo } from 'react';
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
import { useDebouncedCallback } from '@/utils/debounce';

/**
 * Hook tổng hợp cho Digital Forms
 * Tích hợp cả queries, mutations và cache management
 * Được tối ưu hiệu suất cho 5000+ người dùng đồng thời
 */
export const useDigitalForms = () => {
  // Sử dụng các hooks con
  const queries = useDigitalFormQueries();
  const mutations = useDigitalFormMutations();
  const cache = useDigitalFormCache();
  
  // State tracking - dùng ref thay vì state để tránh re-render
  const isLoadingRef = useRef(false);
  const pendingOperationsRef = useRef(new Map());
  const retryAttemptsRef = useRef(new Map());
  
  // Hằng số cho retry strategy
  const RETRY_CONFIG = useMemo(() => ({
    MAX_RETRIES: 3,
    INITIAL_BACKOFF: 300, // 300ms
    MAX_BACKOFF: 10000, // 10s
    BACKOFF_FACTOR: 1.5,
  }), []);

  // Tính toán thời gian chờ cho retry dựa trên số lần thử
  const calculateBackoff = useCallback((attemptNumber) => {
    return Math.min(
      RETRY_CONFIG.INITIAL_BACKOFF * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attemptNumber),
      RETRY_CONFIG.MAX_BACKOFF
    );
  }, [RETRY_CONFIG]);
  
  // Centralized error logging with enhanced tracing
  const logError = useCallback((context: string, error: any, additionalInfo?: Object) => {
    console.error(`DigitalForms Error (${context}):`, error, additionalInfo || {});
    
    // Trong môi trường production, có thể gửi log về server
    // if (process.env.NODE_ENV === 'production') {
    //   sendErrorToMonitoringService(context, error, additionalInfo);
    // }
  }, []);
  
  // Utility to safely show toast notifications - debounced để tránh quá nhiều thông báo
  const showToastDebounced = useDebouncedCallback((options: { 
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
  }, 300);

  /**
   * Theo dõi các hoạt động đang xử lý
   */
  const trackOperation = useCallback((operationId: string, promise: Promise<any>) => {
    pendingOperationsRef.current.set(operationId, promise);
    
    promise.finally(() => {
      pendingOperationsRef.current.delete(operationId);
    });
    
    return promise;
  }, []);

  /**
   * Check if there are any background operations
   */
  const isLoading = useCallback(() => {
    return isLoadingRef.current || 
           pendingOperationsRef.current.size > 0 ||
           mutations.hasPendingMutations();
  }, [mutations]);

  /**
   * Tối ưu retry logic cho các thao tác với backoff strategy
   */
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: any
  ): Promise<T> => {
    const operationId = `${operationName}-${Date.now()}`;
    let attempt = retryAttemptsRef.current.get(operationId) || 0;
    
    try {
      const result = await operation();
      retryAttemptsRef.current.delete(operationId);
      return result;
    } catch (error) {
      attempt += 1;
      retryAttemptsRef.current.set(operationId, attempt);
      
      // Log lỗi với thông tin retry
      logError(operationName, error, {
        context,
        retryAttempt: attempt,
        maxRetries: RETRY_CONFIG.MAX_RETRIES,
      });
      
      // Thử lại nếu chưa đạt giới hạn
      if (attempt < RETRY_CONFIG.MAX_RETRIES) {
        const backoff = calculateBackoff(attempt);
        
        // Thông báo cho người dùng
        if (attempt === 1) {
          showToastDebounced({
            title: 'Đang thử lại',
            description: 'Đang kết nối lại với máy chủ...',
            duration: 2000,
          });
        }
        
        // Đợi trước khi thử lại
        await new Promise(resolve => setTimeout(resolve, backoff));
        return withRetry(operation, operationName, context);
      }
      
      // Đã hết số lần thử, throw lỗi
      throw error;
    }
  }, [calculateBackoff, logError, RETRY_CONFIG.MAX_RETRIES, showToastDebounced]);

  /**
   * Create form with enhanced error handling and prefetching
   */
  const createForm = useCallback(async (data: TDigitalFormCreate) => {
    const operationId = `create-form-${Date.now()}`;
    
    try {
      isLoadingRef.current = true;
      
      const createOperation = async () => {
        return await mutations.createFormMutation.mutateAsync(data);
      };
      
      // Sử dụng withRetry để tự động retry khi gặp lỗi
      const result = await trackOperation(
        operationId,
        withRetry(createOperation, 'createForm', { formData: data })
      );
      
      if (result?.data?.id) {
        // Prefetch data for the new form for better UX
        // Đặt vào setTimeout với độ ưu tiên thấp để không ảnh hưởng đến UX chính
        setTimeout(() => {
          cache.prefetchFormData(result.data.id)
            .catch(err => console.warn('Failed to prefetch form data:', err));
        }, 100);
      }
      
      return result;
    } catch (error) {
      logError('createForm', error, { formData: data });
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.createFormMutation, cache.prefetchFormData, logError, trackOperation, withRetry]);

  /**
   * Update form with loading state tracking và optimistic updates
   */
  const updateForm = useCallback(async (id: string, data: TDigitalFormUpdate) => {
    const operationId = `update-form-${id}-${Date.now()}`;
    
    try {
      isLoadingRef.current = true;
      
      const updateOperation = async () => {
        return await mutations.updateFormMutation.mutateAsync({ id, data });
      };
      
      return await trackOperation(
        operationId,
        withRetry(updateOperation, `updateForm(${id})`, { formId: id, formData: data })
      );
    } catch (error) {
      logError(`updateForm(${id})`, error, { formId: id, formData: data });
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.updateFormMutation, logError, trackOperation, withRetry]);

  /**
   * Delete form with confirmation and prefetching cancellation
   */
  const deleteForm = useCallback(async (id: string) => {
    const operationId = `delete-form-${id}-${Date.now()}`;
    
    try {
      isLoadingRef.current = true;
      
      const deleteOperation = async () => {
        return await mutations.deleteFormMutation.mutateAsync(id);
      };
      
      return await trackOperation(
        operationId,
        withRetry(deleteOperation, `deleteForm(${id})`, { formId: id })
      );
    } catch (error) {
      logError(`deleteForm(${id})`, error, { formId: id });
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.deleteFormMutation, logError, trackOperation, withRetry]);

  /**
   * Batch delete forms with enhanced error handling và bulk processing
   */
  const batchDeleteForms = useCallback(async (formIds: string[]) => {
    if (!formIds.length) {
      return { success: false, data: { count: 0 } };
    }
    
    const operationId = `batch-delete-forms-${Date.now()}`;
    
    try {
      isLoadingRef.current = true;
      
      const batchDeleteOperation = async () => {
        return await mutations.batchDeleteFormsMutation.mutateAsync(formIds);
      };
      
      return await trackOperation(
        operationId,
        withRetry(batchDeleteOperation, 'batchDeleteForms', { formIds })
      );
    } catch (error) {
      logError('batchDeleteForms', error, { formIds });
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.batchDeleteFormsMutation, logError, trackOperation, withRetry]);

  /**
   * Add entry to form with loading state and prefetching
   */
  const addFormEntry = useCallback(async (formId: string, data: TDigitalFormEntry) => {
    const operationId = `add-form-entry-${formId}-${Date.now()}`;
    
    try {
      isLoadingRef.current = true;
      
      const addEntryOperation = async () => {
        return await mutations.addFormEntryMutation.mutateAsync({ formId, data });
      };
      
      return await trackOperation(
        operationId,
        withRetry(addEntryOperation, `addFormEntry(${formId})`, { formId, entryData: data })
      );
    } catch (error) {
      logError(`addFormEntry(${formId})`, error, { formId, entryData: data });
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.addFormEntryMutation, logError, trackOperation, withRetry]);

  /**
   * Delete entry from form with loading state và optimistic updates
   */
  const deleteFormEntry = useCallback(async (formId: string, entryId: string) => {
    const operationId = `delete-form-entry-${formId}-${entryId}-${Date.now()}`;
    
    try {
      isLoadingRef.current = true;
      
      const deleteEntryOperation = async () => {
        return await mutations.deleteFormEntryMutation.mutateAsync({ formId, entryId });
      };
      
      return await trackOperation(
        operationId,
        withRetry(deleteEntryOperation, `deleteFormEntry(${formId}, ${entryId})`, { formId, entryId })
      );
    } catch (error) {
      logError(`deleteFormEntry(${formId}, ${entryId})`, error, { formId, entryId });
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.deleteFormEntryMutation, logError, trackOperation, withRetry]);

  /**
   * Submit form with loading state và status updates
   */
  const submitForm = useCallback(async (formId: string, data: TDigitalFormSubmit = {}) => {
    const operationId = `submit-form-${formId}-${Date.now()}`;
    
    try {
      isLoadingRef.current = true;
      
      const submitOperation = async () => {
        return await mutations.submitFormMutation.mutateAsync({ formId, data });
      };
      
      return await trackOperation(
        operationId,
        withRetry(submitOperation, `submitForm(${formId})`, { formId, submitData: data })
      );
    } catch (error) {
      logError(`submitForm(${formId})`, error, { formId, submitData: data });
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.submitFormMutation, logError, trackOperation, withRetry]);

  /**
   * Approve form with loading state và confirmation
   */
  const approveForm = useCallback(async (formId: string) => {
    const operationId = `approve-form-${formId}-${Date.now()}`;
    
    try {
      isLoadingRef.current = true;
      
      const approveOperation = async () => {
        return await mutations.approveFormMutation.mutateAsync(formId);
      };
      
      return await trackOperation(
        operationId,
        withRetry(approveOperation, `approveForm(${formId})`, { formId })
      );
    } catch (error) {
      logError(`approveForm(${formId})`, error, { formId });
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.approveFormMutation, logError, trackOperation, withRetry]);

  /**
   * Reject form with loading state và confirmation
   */
  const rejectForm = useCallback(async (formId: string) => {
    const operationId = `reject-form-${formId}-${Date.now()}`;
    
    try {
      isLoadingRef.current = true;
      
      const rejectOperation = async () => {
        return await mutations.rejectFormMutation.mutateAsync(formId);
      };
      
      return await trackOperation(
        operationId,
        withRetry(rejectOperation, `rejectForm(${formId})`, { formId })
      );
    } catch (error) {
      logError(`rejectForm(${formId})`, error, { formId });
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.rejectFormMutation, logError, trackOperation, withRetry]);

  /**
   * Export forms to Excel - tối ưu hóa quản lý tài nguyên
   */
  const exportFormsToExcel = useCallback(async (formIds: string[]) => {
    if (!formIds.length) {
      showToastDebounced({
        title: 'Không có phiếu công đoạn nào được chọn',
        variant: 'destructive',
        duration: 3000,
      });
      return null;
    }
    
    const operationId = `export-forms-${Date.now()}`;
    
    try {
      isLoadingRef.current = true;
      
      const exportOperation = async () => {
        return await mutations.exportFormsToExcelMutation.mutateAsync(formIds);
      };
      
      return await trackOperation(
        operationId,
        withRetry(exportOperation, 'exportFormsToExcel', { formIds })
      );
    } catch (error) {
      logError('exportFormsToExcel', error, { formIds });
      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [mutations.exportFormsToExcelMutation, showToastDebounced, logError, trackOperation, withRetry]);

  /**
   * Batch prefetch nhiều forms cùng lúc, tối ưu băng thông
   */
  const batchPrefetchForms = useCallback(async (formIds: string[]) => {
    if (!formIds || !formIds.length) return;
    
    // Chia nhỏ thành các batch để không tạo quá nhiều requests cùng lúc
    const batchSize = 3; 
    const batches = [];
    
    for (let i = 0; i < formIds.length; i += batchSize) {
      batches.push(formIds.slice(i, i + batchSize));
    }
    
    // Process batches sequentially to avoid overwhelming the network
    for (const batch of batches) {
      try {
        await Promise.all(batch.map(id => cache.prefetchFormData(id)));
      } catch (error) {
        // Log but don't fail the entire operation
        console.warn('Error prefetching forms batch:', error);
      }
      
      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }, [cache]);

  /**
   * Load forms with automatic prefetching of first page items
   * Tối ưu hóa cho hiệu suất tải trang cao
   */
  const loadForms = useCallback((params: DigitalFormCondition & PaginationParams = {}) => {
    const result = queries.listForms(params);
    
    // Nếu có data và không đang loading, prefetch các item đầu tiên
    if (result.data?.data && result.data.data.length > 0 && !result.isLoading) {
      const formIds = result.data.data.slice(0, 3).map(form => form.id);
      
      if (formIds.length) {
        // Sử dụng requestIdleCallback nếu trình duyệt hỗ trợ, nếu không thì dùng setTimeout
        const scheduleIdleTask = (window as any).requestIdleCallback || 
          ((cb: Function) => setTimeout(cb, 50));
          
        scheduleIdleTask(() => {
          batchPrefetchForms(formIds).catch(err => 
            console.warn('Failed to prefetch form data:', err)
          );
        });
      }
    }
    
    return result;
  }, [queries.listForms, batchPrefetchForms]);

  /**
   * Tìm kiếm nhanh mà không làm quá tải server
   * Sử dụng debounce để giảm số lượng requests
   */
  const searchForms = useDebouncedCallback((searchTerm: string) => {
    return loadForms({ search: searchTerm });
  }, 300);
  
  // Return combined API
  return {
    // Base query operations
    listForms: loadForms,
    searchForms,
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
    batchPrefetchForms,
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






































// // hooks/digital-form/useDigitalForms.ts
// import { useCallback, useRef } from 'react';
// import { useDigitalFormQueries } from './useDigitalFormQueries';
// import { useDigitalFormMutations } from './useDigitalFormMutations';
// import { useDigitalFormCache } from './useDigitalFormCache';
// import { DigitalFormCondition, PaginationParams } from '@/services/form/digitalFormService';
// import { 
//   TDigitalFormCreate, 
//   TDigitalFormUpdate, 
//   TDigitalFormSubmit, 
//   TDigitalFormEntry 
// } from '@/schemas/digital-form.schema';
// import { toast } from '@/hooks/use-toast';

// /**
//  * Hook tổng hợp cho Digital Forms
//  * Tích hợp cả queries, mutations và cache management
//  * Được thiết kế cho hiệu suất cao với 5000+ người dùng
//  */
// export const useDigitalForms = () => {
//   // Sử dụng các hooks con
//   const queries = useDigitalFormQueries();
//   const mutations = useDigitalFormMutations();
//   const cache = useDigitalFormCache();
  
//   // State tracking
//   const isLoadingRef = useRef(false);
  
//   // Centralized error logging
//   const logError = useCallback((context: string, error: any) => {
//     console.error(`DigitalForms Error (${context}):`, error);
//   }, []);
  
//   // Utility to safely show toast notifications
//   const showToast = useCallback((options: { 
//     title: string, 
//     description?: string, 
//     variant?: 'default' | 'destructive',
//     duration?: number
//   }) => {
//     try {
//       toast({
//         title: options.title,
//         description: options.description,
//         variant: options.variant || 'default',
//         duration: options.duration || 3000
//       });
//     } catch (error) {
//       console.warn('Failed to show toast notification:', error);
//     }
//   }, []);

//   /**
//    * Check if there are any background operations
//    */
//   const isLoading = useCallback(() => {
//     return isLoadingRef.current || 
//            mutations.hasPendingMutations();
//   }, [mutations]);

//   /**
//    * Create form with enhanced error handling and prefetching
//    */
//   const createForm = useCallback(async (data: TDigitalFormCreate) => {
//     try {
//       isLoadingRef.current = true;
//       const result = await mutations.createFormMutation.mutateAsync(data);
      
//       if (result?.data?.id) {
//         // Prefetch data for the new form for better UX
//         await cache.prefetchFormData(result.data.id);
//       }
      
//       return result;
//     } catch (error) {
//       logError('createForm', error);
//       throw error;
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [mutations.createFormMutation, cache.prefetchFormData, logError]);

//   /**
//    * Update form with loading state tracking
//    */
//   const updateForm = useCallback(async (id: string, data: TDigitalFormUpdate) => {
//     try {
//       isLoadingRef.current = true;
//       return await mutations.updateFormMutation.mutateAsync({ id, data });
//     } catch (error) {
//       logError(`updateForm(${id})`, error);
//       throw error;
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [mutations.updateFormMutation, logError]);

//   /**
//    * Delete form with confirmation and prefetching cancellation
//    */
//   const deleteForm = useCallback(async (id: string) => {
//     try {
//       isLoadingRef.current = true;
//       return await mutations.deleteFormMutation.mutateAsync(id);
//     } catch (error) {
//       logError(`deleteForm(${id})`, error);
//       throw error;
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [mutations.deleteFormMutation, logError]);

//   /**
//    * Batch delete forms with enhanced error handling
//    */
//   const batchDeleteForms = useCallback(async (formIds: string[]) => {
//     if (!formIds.length) {
//       return { success: false, data: { count: 0 } };
//     }
    
//     try {
//       isLoadingRef.current = true;
//       return await mutations.batchDeleteFormsMutation.mutateAsync(formIds);
//     } catch (error) {
//       logError('batchDeleteForms', error);
//       throw error;
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [mutations.batchDeleteFormsMutation, logError]);

//   /**
//    * Add entry to form with loading state and prefetching
//    */
//   const addFormEntry = useCallback(async (formId: string, data: TDigitalFormEntry) => {
//     try {
//       isLoadingRef.current = true;
//       return await mutations.addFormEntryMutation.mutateAsync({ formId, data });
//     } catch (error) {
//       logError(`addFormEntry(${formId})`, error);
//       throw error;
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [mutations.addFormEntryMutation, logError]);

//   /**
//    * Delete entry from form with loading state
//    */
//   const deleteFormEntry = useCallback(async (formId: string, entryId: string) => {
//     try {
//       isLoadingRef.current = true;
//       return await mutations.deleteFormEntryMutation.mutateAsync({ formId, entryId });
//     } catch (error) {
//       logError(`deleteFormEntry(${formId}, ${entryId})`, error);
//       throw error;
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [mutations.deleteFormEntryMutation, logError]);

//   /**
//    * Submit form with loading state
//    */
//   const submitForm = useCallback(async (formId: string, data: TDigitalFormSubmit = {}) => {
//     try {
//       isLoadingRef.current = true;
//       return await mutations.submitFormMutation.mutateAsync({ formId, data });
//     } catch (error) {
//       logError(`submitForm(${formId})`, error);
//       throw error;
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [mutations.submitFormMutation, logError]);

//   /**
//    * Approve form with loading state
//    */
//   const approveForm = useCallback(async (formId: string) => {
//     try {
//       isLoadingRef.current = true;
//       return await mutations.approveFormMutation.mutateAsync(formId);
//     } catch (error) {
//       logError(`approveForm(${formId})`, error);
//       throw error;
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [mutations.approveFormMutation, logError]);

//   /**
//    * Reject form with loading state
//    */
//   const rejectForm = useCallback(async (formId: string) => {
//     try {
//       isLoadingRef.current = true;
//       return await mutations.rejectFormMutation.mutateAsync(formId);
//     } catch (error) {
//       logError(`rejectForm(${formId})`, error);
//       throw error;
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [mutations.rejectFormMutation, logError]);

//   /**
//    * Export forms to Excel
//    */
//   const exportFormsToExcel = useCallback(async (formIds: string[]) => {
//     if (!formIds.length) {
//       showToast({
//         title: 'Không có phiếu công đoạn nào được chọn',
//         variant: 'destructive',
//         duration: 3000,
//       });
//       return null;
//     }
    
//     try {
//       isLoadingRef.current = true;
//       return await mutations.exportFormsToExcelMutation.mutateAsync(formIds);
//     } catch (error) {
//       logError('exportFormsToExcel', error);
//       throw error;
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [mutations.exportFormsToExcelMutation, showToast, logError]);

//   /**
//    * Load forms with automatic prefetching of first page items
//    */
//   const loadForms = useCallback((params: DigitalFormCondition & PaginationParams = {}) => {
//     const result = queries.listForms(params);
    
//     // Prefetch first 3 forms for better UX when user clicks on them
//     if (result.data?.data && result.data.data.length > 0) {
//       const formIds = result.data.data.slice(0, 3).map(form => form.id);
      
//       if (formIds.length) {
//         // Use setTimeout to defer prefetching until after rendering
//         setTimeout(() => {
//           cache.batchPrefetchForms(formIds).catch(err => 
//             console.warn('Failed to prefetch form data:', err)
//           );
//         }, 50);
//       }
//     }
  
//     console.log('result', result);
    
//     return result;
//   }, [queries.listForms, cache.batchPrefetchForms]);
  
//   // Return combined API
//   return {
//     // Base query operations
//     listForms: loadForms,
//     getForm: queries.getForm,
//     getFormWithEntries: queries.getFormWithEntries,
//     getFormPrintVersion: queries.getFormPrintVersion,
//     getFormStats: queries.getFormStats,
    
//     // Enhanced mutation operations with loading state
//     createForm,
//     updateForm,
//     deleteForm,
//     batchDeleteForms,
//     addFormEntry,
//     deleteFormEntry,
//     submitForm,
//     approveForm,
//     rejectForm,
//     exportFormsToExcel,
    
//     // Cache operations
//     prefetchFormData: cache.prefetchFormData,
//     prefetchFormWithEntries: cache.prefetchFormWithEntries,
//     batchPrefetchForms: cache.batchPrefetchForms,
//     prewarmListCache: cache.prewarmListCache,
//     invalidateFormData: cache.invalidateFormData,
//     invalidateFormWithEntries: cache.invalidateFormWithEntries,
//     invalidateFormsList: cache.invalidateFormsList,
//     invalidateAllFormData: cache.invalidateAllFormData,
    
//     // State tracking
//     isLoading,
//     hasPendingMutations: mutations.hasPendingMutations,
//     clearPendingMutations: mutations.clearPendingMutations,
    
//     // Original mutation objects for advanced use cases
//     createFormMutation: mutations.createFormMutation,
//     updateFormMutation: mutations.updateFormMutation,
//     deleteFormMutation: mutations.deleteFormMutation,
//     batchDeleteFormsMutation: mutations.batchDeleteFormsMutation,
//     addFormEntryMutation: mutations.addFormEntryMutation,
//     deleteFormEntryMutation: mutations.deleteFormEntryMutation,
//     submitFormMutation: mutations.submitFormMutation,
//     approveFormMutation: mutations.approveFormMutation,
//     rejectFormMutation: mutations.rejectFormMutation,
//     exportFormsToExcelMutation: mutations.exportFormsToExcelMutation,
//   };
// };