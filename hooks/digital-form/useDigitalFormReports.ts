// src/hooks/digital-form/useDigitalFormReports.ts
'use client';
import { useState } from 'react';

import { useDigitalFormQueries } from './useDigitalFormQueries';

import digitalFormApi from '@/services/api/digitalFormApi';

export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this-week',
  LAST_WEEK: 'last-week',
  THIS_MONTH: 'this-month',
  LAST_MONTH: 'last-month',
  LAST_30_DAYS: 'last-30-days',
  LAST_90_DAYS: 'last-90-days',
  THIS_YEAR: 'this-year',
  CUSTOM: 'custom',
};

// Type for date range
interface DateRange {
  from: string;
  to: string;
}

// Type for report parameters
interface ReportParams {
  dateRange: DateRange;
  [key: string]: unknown;
}

/**
 * Hook for digital form reports
 * Provides utilities for generating and exporting reports
 */
export const useDigitalFormReports = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queries = useDigitalFormQueries();

  /**
   * Get date range based on predefined range type
   */
  const getDateRange = (rangeType: string): DateRange => {
    const today = new Date();
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    switch (rangeType) {
      case DATE_RANGES.TODAY:
        return {
          from: formatDate(today),
          to: formatDate(today),
        };
      case DATE_RANGES.YESTERDAY: {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          from: formatDate(yesterday),
          to: formatDate(yesterday),
        };
      }
      case DATE_RANGES.THIS_WEEK: {
        const currentDay = today.getDay();
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust for Sunday
        const startOfWeek = new Date(today);
        startOfWeek.setDate(diff);
        return {
          from: formatDate(startOfWeek),
          to: formatDate(today),
        };
      }
      case DATE_RANGES.LAST_WEEK: {
        const currentDay = today.getDay();
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust for Sunday
        const startOfThisWeek = new Date(today);
        startOfThisWeek.setDate(diff);
        const endOfLastWeek = new Date(startOfThisWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
        const startOfLastWeek = new Date(endOfLastWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 6);
        return {
          from: formatDate(startOfLastWeek),
          to: formatDate(endOfLastWeek),
        };
      }
      case DATE_RANGES.THIS_MONTH: {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          from: formatDate(startOfMonth),
          to: formatDate(today),
        };
      }
      case DATE_RANGES.LAST_MONTH: {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          from: formatDate(startOfLastMonth),
          to: formatDate(endOfLastMonth),
        };
      }
      case DATE_RANGES.LAST_30_DAYS: {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return {
          from: formatDate(thirtyDaysAgo),
          to: formatDate(today),
        };
      }
      case DATE_RANGES.LAST_90_DAYS: {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);
        return {
          from: formatDate(ninetyDaysAgo),
          to: formatDate(today),
        };
      }
      case DATE_RANGES.THIS_YEAR: {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return {
          from: formatDate(startOfYear),
          to: formatDate(today),
        };
      }
      default:
        return {
          from: formatDate(today),
          to: formatDate(today),
        };
    }
  };

  /**
   * Export factory report
   */
  const exportFactoryReport = async (
    factoryId: string,
    dateRange: DateRange | string,
    format: 'pdf' | 'excel' | 'csv',
    options?: {
      includeLines?: boolean;
      includeTeams?: boolean;
      includeGroups?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    },
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // If dateRange is a string, get the actual date range
      const actualDateRange = typeof dateRange === 'string' ? getDateRange(dateRange) : dateRange;

      const result = await digitalFormApi.exportProductionReport(
        'factory',
        {
          factoryId,
          dateFrom: actualDateRange.from,
          dateTo: actualDateRange.to,
          ...options,
        },
        format,
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to export factory report');
      }

      // Invalidate queries so next fetch gets updated data
      await queries.invalidateFormQueries();

      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export line report
   */
  const exportLineReport = async (
    lineId: string,
    dateRange: DateRange | string,
    format: 'pdf' | 'excel' | 'csv',
    options?: {
      includeTeams?: boolean;
      includeGroups?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    },
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // If dateRange is a string, get the actual date range
      const actualDateRange = typeof dateRange === 'string' ? getDateRange(dateRange) : dateRange;

      const result = await digitalFormApi.exportProductionReport(
        'line',
        {
          lineId,
          dateFrom: actualDateRange.from,
          dateTo: actualDateRange.to,
          ...options,
        },
        format,
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to export line report');
      }

      // Invalidate queries so next fetch gets updated data
      await queries.invalidateFormQueries();

      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export team report
   */
  const exportTeamReport = async (
    teamId: string,
    dateRange: DateRange | string,
    format: 'pdf' | 'excel' | 'csv',
    options?: {
      includeGroups?: boolean;
      includeWorkers?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    },
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // If dateRange is a string, get the actual date range
      const actualDateRange = typeof dateRange === 'string' ? getDateRange(dateRange) : dateRange;

      const result = await digitalFormApi.exportProductionReport(
        'team',
        {
          teamId,
          dateFrom: actualDateRange.from,
          dateTo: actualDateRange.to,
          ...options,
        },
        format,
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to export team report');
      }

      // Invalidate queries so next fetch gets updated data
      await queries.invalidateFormQueries();

      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export group report
   */
  const exportGroupReport = async (
    groupId: string,
    dateRange: DateRange | string,
    format: 'pdf' | 'excel' | 'csv',
    options?: {
      includeWorkers?: boolean;
      detailedAttendance?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    },
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // If dateRange is a string, get the actual date range
      const actualDateRange = typeof dateRange === 'string' ? getDateRange(dateRange) : dateRange;

      const result = await digitalFormApi.exportProductionReport(
        'group',
        {
          groupId,
          dateFrom: actualDateRange.from,
          dateTo: actualDateRange.to,
          ...options,
        },
        format,
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to export group report');
      }

      // Invalidate queries so next fetch gets updated data
      await queries.invalidateFormQueries();

      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export comparison report
   */
  const exportComparisonReport = async (
    lineId: string,
    entityIds: string[],
    compareBy: 'team' | 'group',
    dateRange: DateRange | string,
    format: 'pdf' | 'excel' | 'csv',
    options?: {
      includeHandBags?: boolean;
      includeProcesses?: boolean;
      includeTimeSeries?: boolean;
    },
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // If dateRange is a string, get the actual date range
      const actualDateRange = typeof dateRange === 'string' ? getDateRange(dateRange) : dateRange;

      const result = await digitalFormApi.exportProductionReport(
        'comparison',
        {
          lineId,
          entityIds,
          compareBy,
          dateFrom: actualDateRange.from,
          dateTo: actualDateRange.to,
          ...options,
        },
        format,
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to export comparison report');
      }

      // Invalidate queries so next fetch gets updated data
      await queries.invalidateFormQueries();

      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Date ranges
    DATE_RANGES,
    getDateRange,

    // Export functions
    exportFactoryReport,
    exportLineReport,
    exportTeamReport,
    exportGroupReport,
    exportComparisonReport,

    // State
    isLoading,
    error,
  };
};

export default useDigitalFormReports;
