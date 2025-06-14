// Export user hooks
export {
  useUserQueries,
  useUserMutations,
  useUserHelpers,
  useUser,
  initializeUserContext
} from './useUser';

// Export user context and related hooks
export {
  UserProvider,
  useUserContext,
  useUserData,
  useUserActions,
  useUserForm,
  useUserFormWithDefaults
} from './UserContext';

// Export types if needed (you can add these if you have shared types)
export type {
  UserContextType,
  UserProviderConfig,
  UserProviderProps
} from './UserContext';

// Re-export useUser as default for backward compatibility
export { useUser as default } from './useUser';
