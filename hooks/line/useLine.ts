import { Line, LineCondDTO, LineCreateDTO, LineUpdateDTO } from '@/common/interface/line';
import { createEntityHooks } from '@/lib/core/hook-factory';
import { lineService } from '@/services/line/line.service';

const defaultLineValues = (): LineCreateDTO => ({
  code: '',
  name: '',
  description: '',
  factoryId: '',
  capacity: 0,
});

export const {
  useQueries: useLineQueries,
  useMutations: useLineMutations,
  useHelpers: useLineHelpers,
  useEntity: useLine,
} = createEntityHooks<
  Line,
  LineCondDTO,
  LineCreateDTO,
  LineUpdateDTO
>('line', lineService, defaultLineValues);

// Initialize line context function
export const initializeLineContext = () => {
  return useLine();
};

export default useLine;
