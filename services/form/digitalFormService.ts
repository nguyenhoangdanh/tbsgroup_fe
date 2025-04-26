// services/digitalFormService.ts
import { fetchWithAuth } from '@/lib/fetcher';
import { 
  DigitalForm, 
  DigitalFormEntry,
  ShiftType,
  RecordStatus
} from '@/common/types/digital-form';
import { 
  TDigitalFormCreate, 
  TDigitalFormUpdate, 
  TDigitalFormSubmit, 
  TDigitalFormEntry 
} from '@/schemas/digital-form.schema';

// Improved API response types
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

// Search conditions
export interface DigitalFormCondition {
  lineId?: string;
  createdById?: string;
  status?: RecordStatus;
  dateFrom?: string | Date | null;
  dateTo?: string | Date | null;
  shiftType?: ShiftType;
  search?: string;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Batch operations interface
export interface BatchOperation {
  formIds: string[];
}

/**
 * Digital Form Service with optimized API calls and better error handling
 * Designed for high-traffic use (5000+ users)
 */
export const DigitalFormService = {
  /**
   * List forms with filtering and pagination
   */
  async listForms(params: DigitalFormCondition & PaginationParams = {}): Promise<ListApiResponse<DigitalForm>> {
    try {
      
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      
      const fullUrl = `/digital-forms?${queryParams.toString()}`;
      
      const response = await fetchWithAuth(fullUrl);
      
      return response as ListApiResponse<DigitalForm>;
    } catch (error) {
      console.error('Complete Error Details:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 10,
        error: JSON.stringify(error)
      };
    }
  },

  /**
   * Get a form by ID
   */
  async getForm(id: string): Promise<ApiResponse<DigitalForm>> {
    try {
      return await fetchWithAuth(`/digital-forms/${id}`);
    } catch (error) {
      console.error(`Error fetching digital form ${id}:`, error);
      return {
        success: false,
        data: null as unknown as DigitalForm,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Get a form with all entries
   */
  async getFormWithEntries(id: string): Promise<ApiResponse<{form: DigitalForm; entries: DigitalFormEntry[]}>> {
    try {
      return await fetchWithAuth(`/digital-forms/${id}/entries`);
    } catch (error) {
      console.error(`Error fetching digital form with entries ${id}:`, error);
      return {
        success: false,
        data: { form: null as unknown as DigitalForm, entries: [] },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Create a new form
   */
  async createForm(data: TDigitalFormCreate): Promise<ApiResponse<{id: string}>> {
    try {
      return await fetchWithAuth('/digital-forms', {
        method: 'POST',
        body: JSON.stringify(data),
      });
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
      return await fetchWithAuth(`/digital-forms/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
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
      return await fetchWithAuth(`/digital-forms/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`Error deleting digital form ${id}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Batch delete multiple forms
   */
  async batchDeleteForms(data: BatchOperation): Promise<ApiResponse<{count: number}>> {
    try {
      return await fetchWithAuth(`/digital-forms/batch-delete`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error batch deleting digital forms:', error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Add a new entry to a form
   */
  async addFormEntry(formId: string, data: TDigitalFormEntry): Promise<ApiResponse<{id: string}>> {
    try {
      return await fetchWithAuth(`/digital-forms/${formId}/entries`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(`Error adding entry to form ${formId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Delete an entry from a form
   */
  async deleteFormEntry(formId: string, entryId: string): Promise<ApiResponse<void>> {
    try {
      return await fetchWithAuth(`/digital-forms/${formId}/entries/${entryId}`, {
        method: 'DELETE',
      });
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
      return await fetchWithAuth(`/digital-forms/${formId}/submit`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
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
      return await fetchWithAuth(`/digital-forms/${formId}/approve`, {
        method: 'POST',
      });
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
      return await fetchWithAuth(`/digital-forms/${formId}/reject`, {
        method: 'POST',
      });
    } catch (error) {
      console.error(`Error rejecting form ${formId}:`, error);
      throw error; // Rethrow to allow mutation handling
    }
  },

  /**
   * Get the print version of a form
   */
  async getPrintVersion(formId: string): Promise<ApiResponse<{form: DigitalForm; entries: DigitalFormEntry[]}>> {
    try {
      return await fetchWithAuth(`/digital-forms/${formId}/print`);
    } catch (error) {
      console.error(`Error getting print version of form ${formId}:`, error);
      return {
        success: false,
        data: { form: null as unknown as DigitalForm, entries: [] },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Get form statistics (for dashboards)
   */
  async getFormStats(params: { period?: 'day' | 'week' | 'month' | 'year' } = {}): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) {
        queryParams.append('period', params.period);
      }
      
      return await fetchWithAuth(`/digital-forms/stats?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error fetching form statistics:', error);
      return {
        success: false,
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Batch export forms to Excel (server-side generation)
   */
  async exportFormsToExcel(formIds: string[]): Promise<ApiResponse<{url: string}>> {
    try {
      return await fetchWithAuth(`/digital-forms/export`, {
        method: 'POST',
        body: JSON.stringify({ formIds }),
      });
    } catch (error) {
      console.error('Error exporting forms to Excel:', error);
      throw error; // Rethrow to allow handling
    }
  }
};