import { 
    createBagGroupRate, 
    batchCreateBagGroupRates, 
    deleteBagGroupRate, 
    BagGroupRateCreateDTO, 
    BagGroupRateUpdateDTO, 
    updateBagGroupRate,
    BatchCreateBagGroupRateDTO 
  } from '@/apis/group/bagGroupRate/bag-group-rate.api';
  import { useBaseMutations } from '@/hooks/base/useBaseMutations';
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { toast } from '@/hooks/use-toast';
import { BagGroupRate } from '@/common/interface/bag-group-rate';
  
  /**
   * Hook cho BagGroupRate mutations
   */
  export const useBagGroupRateMutations = () => {
    const queryClient = useQueryClient();
    
    // Sử dụng hook cơ sở cho các mutations của BagGroupRate
    const bagGroupRateMutations = useBaseMutations<BagGroupRate, BagGroupRateCreateDTO, BagGroupRateUpdateDTO>(
      'bag-group-rate',
      createBagGroupRate,
      updateBagGroupRate,
      deleteBagGroupRate
    );
  
    // Mutation tùy chỉnh cho tạo hàng loạt năng suất nhóm
    const batchCreateBagGroupRatesMutation = useMutation({
      mutationFn: (dto: BatchCreateBagGroupRateDTO) => batchCreateBagGroupRates(dto),
      onMutate: async (newData) => {
        // Hủy các truy vấn đang chờ để tránh ghi đè cập nhật lạc quan
        await queryClient.cancelQueries({ queryKey: ['bag-group-rate-list'] });
        await queryClient.cancelQueries({ queryKey: ['bag-group-rates-for-handbag', newData.handBagId] });
  
        // Lưu trữ dữ liệu truy vấn hiện tại
        const previousListData = queryClient.getQueryData(['bag-group-rate-list']);
        const previousHandBagData = queryClient.getQueryData(['bag-group-rates-for-handbag', newData.handBagId]);
  
        return { previousListData, previousHandBagData, handBagId: newData.handBagId };
      },
      onSuccess: async (result) => {
        // Hiển thị thông báo thành công
        toast({
          title: 'Đã lưu năng suất túi theo nhóm thành công',
          description: `${result.length} nhóm đã được cập nhật.`,
          duration: 2000,
        });
  
        // Đánh dấu truy vấn là lỗi thời mà không tự động truy vấn lại
        queryClient.invalidateQueries({
          queryKey: ['bag-group-rate-list'],
          refetchType: 'none',
        });
  
        queryClient.invalidateQueries({
          queryKey: ['bag-group-rates-for-handbag'],
          refetchType: 'none',
        });
  
        queryClient.invalidateQueries({
          queryKey: ['productivity-analysis'],
          refetchType: 'none',
        });
  
        // Vô hiệu hóa truy vấn cụ thể cho từng ID đã tạo hoặc cập nhật
        if (result && result.length > 0) {
          for (const id of result) {
            queryClient.invalidateQueries({
              queryKey: ['bag-group-rate', id],
              refetchType: 'none',
            });
          }
        }
      },
      onError: (error, variables, context) => {
        toast({
          title: 'Không thể lưu năng suất túi theo nhóm',
          description: (error as Error).message || 'Đã xảy ra lỗi khi lưu dữ liệu',
          variant: 'destructive',
          duration: 3000,
        });
  
        // Khôi phục dữ liệu từ context
        if (context?.previousListData) {
          queryClient.setQueryData(['bag-group-rate-list'], context.previousListData);
        }
  
        if (context?.previousHandBagData && context.handBagId) {
          queryClient.setQueryData(['bag-group-rates-for-handbag', context.handBagId], context.previousHandBagData);
        }
      },
    });
  
    // Xử lý onSuccess tùy chỉnh với vô hiệu hóa bộ nhớ cache
    const onBagGroupRateMutationSuccess = async (bagGroupRateId: string) => {
      // Vô hiệu hóa danh sách BagGroupRate
      await queryClient.invalidateQueries({
        queryKey: ['bag-group-rate-list'],
        refetchType: 'none',
      });
  
      // Vô hiệu hóa dữ liệu BagGroupRate cụ thể
      await queryClient.invalidateQueries({
        queryKey: ['bag-group-rate', bagGroupRateId],
        refetchType: 'none',
      });
  
      // Vô hiệu hóa các dữ liệu liên quan
      await queryClient.invalidateQueries({
        queryKey: ['bag-group-rates-for-handbag'],
        refetchType: 'none',
      });
  
      await queryClient.invalidateQueries({
        queryKey: ['bag-group-rates-for-group'],
        refetchType: 'none',
      });
  
      await queryClient.invalidateQueries({
        queryKey: ['productivity-analysis'],
        refetchType: 'none',
      });
    };
  
    return {
      // BagGroupRate mutations
      createBagGroupRateMutation: bagGroupRateMutations.createMutation,
      updateBagGroupRateMutation: bagGroupRateMutations.updateMutation,
      deleteBagGroupRateMutation: bagGroupRateMutations.deleteMutation,
      batchCreateBagGroupRatesMutation,
  
      // Helper vô hiệu hóa bộ nhớ cache tùy chỉnh
      onBagGroupRateMutationSuccess
    };
  };