import { createEntityHooks } from '@/lib/core/hook-factory';
import { teamService } from '@/services/team/team.service';
import { Team, TeamCondDTO, TeamCreateDTO, TeamUpdateDTO } from '@/common/interface/team';

const defaultTeamValues = (): TeamCreateDTO => ({
  code: '',
  name: '',
  description: '',
  lineId: '',
});

export const {
  useQueries: useTeamQueries,
  useMutations: useTeamMutations,
  useHelpers: useTeamHelpers,
  useEntity: useTeam,
} = createEntityHooks<
  Team,
  TeamCondDTO,
  TeamCreateDTO,
  TeamUpdateDTO
>('team', teamService, defaultTeamValues);

export const initializeTeamContext = () => {
  return useTeam();
};

export default useTeam;
