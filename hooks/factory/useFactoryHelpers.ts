import { useBaseHelpers } from '../base/useBaseHelpers';
import { Factory, FactoryCondDTO } from '@/common/interface/factory';

/**
 * Hook for Factory helpers (filtering, pagination, etc.)
 */
export const useFactoryHelpers = () => {
  // Default filter values for factories
  const defaultFilters: FactoryCondDTO = {
    search: '',
    code: '',
    name: '',
    departmentId: '',
    managingDepartmentId: '',
    departmentType: undefined
  };

  return useBaseHelpers<Factory, FactoryCondDTO>(defaultFilters);
};
