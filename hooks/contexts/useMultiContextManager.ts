import { useMemo, useCallback } from 'react';

import { useRoleContext } from '../roles/roleContext';
import { useUserContext } from '../users/UserContext';

// Types for different entity contexts (to be extended)
interface FactoryContext {
  factories: any[];
  loading: boolean;
  error: Error | null;
  getFactories: () => any;
}

interface LineContext {
  lines: any[];
  loading: boolean;
  error: Error | null;
  getLinesByFactory: (factoryId: string) => any;
}

interface TeamContext {
  teams: any[];
  loading: boolean;
  error: Error | null;
  getTeamsByLine: (lineId: string) => any;
}

interface GroupContext {
  groups: any[];
  loading: boolean;
  error: Error | null;
  getGroupsByTeam: (teamId: string) => any;
}

interface DepartmentContext {
  departments: any[];
  loading: boolean;
  error: Error | null;
  getDepartments: () => any;
}

/**
 * Centralized manager for all context APIs with dependency handling
 */
export const useMultiContextManager = () => {
  const userContext = useUserContext();
  const roleContext = useRoleContext();

  // TODO: Add other contexts as they're implemented
  // const factoryContext = useFactoryContext();
  // const lineContext = useLineContext();
  // const teamContext = useTeamContext();
  // const groupContext = useGroupContext();
  // const departmentContext = useDepartmentContext();

  // Memoized selectors for performance
  const selectors = useMemo(() => ({
    users: {
      data: userContext.getList,
      actions: {
        create: userContext.handleCreate,
        update: userContext.handleUpdate,
        delete: userContext.handleDelete,
      },
      state: {
        loading: userContext.loading,
        error: userContext.error,
        filters: userContext.activeFilters,
      },
      helpers: {
        updateFilter: userContext.updateFilter,
        resetFilters: userContext.resetFilters,
      }
    },
    roles: {
      data: roleContext.getAllRoles,
      actions: {
        create: roleContext.handleCreateRole,
      },
      state: {
        loading: roleContext.loading,
        error: roleContext.error,
      }
    },
    // TODO: Add other entity selectors
  }), [userContext, roleContext]);

  // Dependency loading strategy
  const loadDependencies = useCallback(async (entityType: string, dependencies: string[] = []) => {
    const loadingPromises: Promise<any>[] = [];

    // Load dependencies in order
    for (const dep of dependencies) {
      switch (dep) {
        case 'roles':
          // Pre-load roles if not already loaded
          if (!roleContext.getAllRoles.data) {
            // Trigger role loading
          }
          break;
        case 'factories':
          // TODO: Load factories
          break;
        case 'lines':
          // TODO: Load lines (depends on factories)
          break;
        // Add more dependencies as needed
      }
    }

    return Promise.all(loadingPromises);
  }, [roleContext]);

  // Batch loading for UserContainer
  const loadUserManagementData = useCallback(async () => {
    return loadDependencies('users', ['roles', 'factories', 'lines', 'teams', 'groups', 'departments']);
  }, [loadDependencies]);

  // Global loading state
  const globalState = useMemo(() => ({
    isLoading: userContext.loading || roleContext.loading,
    hasError: !!(userContext.error || roleContext.error),
    errors: {
      user: userContext.error,
      role: roleContext.error,
    }
  }), [userContext.loading, userContext.error, roleContext.loading, roleContext.error]);

  return {
    selectors,
    loadDependencies,
    loadUserManagementData,
    globalState,
    // Direct access to contexts if needed
    contexts: {
      user: userContext,
      role: roleContext,
    }
  };
};
