// hooks/useDigitalFormFilters.ts
import { useState, useCallback, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  TDigitalFormCond, 
  TPaginationParams 
} from '@/schemas/digital-form.schema';
import { RecordStatus, ShiftType } from '@/common/types/digital-form';

// Predefined date ranges for easy selection
export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last7Days',
  LAST_30_DAYS: 'last30Days',
  THIS_MONTH: 'thisMonth',
  LAST_MONTH: 'lastMonth',
  CUSTOM: 'custom',
};

// Helper function to format date for API
const formatDateForAPI = (date: Date) => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Hook for managing digital form filters with predefined date ranges
 * Useful for filtering lists and reports
 */
export const useDigitalFormFilters = (initialValues?: Partial<TDigitalFormCond>) => {
  // Set today as default date range
  const today = new Date();
  
  // Default filter state with current date range
  const defaultFilters: TDigitalFormCond = {
    factoryId: initialValues?.factoryId || undefined,
    lineId: initialValues?.lineId || undefined,
    teamId: initialValues?.teamId || undefined,
    groupId: initialValues?.groupId || undefined,
    createdById: initialValues?.createdById || undefined,
    status: initialValues?.status || undefined,
    dateFrom: initialValues?.dateFrom || formatDateForAPI(today),
    dateTo: initialValues?.dateTo || formatDateForAPI(today),
    shiftType: initialValues?.shiftType || undefined,
    search: initialValues?.search || '',
  };

  // State for filters
  const [filters, setFilters] = useState<TDigitalFormCond>(defaultFilters);
  
  // Track the current date range type
  const [dateRangeType, setDateRangeType] = useState<string>(
    // Determine initial date range type
    initialValues?.dateFrom && initialValues?.dateTo 
      ? DATE_RANGES.CUSTOM 
      : DATE_RANGES.TODAY
  );

  // Update a single filter
  const updateFilter = useCallback((key: keyof TDigitalFormCond, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));

    // If updating date fields directly, set to custom range
    if (key === 'dateFrom' || key === 'dateTo') {
      setDateRangeType(DATE_RANGES.CUSTOM);
    }
  }, []);

  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setDateRangeType(DATE_RANGES.TODAY);
  }, [defaultFilters]);

  // Set a predefined date range
  const setDateRange = useCallback((rangeType: string) => {
    const today = new Date();
    let dateFrom = today;
    let dateTo = today;

    switch (rangeType) {
      case DATE_RANGES.TODAY:
        dateFrom = today;
        dateTo = today;
        break;
      case DATE_RANGES.YESTERDAY:
        dateFrom = subDays(today, 1);
        dateTo = subDays(today, 1);
        break;
      case DATE_RANGES.LAST_7_DAYS:
        dateFrom = subDays(today, 6);
        dateTo = today;
        break;
      case DATE_RANGES.LAST_30_DAYS:
        dateFrom = subDays(today, 29);
        dateTo = today;
        break;
      case DATE_RANGES.THIS_MONTH:
        dateFrom = startOfMonth(today);
        dateTo = endOfMonth(today);
        break;
      case DATE_RANGES.LAST_MONTH:
        const lastMonth = subDays(startOfMonth(today), 1);
        dateFrom = startOfMonth(lastMonth);
        dateTo = endOfMonth(lastMonth);
        break;
      case DATE_RANGES.CUSTOM:
        // Keep existing values for custom range
        return;
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      dateFrom: formatDateForAPI(dateFrom),
      dateTo: formatDateForAPI(dateTo)
    }));

    setDateRangeType(rangeType);
  }, []);

  // Get array of status options
  const statusOptions = useMemo(() => [
    { value: RecordStatus.DRAFT, label: 'Nháp' },
    { value: RecordStatus.PENDING, label: 'Chờ duyệt' },
    { value: RecordStatus.CONFIRMED, label: 'Đã duyệt' },
    { value: RecordStatus.REJECTED, label: 'Từ chối' },
  ], []);

  // Get array of shift type options
  const shiftTypeOptions = useMemo(() => [
    { value: ShiftType.REGULAR, label: 'Ca thường' },
    { value: ShiftType.EXTENDED, label: 'Ca kéo dài' },
    { value: ShiftType.OVERTIME, label: 'Ca tăng ca' },
  ], []);

  // Get date range options
  const dateRangeOptions = useMemo(() => [
    { value: DATE_RANGES.TODAY, label: 'Hôm nay' },
    { value: DATE_RANGES.YESTERDAY, label: 'Hôm qua' },
    { value: DATE_RANGES.LAST_7_DAYS, label: '7 ngày qua' },
    { value: DATE_RANGES.LAST_30_DAYS, label: '30 ngày qua' },
    { value: DATE_RANGES.THIS_MONTH, label: 'Tháng này' },
    { value: DATE_RANGES.LAST_MONTH, label: 'Tháng trước' },
    { value: DATE_RANGES.CUSTOM, label: 'Tùy chỉnh' },
  ], []);

  return {
    // Current state
    filters,
    dateRangeType,
    
    // Actions
    updateFilter,
    resetFilters,
    setDateRange,
    setFilters,
    
    // Options for UI
    statusOptions,
    shiftTypeOptions,
    dateRangeOptions,
    
    // Constants
    DATE_RANGES,
  };
};