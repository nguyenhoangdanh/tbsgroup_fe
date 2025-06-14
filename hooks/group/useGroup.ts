import { Group, GroupCondDTO, GroupCreateDTO, GroupUpdateDTO } from '@/common/interface/group';
import { createEntityHooks } from '@/lib/core/hook-factory';
import { groupService } from '@/services/group/group.service';

const defaultGroupValues = (): GroupCreateDTO => ({
  code: '',
  name: '',
  description: '',
  teamId: '',
});

export const {
  useQueries: useGroupQueries,
  useMutations: useGroupMutations,
  useHelpers: useGroupHelpers,
  useEntity: useGroup,
} = createEntityHooks<
  Group,
  GroupCondDTO,
  GroupCreateDTO,
  GroupUpdateDTO
>('group', groupService, defaultGroupValues);

// Initialize group context function
export const initializeGroupContext = () => {
  return useGroup();
};

export default useGroup;
