// Export department hooks
export {
  useDepartmentQueries,
  useDepartmentMutations,
  useDepartmentHelpers,
  useDepartment,
  initializeDepartmentContext
} from './useDepartment';

// Export department context and related hooks
export {
  DepartmentProvider,
  useDepartmentContext,
  useDepartmentData,
  useDepartmentActions,
  useDepartmentForm,
  useDepartmentFormWithDefaults
} from './DepartmentContext';

// Export types if needed
export type {
  DepartmentContextType,
  DepartmentProviderConfig,
  DepartmentProviderProps
} from './DepartmentContext';

// Re-export useDepartment as default for backward compatibility
export { useDepartment as default } from './useDepartment';
