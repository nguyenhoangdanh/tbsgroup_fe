// hooks/digital-form/useDigitalFormComposite.ts
import { useCallback, useMemo } from 'react';
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
import { RecordStatus, ShiftType } from '@/common/types/digital-form';

/**
 * Hook tổng hợp cho Digital Forms
 * Tích hợp các queries, mutations và cache management vào một API thống nhất
 * Tối ưu hiệu suất cho ứng dụng với 5000+ người dùng
 */
export const useDigitalFormComposite = () => {
  // Sử dụng các hooks con
  const queries = useDigitalFormQueries();
  const mutations = useDigitalFormMutations();
  const cache = useDigitalFormCache();

  // Utility functions
  
  /**
   * Get status label from status enum
   */
  const getStatusLabel = useCallback((status: RecordStatus): string => {
    const statusLabels: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: 'Nháp',
      [RecordStatus.PENDING]: 'Chờ duyệt',
      [RecordStatus.CONFIRMED]: 'Đã duyệt',
      [RecordStatus.REJECTED]: 'Bị từ chối',
    };
    
    return statusLabels[status] || status;
  }, []);
  
  /**
   * Get status color from status enum
   */
  const getStatusColor = useCallback((status: RecordStatus): string => {
    const statusColors: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: 'blue',
      [RecordStatus.PENDING]: 'orange',
      [RecordStatus.CONFIRMED]: 'green',
      [RecordStatus.REJECTED]: 'red',
    };
    
    return statusColors[status] || 'gray';
  }, []);
  
  /**
   * Get shift label from shift type enum
   */
  const getShiftLabel = useCallback((shiftType: ShiftType): string => {
    const shiftLabels: Record<ShiftType, string> = {
      [ShiftType.REGULAR]: 'Ca Chính (7h30-16h30)',
      [ShiftType.EXTENDED]: 'Ca Kéo Dài (16h30-18h)',
      [ShiftType.OVERTIME]: 'Ca Tăng Ca (18h-20h)',
    };
    
    return shiftLabels[shiftType] || shiftType;
  }, []);

  // Combined Functions
  
  /**
   * Prefetch và chuẩn bị dữ liệu form cho edit view
   */
  const prepareFormForEditing = useCallback(async (formId: string) => {
    if (!formId) return;
    
    try {
      // Prefetch both the form and its entries
      await Promise.all([
        cache.prefetchFormData(formId),
        cache.prefetchFormWithEntries(formId)
      ]);
    } catch (error) {
      console.warn(`Failed to prepare form ${formId} for editing:`, error);
    }
  }, [cache]);

  /**
   * Lấy dữ liệu mẫu cho form mới
   */
  const getNewFormTemplate = useCallback((lineId: string, date: string, shiftType: ShiftType) => {
    return {
      lineId,
      date,
      shiftType,
      formName: `Phiếu công đoạn - ${date} - ${getShiftLabel(shiftType)}`,
      description: '',
    };
  }, [getShiftLabel]);

  /**
   * Xử lý một form entry có lỗi khi import
   */
  const handleInvalidFormEntry = useCallback((entry: any, errors: string[]): { valid: false, entry: any, errors: string[] } => {
    return {
      valid: false,
      entry,
      errors,
    };
  }, []);

  /**
   * Tạo form mới sau khi validate dữ liệu
   */
  const createValidatedForm = useCallback(async (data: TDigitalFormCreate) => {
    // Validate form data
    const validationErrors = [];
    
    if (!data.lineId) {
      validationErrors.push('Thiếu thông tin chuyền');
    }
    
    if (!data.date) {
      validationErrors.push('Thiếu ngày sản xuất');
    }
    
    if (data.shiftType === undefined) {
      validationErrors.push('Thiếu thông tin ca làm việc');
    }
    
    if (validationErrors.length > 0) {
      throw new Error(`Lỗi dữ liệu: ${validationErrors.join(', ')}`);
    }
    
    // Create form
    return await mutations.createFormMutation.mutateAsync(data);
  }, [mutations.createFormMutation]);

  /**
   * Xử lý dữ liệu form entries hàng loạt
   */
  const processBatchEntries = useCallback(async (formId: string, entries: TDigitalFormEntry[]) => {
    if (!formId || !entries.length) return { success: 0, errors: 0, total: 0 };
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process entries in batches to avoid overwhelming the server
    const batchSize = 5;
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(entry => 
          mutations.addFormEntryMutation.mutateAsync({ formId, data: entry })
        )
      );
      
      // Count successes and failures
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          errorCount++;
          console.error('Error adding entry:', result.reason);
        }
      });
      
      // Add a small delay between batches to reduce server load
      if (i + batchSize < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return {
      success: successCount,
      errors: errorCount,
      total: entries.length
    };
  }, [mutations.addFormEntryMutation]);

  return {
    // Re-export all methods from sub-hooks
    ...queries,
    ...mutations,
    ...cache,
    
    // Utility functions
    getStatusLabel,
    getStatusColor,
    getShiftLabel,
    
    // Enhanced combined functions
    prepareFormForEditing,
    getNewFormTemplate,
    handleInvalidFormEntry,
    createValidatedForm,
    processBatchEntries,
    
    // Types re-exported for convenience
    RecordStatus,
    ShiftType,
  };
};