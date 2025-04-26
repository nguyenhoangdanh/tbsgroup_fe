// hooks/digital-form-hooks/useDigitalFormManager.ts
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { 
  TDigitalFormCreate, 
  TDigitalFormUpdate 
} from '@/schemas/digital-form.schema';
import { useDigitalFormQueries } from './useDigitalFormQueries';
import { useDigitalFormMutations } from './useDigitalFormMutations';
import { useDigitalFormCrudHandlers } from './useDigitalFormCrudHandlers';

/**
 * Hook for managing digital forms creation, listing, and navigation
 * Provides simplified API for form management outside individual forms
 */
export const useDigitalFormManager = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const queries = useDigitalFormQueries();
  const mutations = useDigitalFormMutations();
  
  // Local state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create CRUD handlers with proper navigation
  const crudHandlers = useDigitalFormCrudHandlers({
    entityName: 'biểu mẫu số',
    onCreateForm: (data: TDigitalFormCreate) => mutations.createFormMutation.mutateAsync(data).then(res => res.data?.id || null),
    onUpdateForm: (id: string, data: TDigitalFormUpdate) => mutations.updateFormMutation.mutateAsync({ id, data }).then(() => true),
    onDeleteForm: (id: string) => mutations.deleteFormMutation.mutateAsync(id).then(() => true),
    invalidateCache: async (id: string) => {
      await queryClient.invalidateQueries({ queryKey: ['digital-form', id] });
      await queryClient.invalidateQueries({ queryKey: ['digital-forms-list'] });
    },
    navigate: (path: string) => router.push(path)
  });
  
  // Create a new form and navigate to it
  const createNewForm = useCallback(async (formData: TDigitalFormCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      const formId = await crudHandlers.handleCreateForm(formData);
      
      if (formId) {
        // Navigate to the new form
        router.push(`/digital-forms/${formId}`);
        return formId;
      } else {
        throw new Error('Tạo biểu mẫu không thành công');
      }
    } catch (err) {
      console.error('Error creating form:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      return null;
    } finally {
      setLoading(false);
    }
  }, [crudHandlers, router]);
  
  // List forms with filtering and pagination
  const listForms = useCallback((params: any) => {
    return queries.listForms(params);
  }, [queries]);
  
  // Delete a form with confirmation
  const deleteForm = useCallback(async (id: string) => {
    setLoading(true);
    
    try {
      const success = await crudHandlers.handleDeleteForm(id);
      
      if (success) {
        // Optionally navigate to the forms list
        // router.push('/digital-forms');
        return true;
      } else {
        throw new Error('Xóa biểu mẫu không thành công');
      }
    } catch (err) {
      console.error('Error deleting form:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    } finally {
      setLoading(false);
    }
  }, [crudHandlers]);
  
  // Navigate to form view
  const navigateToForm = useCallback((formId: string) => {
    router.push(`/digital-forms/${formId}`);
  }, [router]);
  
  // Navigate to form edit
  const navigateToFormEdit = useCallback((formId: string) => {
    router.push(`/digital-forms/${formId}/edit`);
  }, [router]);
  
  // Navigate to forms list
  const navigateToFormsList = useCallback(() => {
    router.push('/digital-forms');
  }, [router]);
  
  return {
    // State
    loading,
    error,
    
    // Actions
    createNewForm,
    deleteForm,
    listForms,
    
    // Navigation
    navigateToForm,
    navigateToFormEdit,
    navigateToFormsList,
    
    // Access to original hooks
    crudHandlers,
    queries,
    mutations
  };
};

export default useDigitalFormManager;