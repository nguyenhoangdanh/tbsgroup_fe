  import { createGroup, deleteGroup, GroupCreateDTO, GroupUpdateDTO, updateGroup } from '@/apis/group/group.api';
import { Group } from '@/common/interface/group';
import { useBaseMutations } from '@/hooks/base/useBaseMutations';
  import { useQueryClient } from '@tanstack/react-query';
  
  /**
   * Hook for Group mutations
   */
  export const useGroupMutations = () => {
    const queryClient = useQueryClient();
  
    // Use base mutations hook for Group mutations
    const groupMutations = useBaseMutations<Group, GroupCreateDTO, GroupUpdateDTO>(
      'group',
      createGroup,
      updateGroup,
      deleteGroup
    );
  
    // Custom onSuccess handler with cache invalidation
    const onGroupMutationSuccess = async (groupId: string) => {
      // Invalidate general group lists
      await queryClient.invalidateQueries({
        queryKey: ['group-list'],
        refetchType: 'none',
      });
  
      // Invalidate specific group data
      await queryClient.invalidateQueries({
        queryKey: ['group', groupId],
        refetchType: 'none',
      });
    };
  
    return {
      // Group mutations
      createGroupMutation: groupMutations.createMutation,
      updateGroupMutation: groupMutations.updateMutation,
      deleteGroupMutation: groupMutations.deleteMutation,
  
      // Custom cache invalidation helper
      onGroupMutationSuccess
    };
  };