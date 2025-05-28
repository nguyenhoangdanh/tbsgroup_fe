// src/hooks/digital-form/useDigitalFormQueries.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { DigitalFormConditions } from '@/common/types/digital-form-dto';
import { PaginationParams } from '@/lib/api/api';
import digitalFormApi from '@/services/api/digitalFormApi';

// Query keys for caching and invalidation
export const digitalFormKeys = {
  all: ['digitalForms'] as const,
  lists: () => [...digitalFormKeys.all, 'list'] as const,
  list: (filters: DigitalFormConditions, pagination: PaginationParams) =>
    [...digitalFormKeys.lists(), filters, pagination] as const,
  details: () => [...digitalFormKeys.all, 'detail'] as const,
  detail: (id: string) => [...digitalFormKeys.details(), id] as const,
  detailWithEntries: (id: string) => [...digitalFormKeys.detail(id), 'entries'] as const,
  printVersion: (id: string) => [...digitalFormKeys.detail(id), 'print'] as const,
  reports: () => [...digitalFormKeys.all, 'reports'] as const,
  factoryReport: (factoryId: string, dateFrom: string, dateTo: string) =>
    [...digitalFormKeys.reports(), 'factory', factoryId, dateFrom, dateTo] as const,
  lineReport: (lineId: string, dateFrom: string, dateTo: string) =>
    [...digitalFormKeys.reports(), 'line', lineId, dateFrom, dateTo] as const,
  teamReport: (teamId: string, dateFrom: string, dateTo: string) =>
    [...digitalFormKeys.reports(), 'team', teamId, dateFrom, dateTo] as const,
  groupReport: (groupId: string, dateFrom: string, dateTo: string) =>
    [...digitalFormKeys.reports(), 'group', groupId, dateFrom, dateTo] as const,
  comparisonReport: (
    lineId: string,
    entityIds: string[],
    compareBy: 'team' | 'group',
    dateFrom: string,
    dateTo: string,
  ) =>
    [
      ...digitalFormKeys.reports(),
      'comparison',
      lineId,
      entityIds,
      compareBy,
      dateFrom,
      dateTo,
    ] as const,
  stats: (period: string) => [...digitalFormKeys.all, 'stats', period] as const,
};

/**
 * Custom hook creator for form query
 */
