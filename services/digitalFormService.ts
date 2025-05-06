// services/digitalFormService.ts
import { fetchWithAuth } from '@/lib/fetcher';
import { 
  DigitalForm, 
  DigitalFormEntry,
  AttendanceStatus,
  RecordStatus,
  ShiftType,
  ProductionIssueType,
  FactoryProductionReport,
  LineProductionReport,
  TeamProductionReport,
  GroupProductionReport,
  ProductionComparisonReport
} from '@/common/types/digital-form';

import { 
  TDigitalFormCreate, 
  TDigitalFormUpdate, 
  TDigitalFormSubmit, 
  TDigitalFormEntry,
  TUpdateFormEntry,
  TDigitalFormCond,
  TPaginationParams,
  TShiftTypeFormEntry
} from '@/schemas/digital-form.schema';

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ListApiResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Digital Form Service with optimized API calls and better error handling
 * Optimized for high performance with 5000+ users
 */
export const DigitalFormService = {
  /**
   * List forms with filtering and pagination
   */
  async listForms(params: TDigitalFormCond & TPaginationParams): Promise<ListApiResponse<DigitalForm>> {
    try {
      const queryParams = new URLSearchParams();

      
      // Ensure we only add parameters that exist and have values
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const fullUrl = `/digital-forms?${queryParams.toString()}`;
      
      const response = await fetchWithAuth(fullUrl);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch digital forms list');
      }
      
      return response as ListApiResponse<DigitalForm>;
    } catch (error) {
      console.error('Error fetching digital forms list:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 10,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  /**
   * Get a form by ID
   */
  async getForm(id: string): Promise<ApiResponse<DigitalForm>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${id}`);
      
      if (!response.success) {
        throw new Error(response.error || `Failed to fetch form with ID: ${id}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching digital form ${id}:`, error);
      return {
        success: false,
        data: null as unknown as DigitalForm,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  /**
   * Get a form with all entries
   */
  async getFormWithEntries(id: string): Promise<ApiResponse<{form: DigitalForm; entries: DigitalFormEntry[]}>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${id}/entries`);
      
      if (!response.success) {
        throw new Error(response.error || `Failed to fetch form with entries for ID: ${id}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching digital form with entries ${id}:`, error);
      return {
        success: false,
        data: { form: null as unknown as DigitalForm, entries: [] },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  /**
   * Create a new form
   */
  async createForm(data: TDigitalFormCreate): Promise<ApiResponse<{id: string}>> {
    try {
      const response = await fetchWithAuth('/digital-forms', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create digital form');
      }
      
      return response;
    } catch (error) {
      console.error('Error creating digital form:', error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Update a form
   */
  async updateForm(id: string, data: TDigitalFormUpdate): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to update form with ID: ${id}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error updating digital form ${id}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Delete a form
   */
  async deleteForm(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to delete form with ID: ${id}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error deleting digital form ${id}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Add a new entry to a form
   */
  async addFormEntry(formId: string, data: TDigitalFormEntry): Promise<ApiResponse<{id: string}>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/entries`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to add entry to form ${formId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error adding entry to form ${formId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Update an entry in a form
   */
  async updateFormEntry(formId: string, entryId: string, data: Partial<TUpdateFormEntry>): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/entries/${entryId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to update entry ${entryId} in form ${formId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error updating entry ${entryId} in form ${formId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

    /**
   * Update an shift type in a entry
   */
    async updateShiftTypeFormEntry(formId: string, entryId: string, data: TShiftTypeFormEntry): Promise<ApiResponse<void>> {
      try {
        const response = await fetchWithAuth(`/digital-forms/${formId}/entries/${entryId}/shift-type`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        
        if (!response.success) {
          throw new Error(response.error || `Failed to update entry ${entryId} in form ${formId}`);
        }
        
        return response;
      } catch (error) {
        console.error(`Error updating entry ${entryId} in form ${formId}:`, error);
        throw error; // Rethrow to allow mutation handling
      }
    },
  

  /**
   * Update hourly data for a form entry
   */
  async updateHourlyData(
    formId: string, 
    entryId: string, 
    hourlyData: Record<string, number>
  ): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/entries/${entryId}/hourly-data`, {
        method: 'PATCH',
        body: JSON.stringify({ hourlyData }),
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to update hourly data for entry ${entryId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error updating hourly data for entry ${entryId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Delete an entry from a form
   */
  async deleteFormEntry(formId: string, entryId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/entries/${entryId}`, {
        method: 'DELETE',
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to delete entry ${entryId} from form ${formId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error deleting entry ${entryId} from form ${formId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Submit a form for approval
   */
  async submitForm(formId: string, data: TDigitalFormSubmit = {}): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/submit`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to submit form ${formId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error submitting form ${formId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Approve a form
   */
  async approveForm(formId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/approve`, {
        method: 'POST',
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to approve form ${formId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error approving form ${formId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Reject a form
   */
  async rejectForm(formId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/reject`, {
        method: 'POST',
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to reject form ${formId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error rejecting form ${formId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Get form statistics
   */
  async getFormStats(formId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/stats`);
      
      if (!response.success) {
        throw new Error(response.error || `Failed to fetch stats for form ${formId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching stats for form ${formId}:`, error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  /**
   * Add issue to a form entry
   */
  async addIssue(
    formId: string,
    entryId: string,
    issueData: {
      type: string;
      hour: number;
      impact: number;
      description?: string;
    }
  ): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/entries/${entryId}/issues`, {
        method: 'POST',
        body: JSON.stringify(issueData),
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to add issue to entry ${entryId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error adding issue to entry ${entryId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Remove issue from a form entry
   */
  async removeIssue(
    formId: string,
    entryId: string,
    issueIndex: number
  ): Promise<ApiResponse<void>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/entries/${entryId}/issues/${issueIndex}`, {
        method: 'DELETE',
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to remove issue from entry ${entryId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error removing issue from entry ${entryId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Get the print version of a form
   */
  async getPrintVersion(formId: string): Promise<ApiResponse<{form: DigitalForm; entries: DigitalFormEntry[]}>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/print`);
      
      if (!response.success) {
        throw new Error(response.error || `Failed to get print version of form ${formId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error getting print version of form ${formId}:`, error);
      return {
        success: false,
        data: { form: null as unknown as DigitalForm, entries: [] },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  /**
   * Export form data to Excel/PDF
   */
  async exportForm(formId: string, format: 'excel' | 'pdf'): Promise<ApiResponse<{fileUrl: string}>> {
    try {
      const response = await fetchWithAuth(`/digital-forms/${formId}/export?format=${format}`, {
        method: 'GET',
      });
      
      if (!response.success) {
        throw new Error(response.error || `Failed to export form ${formId}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error exporting form ${formId}:`, error);
      throw error;
    }
  },
  
  // Report endpoints
  
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
    } = {}
  ): Promise<ApiResponse<FactoryProductionReport>> {
    try {
      const queryParams = new URLSearchParams({
        dateFrom,
        dateTo,
      });
      
      // Add boolean params only if they're true
      if (options.includeLines) queryParams.append('includeLines', 'true');
      if (options.includeTeams) queryParams.append('includeTeams', 'true');
      if (options.includeGroups) queryParams.append('includeGroups', 'true');
      if (options.groupByBag) queryParams.append('groupByBag', 'true');
      if (options.groupByProcess) queryParams.append('groupByProcess', 'true');
      
      return await fetchWithAuth(`/digital-forms/reports/factory/${factoryId}?${queryParams.toString()}`);
    } catch (error) {
      console.error(`Error fetching factory report for ${factoryId}:`, error);
      throw error;
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
    } = {}
  ): Promise<ApiResponse<LineProductionReport>> {
    try {
      const queryParams = new URLSearchParams({
        dateFrom,
        dateTo,
      });
      
      if (options.includeTeams) queryParams.append('includeTeams', 'true');
      if (options.includeGroups) queryParams.append('includeGroups', 'true');
      if (options.groupByBag) queryParams.append('groupByBag', 'true');
      if (options.groupByProcess) queryParams.append('groupByProcess', 'true');
      
      return await fetchWithAuth(`/digital-forms/reports/line/${lineId}?${queryParams.toString()}`);
    } catch (error) {
      console.error(`Error fetching line report for ${lineId}:`, error);
      throw error;
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
    } = {}
  ): Promise<ApiResponse<TeamProductionReport>> {
    try {
      const queryParams = new URLSearchParams({
        dateFrom,
        dateTo,
      });
      
      if (options.includeGroups) queryParams.append('includeGroups', 'true');
      if (options.includeWorkers) queryParams.append('includeWorkers', 'true');
      if (options.groupByBag) queryParams.append('groupByBag', 'true');
      if (options.groupByProcess) queryParams.append('groupByProcess', 'true');
      
      return await fetchWithAuth(`/digital-forms/reports/team/${teamId}?${queryParams.toString()}`);
    } catch (error) {
      console.error(`Error fetching team report for ${teamId}:`, error);
      throw error;
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
    } = {}
  ): Promise<ApiResponse<GroupProductionReport>> {
    try {
      const queryParams = new URLSearchParams({
        dateFrom,
        dateTo,
      });
      
      if (options.includeWorkers) queryParams.append('includeWorkers', 'true');
      if (options.detailedAttendance) queryParams.append('detailedAttendance', 'true');
      if (options.groupByBag) queryParams.append('groupByBag', 'true');
      if (options.groupByProcess) queryParams.append('groupByProcess', 'true');
      
      return await fetchWithAuth(`/digital-forms/reports/group/${groupId}?${queryParams.toString()}`);
    } catch (error) {
      console.error(`Error fetching group report for ${groupId}:`, error);
      throw error;
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
    } = {}
  ): Promise<ApiResponse<ProductionComparisonReport>> {
    try {
      const queryParams = new URLSearchParams({
        lineId,
        entityIds: entityIds.join(','),
        compareBy,
        dateFrom,
        dateTo,
      });
      
      if (options.includeHandBags) queryParams.append('includeHandBags', 'true');
      if (options.includeProcesses) queryParams.append('includeProcesses', 'true');
      if (options.includeTimeSeries) queryParams.append('includeTimeSeries', 'true');
      
      return await fetchWithAuth(`/digital-forms/reports/comparison?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error fetching comparison report:', error);
      throw error;
    }
  },
  
  /**
   * Export production report to a file
   */
  async exportReport(
    reportType: 'team' | 'group' | 'comparison',
    parameters: any,
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<ApiResponse<{fileUrl: string}>> {
    try {
      return await fetchWithAuth('/digital-forms/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType,
          parameters,
          format
        }),
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },

  /**
   * Convert from API digital form to UI model
   * This helper bridges the gap between API data model and UI data model
   */
  convertApiToUiModel(form: DigitalForm, entries: DigitalFormEntry[]): any {
    // Map entries to UI worker model
    const workers = entries.map(entry => ({
      id: entry.id,
      name: entry.userName || 'Công nhân',
      employeeId: entry.userCode || entry.userId?.substring(0, 6) || 'N/A',
      bagId: entry.handBagId || '',
      bagName: entry.handBagName || 'Chưa xác định',
      processId: entry.processId || '',
      processName: entry.processName || 'Chưa xác định',
      colorId: entry.bagColorId || '',
      colorName: entry.bagColorName || 'Chưa xác định',
      attendanceStatus: entry.attendanceStatus || AttendanceStatus.PRESENT,
      hourlyData: entry.hourlyData || {},
      totalOutput: entry.totalOutput || 0,
      issues: entry.issues || [],
      qualityScore: entry.qualityScore || 100
    }));
    
    // Map form to UI model
    return {
      id: form.id,
      formCode: form.formCode || `FORM-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}`,
      formName: form.formName || 'Phiếu theo dõi công đoạn',
      date: form.date || new Date().toISOString(),
      factoryId: form.factoryId || '',
      factoryName: form.factoryName || 'Chưa xác định',
      lineId: form.lineId || '',
      lineName: form.lineName || 'Chưa xác định',
      teamId: form.teamId || '',
      teamName: form.teamName || 'Chưa xác định',
      groupId: form.groupId || '',
      groupName: form.groupName || 'Chưa xác định',
      status: form.status,
      workers
    };
  }
};