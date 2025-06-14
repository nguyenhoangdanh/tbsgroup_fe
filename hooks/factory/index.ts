// Export factory hooks
export {
  useFactoryQueries,
  useFactoryMutations,
  useFactoryHelpers,
  useFactory,
  initializeFactoryContext
} from './useFactory';

// Export factory context and related hooks
export {
  FactoryProvider,
  useFactoryContext,
  useFactoryData,
  useFactoryActions,
  useFactoryForm,
  useFactoryFormWithDefaults
} from './FactoryContext';

// Export types if needed
export type {
  FactoryContextType,
  FactoryProviderConfig,
  FactoryProviderProps
} from './FactoryContext';

// Re-export useFactory as default for backward compatibility
export { useFactory as default } from './useFactory';
