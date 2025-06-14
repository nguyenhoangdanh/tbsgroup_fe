import { createEntityHooks } from '@/lib/core/hook-factory';
import { factoryService } from '@/services/factory/factory.service';
import { Factory, FactoryCondDTO, FactoryCreateDTO, FactoryUpdateDTO } from '@/common/interface/factory';

const defaultFactoryValues = (): FactoryCreateDTO => ({
  code: '',
  name: '',
  description: '',
  address: '',
  phone: '',
  departmentId: '',
  managingDepartmentId: '',
});

export const {
  useQueries: useFactoryQueries,
  useMutations: useFactoryMutations,
  useHelpers: useFactoryHelpers,
  useEntity: useFactory,
} = createEntityHooks<
  Factory,
  FactoryCondDTO,
  FactoryCreateDTO,
  FactoryUpdateDTO
>('factory', factoryService, defaultFactoryValues);

// Initialize factory context function
export const initializeFactoryContext = () => {
  return useFactory();
};
