// Export team hooks
export {
  useTeamQueries,
  useTeamMutations,
  useTeamHelpers,
  useTeam,
  initializeTeamContext
} from './useTeam';

// Export team context and related hooks
export {
  TeamProvider,
  useTeamContext,
  useTeamData,
  useTeamActions,
  useTeamForm,
  useTeamFormWithDefaults,
  useLineTeams,
  useTeamDetails
} from './TeamContext';

// Export types if needed
export type {
  TeamContextType,
  TeamProviderConfig,
  TeamProviderProps
} from './TeamContext';

// Re-export useTeam as default for backward compatibility
export { useTeam as default } from './useTeam';
