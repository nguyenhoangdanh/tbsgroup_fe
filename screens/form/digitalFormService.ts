import axios from 'axios';
import { authHeader } from '@/utils/authHeader';
import { API_URL } from '@/config';

export const DigitalFormService = {
  // List all forms with pagination and filters
  async listForms(params: any = {}) {
    try {
      const response = await axios.get(`${API_URL}/digital-forms`, {
        headers: authHeader(),
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error listing digital forms:', error);
      return { success: false, error };
    }
  },

  // Get a single form by ID
  async getForm(id: string) {
    try {
      const response = await axios.get(`${API_URL}/digital-forms/${id}`, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting digital form ${id}:`, error);
      return { success: false, error };
    }
  },

  // Get a form with all its entries
  async getFormWithEntries(id: string) {
    try {
      const response = await axios.get(`${API_URL}/digital-forms/${id}/entries`, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting digital form with entries ${id}:`, error);
      return { success: false, error };
    }
  },

  // Create a new form
  async createForm(formData: any) {
    try {
      const response = await axios.post(`${API_URL}/digital-forms`, formData, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating digital form:', error);
      return { success: false, error };
    }
  },

  // Update a form
  async updateForm(id: string, formData: any) {
    try {
      const response = await axios.patch(`${API_URL}/digital-forms/${id}`, formData, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating digital form ${id}:`, error);
      return { success: false, error };
    }
  },

  // Delete a form
  async deleteForm(id: string) {
    try {
      const response = await axios.delete(`${API_URL}/digital-forms/${id}`, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting digital form ${id}:`, error);
      return { success: false, error };
    }
  },

  // Add a form entry
  async addFormEntry(formId: string, entryData: any) {
    try {
      const response = await axios.post(`${API_URL}/digital-forms/${formId}/entries`, entryData, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error adding form entry to ${formId}:`, error);
      return { success: false, error };
    }
  },

  // Update a form entry
  async updateFormEntry(formId: string, entryId: string, entryData: any) {
    try {
      const response = await axios.patch(`${API_URL}/digital-forms/${formId}/entries/${entryId}`, entryData, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating form entry ${entryId}:`, error);
      return { success: false, error };
    }
  },

  // Delete a form entry
  async deleteFormEntry(formId: string, entryId: string) {
    try {
      const response = await axios.delete(`${API_URL}/digital-forms/${formId}/entries/${entryId}`, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting form entry ${entryId}:`, error);
      return { success: false, error };
    }
  },

  // Submit form for approval
  async submitForm(formId: string, data: any = {}) {
    try {
      const response = await axios.post(`${API_URL}/digital-forms/${formId}/submit`, data, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error submitting form ${formId}:`, error);
      return { success: false, error };
    }
  },

  // Approve a form
  async approveForm(formId: string) {
    try {
      const response = await axios.post(`${API_URL}/digital-forms/${formId}/approve`, {}, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error approving form ${formId}:`, error);
      return { success: false, error };
    }
  },

  // Reject a form
  async rejectForm(formId: string) {
    try {
      const response = await axios.post(`${API_URL}/digital-forms/${formId}/reject`, {}, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting form ${formId}:`, error);
      return { success: false, error };
    }
  },

  // Get print version of the form
  async getPrintVersion(formId: string) {
    try {
      const response = await axios.get(`${API_URL}/digital-forms/${formId}/print`, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting print version of form ${formId}:`, error);
      return { success: false, error };
    }
  }
};