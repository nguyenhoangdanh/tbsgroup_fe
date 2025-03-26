import { useBaseHelpers } from '../base/useBaseHelpers';

// Assuming these types are defined or will be defined in your interfaces
interface BagProcess {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BagProcessCondDTO {
  code?: string;
  name?: string;
  active?: boolean;
  search?: string;
}

/**
 * Hook for BagProcess helpers (filtering, pagination, etc.)
 */
export const useBagProcessHelpers = () => {
  // Default filter values for bag processes
  const defaultFilters: BagProcessCondDTO = {
    search: '',
    active: undefined,
    code: '',
    name: '',
  };

  return useBaseHelpers<BagProcess, BagProcessCondDTO>(defaultFilters);
};