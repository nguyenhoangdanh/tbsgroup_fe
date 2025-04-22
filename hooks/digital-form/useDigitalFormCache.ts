// hooks/digital-form/useDigitalFormCache.ts
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { DigitalFormService } from '@/services/form/digitalFormService';

/**
 * Hook chuyên xử lý cache và prefetching cho Digital Forms
 * Giúp tối ưu hiệu suất cho UX của người dùng
 */
export const useDigitalFormCache = () => {
  const queryClient = useQueryClient();
  
  /**
   * Smart prefetch for form data with deduplication
   */
  const prefetchFormData = useCallback(async (formId: string) => {
    if (!formId) return;
    
    try {
      // Check if we already have fresh data (last 5 minutes)
      const formState = queryClient.getQueryState(['digital-form', formId]);
      
      if (!formState?.data || formState.dataUpdatedAt < Date.now() - 5 * 60 * 1000) {
        // Prefetch form details
        await queryClient.prefetchQuery({
          queryKey: ['digital-form', formId],
          queryFn: () => DigitalFormService.getForm(formId),
          staleTime: 2 * 60 * 1000 // 2 minutes
        });
      }
    } catch (error) {
      // Log but don't throw since prefetch failures shouldn't block the UI
      console.warn(`Failed to prefetch form data for ID ${formId}:`, error);
    }
  }, [queryClient]);

  /**
   * Smart prefetch for form with entries with deduplication
   */
  const prefetchFormWithEntries = useCallback(async (formId: string) => {
    if (!formId) return;
    
    try {
      // Check if we already have fresh data (last 5 minutes)
      const formState = queryClient.getQueryState(['digital-form-with-entries', formId]);
      
      if (!formState?.data || formState.dataUpdatedAt < Date.now() - 5 * 60 * 1000) {
        // Prefetch form with entries
        await queryClient.prefetchQuery({
          queryKey: ['digital-form-with-entries', formId],
          queryFn: () => DigitalFormService.getFormWithEntries(formId),
          staleTime: 60 * 1000 // 1 minute
        });
      }
    } catch (error) {
      // Log but don't throw since prefetch failures shouldn't block the UI
      console.warn(`Failed to prefetch form with entries for ID ${formId}:`, error);
    }
  }, [queryClient]);
  
  /**
   * Batch prefetch multiple forms for better UX with concurrency control
   */
  const batchPrefetchForms = useCallback(async (formIds: string[]) => {
    if (!formIds.length) return;
    
    // Group prefetches into batches to avoid overwhelming the network
    const batchSize = 3;
    
    for (let i = 0; i < formIds.length; i += batchSize) {
      const batch = formIds.slice(i, i + batchSize);
      
      // Process a batch in parallel
      await Promise.all(batch.map(id => prefetchFormData(id)));
      
      // Add a small delay between batches to reduce network contention
      if (i + batchSize < formIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }, [prefetchFormData]);

  /**
   * Intelligent cache prewarming for list views
   */
  const prewarmListCache = useCallback(async (params: any = {}) => {
    try {
      // Check if we already have reasonably fresh data (last 30 seconds)
      const stableParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        
      const queryKey = ['digital-forms', stableParams];
      const currentState = queryClient.getQueryState(queryKey);
      
      if (!currentState?.data || currentState.dataUpdatedAt < Date.now() - 30 * 1000) {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: () => DigitalFormService.listForms(params),
          staleTime: 60 * 1000 // 1 minute
        });
      }
    } catch (error) {
      console.warn('Failed to prewarm list cache:', error);
    }
  }, [queryClient]);

  /**
   * Invalidate form data
   */
  const invalidateFormData = useCallback(async (formId: string, forceRefetch = false) => {
    if (!formId) return;
    
    try {
      await queryClient.invalidateQueries({
        queryKey: ['digital-form', formId],
        refetchType: forceRefetch ? 'active' : 'none'
      });
    } catch (error) {
      console.warn(`Failed to invalidate form data for ID ${formId}:`, error);
    }
  }, [queryClient]);

  /**
   * Invalidate form with entries
   */
  const invalidateFormWithEntries = useCallback(async (formId: string, forceRefetch = false) => {
    if (!formId) return;
    
    try {
      await queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', formId],
        refetchType: forceRefetch ? 'active' : 'none'
      });
    } catch (error) {
      console.warn(`Failed to invalidate form with entries for ID ${formId}:`, error);
    }
  }, [queryClient]);

  /**
   * Invalidate forms list
   */
  const invalidateFormsList = useCallback(async (forceRefetch = false) => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ['digital-forms'],
        refetchType: forceRefetch ? 'active' : 'none'
      });
    } catch (error) {
      console.warn('Failed to invalidate forms list:', error);
    }
  }, [queryClient]);

  /**
   * Invalidate all form data and lists
   */
  const invalidateAllFormData = useCallback(async (forceRefetch = false) => {
    try {
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey === 'digital-forms' || 
                 queryKey === 'digital-form' || 
                 queryKey === 'digital-form-with-entries' ||
                 queryKey === 'digital-form-print';
        },
        refetchType: forceRefetch ? 'active' : 'none'
      });
    } catch (error) {
      console.warn('Failed to invalidate all form data:', error);
    }
  }, [queryClient]);

  return {
    // Prefetching methods
    prefetchFormData,
    prefetchFormWithEntries,
    batchPrefetchForms,
    prewarmListCache,
    
    // Invalidation methods
    invalidateFormData,
    invalidateFormWithEntries,
    invalidateFormsList,
    invalidateAllFormData
  };
};