import { useBaseHelpers } from '../base/useBaseHelpers';
import { BagColor, BagColorCondDTO } from '@/common/interface/handbag';

/**
 * Hook for BagColor helpers (filtering, pagination, etc.)
 */
export const useBagColorHelpers = (handBagId?: string) => {
  // Default filter values for bag colors
  const defaultFilters: BagColorCondDTO = {
    search: '',
    active: undefined,
    handBagId: handBagId || '',
    colorCode: '',
    colorName: '',
  };

  return useBaseHelpers<BagColor, BagColorCondDTO>(defaultFilters);
};