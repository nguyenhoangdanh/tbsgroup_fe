import { Team, TeamCondDTO, TeamCreateDTO, TeamUpdateDTO } from '@/common/interface/team';
import { createEntityHooks } from '@/lib/core/hook-factory';
import { teamService } from '@/services/team/team.service';

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

// Initialize team context function
export const initializeTeamContext = () => {
  return useTeam();
};
