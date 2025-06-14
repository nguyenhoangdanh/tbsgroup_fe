import { BagColorProcess, BagColorProcessCondDTO } from '@/common/interface/handbag';

import { useBaseHelpers } from '../base/useBaseHelpers';


/**
 * Hook for BagColorProcess helpers (filtering, pagination, etc.)
 */
export const useBagColorProcessHelpers = (bagColorId?: string) => {
  // Default filter values for bag color processes
  const defaultFilters: BagColorProcessCondDTO = {
    bagColorId: bagColorId || '',
    bagProcessId: '',
  };

  return useBaseHelpers<BagColorProcess, BagColorProcessCondDTO>(defaultFilters);
};
