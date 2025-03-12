'use client';

import {useMemo} from 'react';
import {useRoleQueries} from './roleQueries';
import {useRoleMutations} from './roleMutations';
import {useRoleHelpers} from './roleHelpers';

/**
 * Main hook for role management
 * Combines queries, mutations, and helpers into a single hook with optimized performance
 */
export const useRole = () => {
  // Get all hooks
  const queries = useRoleQueries();
  const mutations = useRoleMutations();
  const helpers = useRoleHelpers();

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
 * This will be used in roleContext.tsx
 */
export const initializeRoleContext = () => {
  const roleState = useRole();
  return roleState;
};

/**
 * Export individual hooks for more granular usage
 */
export {useRoleQueries, useRoleMutations, useRoleHelpers};

// Default export for convenience
export default useRole;
