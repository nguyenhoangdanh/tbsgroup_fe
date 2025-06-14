import { Department, DepartmentCondDTO, DepartmentCreateDTO, DepartmentUpdateDTO } from '@/common/interface/department';
import { createEntityHooks } from '@/lib/core/hook-factory';
import { departmentService } from '@/services/department/department.service';

const defaultDepartmentValues = (): DepartmentCreateDTO => ({
  code: '',
  name: '',
  description: '',
  departmentType: 'HEAD_OFFICE',
  parentId: null,
});

export const {
  useQueries: useDepartmentQueries,
  useMutations: useDepartmentMutations,
  useHelpers: useDepartmentHelpers,
  useEntity: useDepartment,
} = createEntityHooks<
  Department,
  DepartmentCondDTO,
  DepartmentCreateDTO,
  DepartmentUpdateDTO
>('department', departmentService, defaultDepartmentValues);

// Initialize department context function
export const initializeDepartmentContext = () => {
  return useDepartment();
};

export default useDepartment;
