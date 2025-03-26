import { useBaseMutations } from '../base/useBaseMutations';
import {
  createHandBag,
  updateHandBag,
  deleteHandBag,
  createBagColor,
  updateBagColor,
  deleteBagColor,
  createBagColorProcess,
  updateBagColorProcess,
  deleteBagColorProcess,
} from '@/apis/handbag/handbag.api';
import {
  HandBag,
  HandBagCreateDTO,
  HandBagUpdateDTO,
  BagColor,
  BagColorCreateDTO,
  BagColorUpdateDTO,
  BagColorProcess,
  BagColorProcessCreateDTO,
  BagColorProcessUpdateDTO,
} from '@/common/interface/handbag';
import { useQueryClient } from '@tanstack/react-query';
import { useHandBagDetails, HandBagWithDetails } from './useHandBagDetails';

/**
 * Hook cho HandBag mutations
 */
export const useHandBagMutations = () => {
  const queryClient = useQueryClient();

  // Sử dụng hook cơ sở cho HandBag mutations
  const handBagMutations = useBaseMutations<HandBag, HandBagCreateDTO, HandBagUpdateDTO>(
    'handBag',
    createHandBag,
    updateHandBag,
    deleteHandBag
  );

  // Sử dụng hook cơ sở cho BagColor mutations
  const bagColorMutations = useBaseMutations<BagColor, BagColorCreateDTO, BagColorUpdateDTO>(
    'bagColor',
    createBagColor,
    updateBagColor,
    deleteBagColor
  );

  // Sử dụng hook cơ sở cho BagColorProcess mutations
  const bagColorProcessMutations = useBaseMutations<BagColorProcess, BagColorProcessCreateDTO, BagColorProcessUpdateDTO>(
    'bagColorProcess',
    createBagColorProcess,
    updateBagColorProcess,
    deleteBagColorProcess
  );

  // Custom onSuccess handlers with cache invalidation
  const onHandBagMutationSuccess = (handBagId: string) => {
    // Invalidate general handbag lists
    queryClient.invalidateQueries({
      queryKey: ['handBag-list'],
      refetchType: 'none',
    });

    // Invalidate specific handbag data
    queryClient.invalidateQueries({
      queryKey: ['handBag', handBagId],
      refetchType: 'none',
    });

    // Invalidate detail view if it exists
    queryClient.invalidateQueries({
      queryKey: ['handBag', handBagId, 'fullDetails'],
      refetchType: 'none',
    });
  };

  const onBagColorMutationSuccess = (bagColorId: string, handBagId?: string) => {
    // Invalidate color lists
    queryClient.invalidateQueries({
      queryKey: ['bagColor-list'],
      refetchType: 'none',
    });

    // Invalidate specific color data
    queryClient.invalidateQueries({
      queryKey: ['bagColor', bagColorId],
      refetchType: 'none',
    });

    // Invalidate parent handbag detail view if parent ID is provided
    if (handBagId) {
      queryClient.invalidateQueries({
        queryKey: ['handBag', handBagId, 'fullDetails'],
        refetchType: 'none',
      });
    }
  };

  const onBagColorProcessMutationSuccess = (processId: string, bagColorId?: string, handBagId?: string) => {
    // Invalidate process lists
    queryClient.invalidateQueries({
      queryKey: ['bagColorProcess-list'],
      refetchType: 'none',
    });

    // Invalidate specific process data
    queryClient.invalidateQueries({
      queryKey: ['bagColorProcess', processId],
      refetchType: 'none',
    });

    // Invalidate parent color and handbag detail views if IDs are provided
    if (bagColorId) {
      queryClient.invalidateQueries({
        queryKey: ['bagColor', bagColorId],
        refetchType: 'none',
      });

      if (handBagId) {
        queryClient.invalidateQueries({
          queryKey: ['handBag', handBagId, 'fullDetails'],
          refetchType: 'none',
        });
      }
    }
  };

  return {
    // HandBag mutations
    createHandBagMutation: handBagMutations.createMutation,
    updateHandBagMutation: handBagMutations.updateMutation,
    deleteHandBagMutation: handBagMutations.deleteMutation,

    // BagColor mutations
    createBagColorMutation: bagColorMutations.createMutation,
    updateBagColorMutation: bagColorMutations.updateMutation,
    deleteBagColorMutation: bagColorMutations.deleteMutation,

    // BagColorProcess mutations
    createBagColorProcessMutation: bagColorProcessMutations.createMutation,
    updateBagColorProcessMutation: bagColorProcessMutations.updateMutation,
    deleteBagColorProcessMutation: bagColorProcessMutations.deleteMutation,

    // Custom cache invalidation helpers
    onHandBagMutationSuccess,
    onBagColorMutationSuccess,
    onBagColorProcessMutationSuccess
  };
};