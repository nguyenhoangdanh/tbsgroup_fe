import { useBaseHelpers } from '../base/useBaseHelpers';

import { HandBag, HandBagCondDTO } from '@/common/interface/handbag';

/**
 * Hook for HandBag helpers (filtering, pagination, etc.)
 */
export const useHandBagHelpers = () => {
  // Default filter values for handBags
  const defaultFilters: HandBagCondDTO = {
    search: '',
    active: undefined,
    code: '',
    name: '',
    category: '',
  };

  return useBaseHelpers<HandBag, HandBagCondDTO>(defaultFilters);
};
