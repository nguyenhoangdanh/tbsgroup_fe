import {
  FactoryProductionReport,
  LineProductionReport,
  TeamProductionReport,
  GroupProductionReport,
  ProductionComparisonReport,
} from '@/common/types/digital-form';
import { fetchWithAuth } from '@/lib/fetcher';

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Report Service for handling all report-related API calls
 * Separated from DigitalFormService to maintain single responsibility principle
 */
export const ReportService = {
  /**
   * Get factory production report
   */
  async getFactoryReport(
    factoryId: string,
    dateFrom: string,
    dateTo: string,
    options: {
      includeLines?: boolean;
      includeTeams?: boolean;
      includeGroups?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    } = {},
  ): Promise<ApiResponse<FactoryProductionReport>> {
    try {
      const queryParams = new URLSearchParams({
        dateFrom,
        dateTo,
      });

      // Add boolean params only if they're specified
      if (options.includeLines !== undefined)
        queryParams.append('includeLines', options.includeLines.toString());
      if (options.includeTeams !== undefined)
        queryParams.append('includeTeams', options.includeTeams.toString());
      if (options.includeGroups !== undefined)
        queryParams.append('includeGroups', options.includeGroups.toString());
      if (options.groupByBag !== undefined)
        queryParams.append('groupByBag', options.groupByBag.toString());
      if (options.groupByProcess !== undefined)
        queryParams.append('groupByProcess', options.groupByProcess.toString());

      const response = await fetchWithAuth(
        `/digital-forms/reports/factory/${factoryId}?${queryParams.toString()}`,
      );

      if (!response.success) {
        throw new Error(
          String(response.error) || `Failed to fetch factory report for ${factoryId}`,
        );
      }

      return response as ApiResponse<FactoryProductionReport>;
    } catch (error) {
      console.error(`Error fetching factory report for ${factoryId}:`, error);
      return {
        success: false,
        data: null as unknown as FactoryProductionReport,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Get line production report
   */
  async getLineReport(
    lineId: string,
    dateFrom: string,
    dateTo: string,
    options: {
      includeTeams?: boolean;
      includeGroups?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    } = {},
  ): Promise<ApiResponse<LineProductionReport>> {
    try {
      const queryParams = new URLSearchParams({
        dateFrom,
        dateTo,
      });

      if (options.includeTeams !== undefined)
        queryParams.append('includeTeams', options.includeTeams.toString());
      if (options.includeGroups !== undefined)
        queryParams.append('includeGroups', options.includeGroups.toString());
      if (options.groupByBag !== undefined)
        queryParams.append('groupByBag', options.groupByBag.toString());
      if (options.groupByProcess !== undefined)
        queryParams.append('groupByProcess', options.groupByProcess.toString());

      const response = await fetchWithAuth(
        `/digital-forms/reports/line/${lineId}?${queryParams.toString()}`,
      );

      if (!response.success) {
        throw new Error(String(response.error) || `Failed to fetch line report for ${lineId}`);
      }

      return response as ApiResponse<LineProductionReport>;
    } catch (error) {
      console.error(`Error fetching line report for ${lineId}:`, error);
      return {
        success: false,
        data: null as unknown as LineProductionReport,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Get team production report
   */
  async getTeamReport(
    teamId: string,
    dateFrom: string,
    dateTo: string,
    options: {
      includeGroups?: boolean;
      includeWorkers?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    } = {},
  ): Promise<ApiResponse<TeamProductionReport>> {
    try {
      const queryParams = new URLSearchParams({
        dateFrom,
        dateTo,
      });

      if (options.includeGroups !== undefined)
        queryParams.append('includeGroups', options.includeGroups.toString());
      if (options.includeWorkers !== undefined)
        queryParams.append('includeWorkers', options.includeWorkers.toString());
      if (options.groupByBag !== undefined)
        queryParams.append('groupByBag', options.groupByBag.toString());
      if (options.groupByProcess !== undefined)
        queryParams.append('groupByProcess', options.groupByProcess.toString());

      const response = await fetchWithAuth(
        `/digital-forms/reports/team/${teamId}?${queryParams.toString()}`,
      );

      if (!response.success) {
        throw new Error(String(response.error) || `Failed to fetch team report for ${teamId}`);
      }

      return response as ApiResponse<TeamProductionReport>;
    } catch (error) {
      console.error(`Error fetching team report for ${teamId}:`, error);
      return {
        success: false,
        data: null as unknown as TeamProductionReport,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Get group production report
   */
  async getGroupReport(
    groupId: string,
    dateFrom: string,
    dateTo: string,
    options: {
      includeWorkers?: boolean;
      detailedAttendance?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    } = {},
  ): Promise<ApiResponse<GroupProductionReport>> {
    try {
      const queryParams = new URLSearchParams({
        dateFrom,
        dateTo,
      });

      if (options.includeWorkers !== undefined)
        queryParams.append('includeWorkers', options.includeWorkers.toString());
      if (options.detailedAttendance !== undefined)
        queryParams.append('detailedAttendance', options.detailedAttendance.toString());
      if (options.groupByBag !== undefined)
        queryParams.append('groupByBag', options.groupByBag.toString());
      if (options.groupByProcess !== undefined)
        queryParams.append('groupByProcess', options.groupByProcess.toString());

      const response = await fetchWithAuth(
        `/digital-forms/reports/group/${groupId}?${queryParams.toString()}`,
      );

      if (!response.success) {
        throw new Error(String(response.error) || `Failed to fetch group report for ${groupId}`);
      }

      return response as ApiResponse<GroupProductionReport>;
    } catch (error) {
      console.error(`Error fetching group report for ${groupId}:`, error);
      return {
        success: false,
        data: null as unknown as GroupProductionReport,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Get comparison report
   */
  async getComparisonReport(
    lineId: string,
    entityIds: string[],
    compareBy: 'team' | 'group',
    dateFrom: string,
    dateTo: string,
    options: {
      includeHandBags?: boolean;
      includeProcesses?: boolean;
      includeTimeSeries?: boolean;
    } = {},
  ): Promise<ApiResponse<ProductionComparisonReport>> {
    try {
      const queryParams = new URLSearchParams({
        lineId,
        entityIds: entityIds.join(','),
        compareBy,
        dateFrom,
        dateTo,
      });

      if (options.includeHandBags !== undefined)
        queryParams.append('includeHandBags', options.includeHandBags.toString());
      if (options.includeProcesses !== undefined)
        queryParams.append('includeProcesses', options.includeProcesses.toString());
      if (options.includeTimeSeries !== undefined)
        queryParams.append('includeTimeSeries', options.includeTimeSeries.toString());

      const response = await fetchWithAuth(
        `/digital-forms/reports/comparison?${queryParams.toString()}`,
      );

      if (!response.success) {
        throw new Error(String(response.error) || 'Failed to fetch comparison report');
      }

      return response as ApiResponse<ProductionComparisonReport>;
    } catch (error) {
      console.error('Error fetching comparison report:', error);
      return {
        success: false,
        data: null as unknown as ProductionComparisonReport,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Export production report to a file
   */
  async exportReport(
    reportType: 'team' | 'group' | 'comparison',
    parameters: any,
    format: 'pdf' | 'excel' | 'csv',
  ): Promise<ApiResponse<{ fileUrl: string }>> {
    try {
      const response = await fetchWithAuth('/digital-forms/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType,
          parameters,
          format,
        }),
      });

      if (!response.success) {
        throw new Error(String(response.error) || 'Failed to export report');
      }

      return response as ApiResponse<{ fileUrl: string }>;
    } catch (error) {
      console.error('Error exporting report:', error);
      return {
        success: false,
        data: { fileUrl: '' },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Fetch factory list for reports
   */
  async getFactories(): Promise<ApiResponse<Array<{ id: string; name: string; code: string }>>> {
    try {
      const response = await fetchWithAuth('/factories');

      if (!response.success) {
        throw new Error(String(response.error) || 'Failed to fetch factories list');
      }

      return response as ApiResponse<Array<{ id: string; name: string; code: string }>>;
    } catch (error) {
      console.error('Error fetching factories:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Fetch lines list for reports
   */
  async getLines(
    factoryId?: string,
  ): Promise<ApiResponse<Array<{ id: string; name: string; code: string }>>> {
    try {
      const url = factoryId ? `/lines?factoryId=${factoryId}` : '/lines';
      const response = (await fetchWithAuth(url)) as ApiResponse<
        Array<{ id: string; name: string; code: string }>
      >;

      if (!response.success) {
        throw new Error(String(response.error) || 'Failed to fetch lines list');
      }

      return response as ApiResponse<Array<{ id: string; name: string; code: string }>>;
    } catch (error) {
      console.error('Error fetching lines:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Fetch teams list for reports
   */
  async getTeams(
    lineId?: string,
  ): Promise<ApiResponse<Array<{ id: string; name: string; code: string }>>> {
    try {
      const url = lineId ? `/teams?lineId=${lineId}` : '/teams';
      const response = await fetchWithAuth(url);

      if (!response.success) {
        throw new Error(String(response.error) || 'Failed to fetch teams list');
      }

      return response as ApiResponse<Array<{ id: string; name: string; code: string }>>;
    } catch (error) {
      console.error('Error fetching teams:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Fetch groups list for reports
   */
  async getGroups(
    teamId?: string,
  ): Promise<ApiResponse<Array<{ id: string; name: string; code: string }>>> {
    try {
      const url = teamId ? `/groups?teamId=${teamId}` : '/groups';
      const response = await fetchWithAuth(url);

      if (!response.success) {
        throw new Error(String(response.error) || 'Failed to fetch groups list');
      }

      return response as ApiResponse<Array<{ id: string; name: string; code: string }>>;
    } catch (error) {
      console.error('Error fetching groups:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Fetch line groups for comparison reports
   */
  async getLineGroups(lineId: string): Promise<
    ApiResponse<
      Array<{
        id: string;
        name: string;
        code: string;
        teamId: string;
        teamName: string;
      }>
    >
  > {
    try {
      const response = (await fetchWithAuth(`/lines/${lineId}/groups`)) as ApiResponse<
        Array<{
          id: string;
          name: string;
          code: string;
          teamId: string;
          teamName: string;
        }>
      >;

      if (!response.success) {
        throw new Error(String(response.error) || `Failed to fetch groups for line ${lineId}`);
      }

      return response;
    } catch (error) {
      console.error(`Error fetching groups for line ${lineId}:`, error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
