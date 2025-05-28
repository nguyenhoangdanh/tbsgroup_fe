import {
  DigitalForm,
  DigitalFormWithEntries,
  FactoryProductionReport,
  LineProductionReport,
  TeamProductionReport,
  GroupProductionReport,
  ProductionComparisonReport,
  ShiftType,
  AttendanceStatus,
} from '../../common/types/digital-form';
import {
  DigitalFormConditions,
  DigitalFormCreateRequest,
  DigitalFormUpdateRequest,
  DigitalFormEntryRequest,
  FormEntryUpdateRequest,
  DigitalFormSubmitRequest,
  ExportReportRequest,
} from '../../common/types/digital-form-dto';
import {
  api,
  ApiResponse,
  CreateResponse,
  ExportResponse,
  ListApiResponse,
  PaginationParams,
} from '../../lib/api/api';

// Base API path for digital form module
const BASE_PATH = '/api/digital-forms';

/**
 * Utility to convert query parameters to URL string
 */
const toQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle array values
        value.forEach(item => searchParams.append(`${key}[]`, String(item)));
      } else if (typeof value === 'boolean') {
        // Convert boolean to string
        searchParams.append(key, value ? 'true' : 'false');
      } else {
        // Convert other values to string
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * API service for digital forms
 */
export const digitalFormApi = {
  /**
   * Create new digital form
   */
  createDigitalForm: async (
    data: DigitalFormCreateRequest,
  ): Promise<ApiResponse<CreateResponse>> => {
    return api.post(BASE_PATH, data);
  },

  /**
   * Create digital form for a specific worker
   */
  createDigitalFormForWorker: async (workerId: string): Promise<ApiResponse<CreateResponse>> => {
    return api.post(`${BASE_PATH}/worker/${workerId}`, {});
  },

  /**
   * Generate daily digital forms (admin function)
   */
  generateDailyForms: async (data?: {
    handBagId?: string;
    bagProcessId?: string;
    bagColorId?: string;
  }): Promise<ApiResponse<void>> => {
    return api.post(`${BASE_PATH}/generate-daily`, data || {});
  },

  /**
   * Get digital form by id
   */
  getDigitalForm: async (id: string): Promise<ApiResponse<DigitalForm>> => {
    return api.get(`${BASE_PATH}/${id}`);
  },

  /**
   * Get digital form with entries
   */
  getDigitalFormWithEntries: async (id: string): Promise<ApiResponse<DigitalFormWithEntries>> => {
    return api.get(`${BASE_PATH}/${id}/entries`);
  },

  /**
   * Get printable digital form
   */
  getPrintableDigitalForm: async (id: string): Promise<ApiResponse<DigitalFormWithEntries>> => {
    return api.get(`${BASE_PATH}/${id}/print`);
  },

  /**
   * List digital forms with filtering and pagination
   */
  listDigitalForms: async (
    conditions: DigitalFormConditions = {},
    pagination: PaginationParams = {},
  ): Promise<ListApiResponse<DigitalForm>> => {
    const queryParams = {
      ...conditions,
      ...pagination,
    };

    const queryString = toQueryString(queryParams);
    return api.get(`${BASE_PATH}${queryString}`);
  },

  /**
   * Update digital form
   */
  updateDigitalForm: async (
    id: string,
    data: DigitalFormUpdateRequest,
  ): Promise<ApiResponse<void>> => {
    return api.patch(`${BASE_PATH}/${id}`, data);
  },

  /**
   * Delete digital form
   */
  deleteDigitalForm: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`${BASE_PATH}/${id}`);
  },

  /**
   * Add entry to a digital form
   */
  addFormEntry: async (
    formId: string,
    data: DigitalFormEntryRequest,
  ): Promise<ApiResponse<CreateResponse>> => {
    return api.post(`${BASE_PATH}/${formId}/entries`, data);
  },

  /**
   * Add multiple entries to a form at once
   */
  addBulkEntries: async (
    formId: string,
    entries: Array<{
      handBagId: string;
      bagColorId: string;
      processId: string;
      plannedOutput: number;
    }>,
  ): Promise<ApiResponse<{ formId: string; entries: { id: string }[] }>> => {
    return api.post(`${BASE_PATH}/${formId}/bulk-entries`, { entries });
  },

  /**
   * Update entry in a digital form
   */
  updateEntry: async (
    formId: string,
    entryId: string,
    data: FormEntryUpdateRequest,
  ): Promise<ApiResponse<void>> => {
    return api.patch(`${BASE_PATH}/${formId}/entries/${entryId}`, data);
  },

  /**
   * Update hourly data for an entry
   */
  updateEntryHourlyData: async (
    formId: string,
    entryId: string,
    data: {
      handBagId: string;
      bagColorId: string;
      processId: string;
      hourlyData: Record<string, number>;
    },
  ): Promise<ApiResponse<void>> => {
    return api.patch(`${BASE_PATH}/${formId}/entries/${entryId}/hourly-data`, data);
  },

  /**
   * Update attendance status for an entry
   */
  updateEntryAttendance: async (
    formId: string,
    entryId: string,
    data: {
      handBagId: string;
      bagColorId: string;
      processId: string;
      attendanceStatus: AttendanceStatus;
      attendanceNote?: string;
    },
  ): Promise<ApiResponse<void>> => {
    return api.patch(`${BASE_PATH}/${formId}/entries/${entryId}/attendance`, data);
  },

  /**
   * Update shift type for an entry
   */
  updateEntryShiftType: async (
    formId: string,
    entryId: string,
    shiftType: ShiftType,
  ): Promise<ApiResponse<void>> => {
    return api.patch(`${BASE_PATH}/${formId}/entries/${entryId}/shift-type`, { shiftType });
  },

  /**
   * Delete entry from a digital form
   */
  deleteFormEntry: async (formId: string, entryId: string): Promise<ApiResponse<void>> => {
    return api.delete(`${BASE_PATH}/${formId}/entries/${entryId}`);
  },

  /**
   * Submit digital form for approval
   */
  submitDigitalForm: async (
    id: string,
    data: DigitalFormSubmitRequest = {},
  ): Promise<ApiResponse<void>> => {
    return api.post(`${BASE_PATH}/${id}/submit`, data);
  },

  /**
   * Approve digital form
   */
  approveDigitalForm: async (id: string): Promise<ApiResponse<void>> => {
    return api.post(`${BASE_PATH}/${id}/approve`, {});
  },

  /**
   * Reject digital form
   */
  rejectDigitalForm: async (id: string): Promise<ApiResponse<void>> => {
    return api.post(`${BASE_PATH}/${id}/reject`, {});
  },

  /**
   * REPORT ENDPOINTS
   */

  /**
   * Get factory production report
   */
  getFactoryReport: async (
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
  ): Promise<ApiResponse<FactoryProductionReport>> => {
    const queryParams = {
      dateFrom,
      dateTo,
      ...options,
    };

    const queryString = toQueryString(queryParams);
    return api.get(`${BASE_PATH}/reports/factory/${factoryId}${queryString}`);
  },

  /**
   * Get line production report
   */
  getLineReport: async (
    lineId: string,
    dateFrom: string,
    dateTo: string,
    options: {
      includeTeams?: boolean;
      includeGroups?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    } = {},
  ): Promise<ApiResponse<LineProductionReport>> => {
    const queryParams = {
      dateFrom,
      dateTo,
      ...options,
    };

    const queryString = toQueryString(queryParams);
    return api.get(`${BASE_PATH}/reports/line/${lineId}${queryString}`);
  },

  /**
   * Get team production report
   */
  getTeamReport: async (
    teamId: string,
    dateFrom: string,
    dateTo: string,
    options: {
      includeGroups?: boolean;
      includeWorkers?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    } = {},
  ): Promise<ApiResponse<TeamProductionReport>> => {
    const queryParams = {
      dateFrom,
      dateTo,
      ...options,
    };

    const queryString = toQueryString(queryParams);
    return api.get(`${BASE_PATH}/reports/team/${teamId}${queryString}`);
  },

  /**
   * Get group production report
   */
  getGroupReport: async (
    groupId: string,
    dateFrom: string,
    dateTo: string,
    options: {
      includeWorkers?: boolean;
      detailedAttendance?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    } = {},
  ): Promise<ApiResponse<GroupProductionReport>> => {
    const queryParams = {
      dateFrom,
      dateTo,
      ...options,
    };

    const queryString = toQueryString(queryParams);
    return api.get(`${BASE_PATH}/reports/group/${groupId}${queryString}`);
  },

  /**
   * Get comparison production report
   */
  getComparisonReport: async (
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
  ): Promise<ApiResponse<ProductionComparisonReport>> => {
    const queryParams = {
      lineId,
      entityIds: entityIds.join(','),
      compareBy,
      dateFrom,
      dateTo,
      ...options,
    };

    const queryString = toQueryString(queryParams);
    return api.get(`${BASE_PATH}/reports/comparison${queryString}`);
  },

  /**
   * Export a production report
   */
  exportProductionReport: async (
    reportType: 'team' | 'group' | 'comparison' | 'factory' | 'line',
    parameters: any,
    format: 'pdf' | 'excel' | 'csv',
  ): Promise<ApiResponse<ExportResponse>> => {
    const data: ExportReportRequest = {
      reportType,
      parameters,
      format,
    };
    return api.post(`${BASE_PATH}/reports/export`, data);
  },

  /**
   * Export forms to Excel
   */
  exportFormsToExcel: async (formIds: string[]): Promise<ApiResponse<ExportResponse>> => {
    return api.post(`${BASE_PATH}/export`, { formIds });
  },

  /**
   * Get digital form statistics by period
   */
  getFormStats: async (period: 'day' | 'week' | 'month' | 'year'): Promise<ApiResponse<any>> => {
    return api.get(`${BASE_PATH}/stats?period=${period}`);
  },
};

// Export as default for compatibility
export default digitalFormApi;
