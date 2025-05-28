// Export base query and mutation hooks
export { default as useDigitalFormQueries } from './useDigitalFormQueries';
export { default as useDigitalFormMutations } from './useDigitalFormMutations';

// Export specialized hooks
export { default as useDigitalFormStats } from './useDigitalFormStats'; 
export { default as useDigitalFormReports } from './useDigitalFormReports';
export { default as useWorkShifts } from './useWorkShifts';
export { DATE_RANGES } from './useDigitalFormReports';

// Export context provider
export { DigitalFormProvider, useDigitalFormContext } from './DigitalFormContext';

// Export custom hooks
export { default as useCustomDigitalForm } from './useCustomDigitalForm';

// Create consolidated default object with all hooks
const digitalFormHooks = {
  useDigitalFormQueries,
  useDigitalFormMutations,
  useDigitalFormStats,
  useDigitalFormReports,
  useWorkShifts,
  useCustomDigitalForm,
};

export default digitalFormHooks;
