// hooks/useDigitalForm.ts
import { useMemo } from 'react';
import { useDigitalFormQueries } from './useDigitalFormQueries';
import { useDigitalFormMutations } from './useDigitalFormMutations';
import { useDigitalFormHelpers } from './useDigitalFormHelpers';

/**
 * Main hook for digital form management
 * Combines queries, mutations, and helpers into a single hook with optimized performance
 */
export const useDigitalForm = () => {
  // Get all hooks
  const queries = useDigitalFormQueries();
  const mutations = useDigitalFormMutations();
  const helpers = useDigitalFormHelpers();

  // Memoized exports to prevent unnecessary rerenders
  const combinedHooks = useMemo(
    () => ({
      // Spreading everything for convenience
      ...queries,
      ...mutations,
      ...helpers,

      // Re-exporting the individual hooks for more granular access if needed
      queries,
      mutations,
      helpers,
    }),
    [queries, mutations, helpers],
  );

  return combinedHooks;
};

/**
 * Context provider initialization function for global state
 */
export const initializeDigitalFormContext = () => {
  const digitalFormState = useDigitalForm();
  return digitalFormState;
};

/**
 * Export individual hooks for more granular usage
 */
export { useDigitalFormQueries, useDigitalFormMutations, useDigitalFormHelpers };

// Default export for convenience
export default useDigitalForm;