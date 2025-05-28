import { useCallback, useState } from 'react';

import { useDigitalFormHooks } from './useDigitalFormHooks';

interface WorkflowOperationsProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * Hook for managing digital form workflow operations (submit, approve, reject)
 */
export function useDigitalFormWorkflow({ onSuccess, onError }: WorkflowOperationsProps = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get hooks for workflow operations
  const { useSubmitDigitalForm, useApproveDigitalForm, useRejectDigitalForm } = useDigitalFormHooks(
    (err, operation) => {
      const errorMessage = `Error in workflow operation ${operation}: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      if (onError) onError(err);
    },
  );

  // Setup mutations
  const submitFormMutation = useSubmitDigitalForm();
  const approveFormMutation = useApproveDigitalForm();
  const rejectFormMutation = useRejectDigitalForm();

  // Submit a form for approval
  const submitForm = useCallback(
    async (formId: string, approvalRequestId?: string) => {
      if (!formId || loading) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await submitFormMutation.mutateAsync({
          formId,
          data: approvalRequestId ? { approvalRequestId } : undefined,
        });

        if (result.success) {
          if (onSuccess) onSuccess();
          return true;
        }

        return false;
      } catch (err) {
        // Error is already handled by the error handler provided to useDigitalFormHooks
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loading, submitFormMutation, onSuccess],
  );

  // Approve a submitted form
  const approveForm = useCallback(
    async (formId: string) => {
      if (!formId || loading) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await approveFormMutation.mutateAsync(formId);

        if (result.success) {
          if (onSuccess) onSuccess();
          return true;
        }

        return false;
      } catch (err) {
        // Error is already handled by the error handler provided to useDigitalFormHooks
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loading, approveFormMutation, onSuccess],
  );

  // Reject a submitted form
  const rejectForm = useCallback(
    async (formId: string) => {
      if (!formId || loading) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await rejectFormMutation.mutateAsync(formId);

        if (result.success) {
          if (onSuccess) onSuccess();
          return true;
        }

        return false;
      } catch (err) {
        // Error is already handled by the error handler provided to useDigitalFormHooks
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loading, rejectFormMutation, onSuccess],
  );

  // Clear any errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submitForm,
    approveForm,
    rejectForm,
    loading,
    error,
    clearError,

    // Mutation states for more fine-grained UI feedback
    isSubmitting: submitFormMutation.isPending,
    isApproving: approveFormMutation.isPending,
    isRejecting: rejectFormMutation.isPending,
  };
}

export default useDigitalFormWorkflow;
