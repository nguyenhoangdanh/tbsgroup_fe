import { useQueryClient } from '@tanstack/react-query';

import {
  createBagProcess,
  updateBagProcess,
  deleteBagProcess,
  BagProcessCreateDTO,
  BagProcessUpdateDTO,
} from '@/apis/handbag/bagProcess.api';
import { BagProcess } from '@/common/interface/handbag';
import { useBaseMutations } from '@/hooks/base/useBaseMutations';

/**
 * Hook for BagProcess mutations
 */
export const useBagProcessMutations = () => {
  const queryClient = useQueryClient();

  // Use base mutations hook for BagProcess mutations
  const bagProcessMutations = useBaseMutations<
    BagProcess,
    BagProcessCreateDTO,
    BagProcessUpdateDTO
  >('bagProcess', createBagProcess, updateBagProcess, deleteBagProcess);

  //  Custom onSuccess handler with cache invalidation
  const onBagProcessMutationSuccess = async (bagProcessId: string) => {
    // Invalidate general bagProcess lists
    await queryClient.invalidateQueries({
      queryKey: ['bagProcess-list'],
      refetchType: 'none',
    });

    // Invalidate specific bagProcess data
    await queryClient.invalidateQueries({
      queryKey: ['bagProcess', bagProcessId],
      refetchType: 'none',
    });
  };

  return {
    // BagProcess mutations
    createBagProcessMutation: bagProcessMutations.createMutation,
    updateBagProcessMutation: bagProcessMutations.updateMutation,
    deleteBagProcessMutation: bagProcessMutations.deleteMutation,

    // Custom cache invalidation helper
    onBagProcessMutationSuccess,
  };
};
