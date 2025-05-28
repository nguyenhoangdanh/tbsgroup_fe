'use client';

import { useMemo } from 'react';

import { useUserMutations } from './userMutations';
import { useUserHelpers } from './useUserHelpers';
import { useUserQueries } from './useUserQueries';

/**
 * Main hook for user management
 * Combines queries, mutations, and helpers into a single hook with optimized performance
 */
export const useUser = () => {
  // Get all hooks
  const queries = useUserQueries();
  const mutations = useUserMutations();
  const helpers = useUserHelpers();

  //  Memoized exports to prevent unnecessary rerenders
  const combinedHooks = useMemo(
    () => ({
      //Spreading everything for convenience
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
 * This will be used in userContext.tsx
 */
export const initializeUserContext = () => {
  const userState = useUser();
  return userState;
};

/**
 * Export individual hooks for more granular usage
 */
export { useUserQueries, useUserMutations, useUserHelpers };

//Default export for convenience
export default useUser;
