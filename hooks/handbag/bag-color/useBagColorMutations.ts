import { useQueryClient } from '@tanstack/react-query';

import { createBagColor, updateBagColor, deleteBagColor } from '@/apis/handbag/handbag.api';
import { BagColor, BagColorCreateDTO, BagColorUpdateDTO } from '@/common/interface/handbag';
import { useBaseMutations } from '@/hooks/base/useBaseMutations';

/**
 * Hook for BagColor mutations
 */
export const useBagColorMutations = () => {
  const queryClient = useQueryClient();

  const bagColorMutations = useBaseMutations<BagColor, BagColorCreateDTO, BagColorUpdateDTO>(
    'bagColor',
    createBagColor,
    updateBagColor,
    deleteBagColor,
  );

  const onBagColorMutationSuccess = (bagColorId: string, handBagId?: string) => {
    // Invalidate general bagColor lists
    queryClient.invalidateQueries({
      queryKey: ['bagColor-list'],
      refetchType: 'none',
    });

    //  Invalidate specific bagColor data
    queryClient.invalidateQueries({
      queryKey: ['bagColor', bagColorId],
      refetchType: 'none',
    });

    // Invalidate parent handbag detail views if handBagId is provided
    if (handBagId) {
      queryClient.invalidateQueries({
        queryKey: ['handBag', handBagId],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['handBag', handBagId, 'fullDetails'],
        refetchType: 'none',
      });
    }
  };

  return {
    // BagColor mutations
    createBagColorMutation: bagColorMutations.createMutation,
    updateBagColorMutation: bagColorMutations.updateMutation,
    deleteBagColorMutation: bagColorMutations.deleteMutation,

    //  Custom cache invalidation helper
    onBagColorMutationSuccess,
  };
};
