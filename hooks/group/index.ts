// Export group hooks
export {
  useGroupQueries,
  useGroupMutations,
  useGroupHelpers,
  useGroup,
  initializeGroupContext
} from './useGroup';

// Export group context and related hooks
export {
  GroupProvider,
  useGroupContext,
  useGroupData,
  useGroupActions,
  useGroupForm,
  useGroupFormWithDefaults,
  useTeamGroups,
  useGroupDetails
} from './GroupContext';

// Export types if needed
export type {
  GroupContextType,
  GroupProviderConfig,
  GroupProviderProps
} from './GroupContext';

// Re-export useGroup as default for backward compatibility
export { useGroup as default } from './useGroup';