export const createFormQuery = (id: string | undefined, options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: id ? digitalFormKeys.detail(id) : ['digitalForm', 'empty'],
    queryFn: async () => {
      if (!id) return null;
      const response = await digitalFormApi.getDigitalForm(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch form');
      }
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Custom hook creator for form with entries query
 */
export const createFormWithEntriesQuery = (
  id: string | undefined,
  options: Record<string, unknown> = {},
) => {
  return useQuery({
    queryKey: id ? digitalFormKeys.detailWithEntries(id) : ['digitalForm', 'entries', 'empty'],
    queryFn: async () => {
      if (!id) return null;
      const response = await digitalFormApi.getDigitalFormWithEntries(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch form with entries');
      }
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Custom hook creator for print version query
 */
export const createPrintVersionQuery = (
  id: string | undefined,
  options: Record<string, unknown> = {},
) => {
  return useQuery({
    queryKey: id ? digitalFormKeys.printVersion(id) : ['digitalForm', 'print', 'empty'],
    queryFn: async () => {
      if (!id) return null;
      const response = await digitalFormApi.getPrintableDigitalForm(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch printable form');
      }
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Custom hook creator for forms list query
 */
export const createListFormsQuery = (
  conditions?: DigitalFormConditions,
  pagination?: PaginationParams,
  options: Record<string, unknown> = {},
) => {
  return useQuery({
    queryKey: digitalFormKeys.list(conditions || {}, pagination || {}),
    queryFn: async () => {
      const response = await digitalFormApi.listDigitalForms(conditions || {}, pagination || {});
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch forms list');
      }
      return response;
    },
    ...options,
  });
};

/**
 * Custom hook creator for form stats query
 */
export const createFormStatsQuery = (
  period: 'day' | 'week' | 'month' | 'year',
  options: Record<string, unknown> = {},
) => {
  return useQuery({
    queryKey: digitalFormKeys.stats(period),
    queryFn: async () => {
      const response = await digitalFormApi.getFormStats(period);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch form statistics');
      }
      return response.data;
    },
    ...options,
  });
};

/**
 * Custom hook creator for factory report query
 */
export const createFactoryReportQuery = (
  factoryId: string,
  dateFrom: string,
  dateTo: string,
  options?: {
    includeLines?: boolean;
    includeTeams?: boolean;
    includeGroups?: boolean;
    groupByBag?: boolean;
    groupByProcess?: boolean;
  },
  queryOptions: Record<string, unknown> = {},
) => {
  return useQuery({
    queryKey: digitalFormKeys.factoryReport(factoryId, dateFrom, dateTo),
    queryFn: async () => {
      const response = await digitalFormApi.getFactoryReport(factoryId, dateFrom, dateTo, options);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch factory report');
      }
      return response.data;
    },
    ...queryOptions,
  });
};

/**
 * Custom hook creator for line report query
 */
export const createLineReportQuery = (
  lineId: string,
  dateFrom: string,
  dateTo: string,
  options?: {
    includeTeams?: boolean;
    includeGroups?: boolean;
    groupByBag?: boolean;
    groupByProcess?: boolean;
  },
  queryOptions: Record<string, unknown> = {},
) => {
  return useQuery({
    queryKey: digitalFormKeys.lineReport(lineId, dateFrom, dateTo),
    queryFn: async () => {
      const response = await digitalFormApi.getLineReport(lineId, dateFrom, dateTo, options);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch line report');
      }
      return response.data;
    },
    ...queryOptions,
  });
};

/**
 * Custom hook creator for team report query
 */
export const createTeamReportQuery = (
  teamId: string,
  dateFrom: string,
  dateTo: string,
  options?: {
    includeGroups?: boolean;
    includeWorkers?: boolean;
    groupByBag?: boolean;
    groupByProcess?: boolean;
  },
  queryOptions: Record<string, unknown> = {},
) => {
  return useQuery({
    queryKey: digitalFormKeys.teamReport(teamId, dateFrom, dateTo),
    queryFn: async () => {
      const response = await digitalFormApi.getTeamReport(teamId, dateFrom, dateTo, options);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch team report');
      }
      return response.data;
    },
    ...queryOptions,
  });
};

/**
 * Custom hook creator for group report query
 */
export const createGroupReportQuery = (
  groupId: string,
  dateFrom: string,
  dateTo: string,
  options?: {
    includeWorkers?: boolean;
    detailedAttendance?: boolean;
    groupByBag?: boolean;
    groupByProcess?: boolean;
  },
  queryOptions: Record<string, unknown> = {},
) => {
  return useQuery({
    queryKey: digitalFormKeys.groupReport(groupId, dateFrom, dateTo),
    queryFn: async () => {
      const response = await digitalFormApi.getGroupReport(groupId, dateFrom, dateTo, options);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch group report');
      }
      return response.data;
    },
    ...queryOptions,
  });
};

/**
 * Custom hook creator for comparison report query
 */
export const createComparisonReportQuery = (
  lineId: string,
  entityIds: string[],
  compareBy: 'team' | 'group',
  dateFrom: string,
  dateTo: string,
  options?: {
    includeHandBags?: boolean;
    includeProcesses?: boolean;
    includeTimeSeries?: boolean;
  },
  queryOptions: Record<string, unknown> = {},
) => {
  return useQuery({
    queryKey: digitalFormKeys.comparisonReport(lineId, entityIds, compareBy, dateFrom, dateTo),
    queryFn: async () => {
      const response = await digitalFormApi.getComparisonReport(
        lineId,
        entityIds,
        compareBy,
        dateFrom,
        dateTo,
        options,
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch comparison report');
      }
      return response.data;
    },
    ...queryOptions,
  });
};

/**
 * React Query hook for digital form read operations
 * Provides optimized data fetching with caching and refetching
 */
export const useDigitalFormQueries = () => {
  const queryClient = useQueryClient();

  // Invalidate form queries (used after mutations)
  const invalidateFormQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: digitalFormKeys.all });
  };

  // Preload form details for better UX
  const preloadFormDetails = async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: digitalFormKeys.detail(id),
      queryFn: async () => {
        const response = await digitalFormApi.getDigitalForm(id);
        if (!response.success) {
          throw new Error(response.message || 'Failed to prefetch form');
        }
        return response.data;
      },
    });

    await queryClient.prefetchQuery({
      queryKey: digitalFormKeys.detailWithEntries(id),
      queryFn: async () => {
        const response = await digitalFormApi.getDigitalFormWithEntries(id);
        if (!response.success) {
          throw new Error(response.message || 'Failed to prefetch form with entries');
        }
        return response.data;
      },
    });
  };

  return {
    // Exported query creators for components to use
    createFormQuery,
    createFormWithEntriesQuery,
    createPrintVersionQuery,
    createListFormsQuery,
    createFormStatsQuery,
    createFactoryReportQuery,
    createLineReportQuery,
    createTeamReportQuery,
    createGroupReportQuery,
    createComparisonReportQuery,

    // Utility functions
    invalidateFormQueries,
    preloadFormDetails,
  };
};

export default useDigitalFormQueries;
