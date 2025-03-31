import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useBaseQueries } from '@/hooks/base/useBaseQueries';
import { 
  getBagGroupRateById, 
  getBagGroupRatesList, 
  getBagGroupRatesForHandBag,
  getBagGroupRatesForGroup,
  getProductivityAnalysisForHandBag,
  BagGroupRateCondDTO, 
  getGroupedBagGroupRates,
  getHandBagGroupRatesDetailsApi
} from '@/apis/group/bagGroupRate/bag-group-rate.api';
import { BagGroupRate } from '@/common/interface/bag-group-rate';

/**
 * Hook cho BagGroupRate queries
 */
export const useBagGroupRateQueries = () => {
  const queryClient = useQueryClient();
  
  /**
   * Xử lý lỗi truy vấn với thông báo toast
   */
  const handleQueryError = useCallback((error: any, queryName: string) => {
    // Trích xuất thông điệp lỗi một cách an toàn
    let errorMessage = 'Lỗi không xác định';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = error.message as string;
    }
    
    // Hiển thị toast với thông báo an toàn
    toast({
      title: `Không thể tải dữ liệu ${queryName}`,
      description: errorMessage || 'Vui lòng thử lại sau',
      variant: 'destructive',
      duration: 3000,
    });
  }, []);

  // Sử dụng hook truy vấn cơ sở cho BagGroupRate
  const bagGroupRateQueries = useBaseQueries<BagGroupRate, BagGroupRateCondDTO>(
    'bag-group-rate',
    getBagGroupRatesList,
    getBagGroupRateById,
    undefined,
    handleQueryError
  );

  /**
   * Tải trước thông tin BagGroupRate theo ID
   */
  const prefetchBagGroupRateById = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        await queryClient.prefetchQuery({
          queryKey: ['bag-group-rate', id],
          queryFn: async () => {
            const response = await getBagGroupRateById(id);
            return response;
          },
          staleTime: 5 * 60 * 1000, // 5 phút
          gcTime: 60 * 60 * 1000, // 60 phút
        });
      } catch (error) {
        console.error(`Không thể tải trước thông tin BagGroupRate với ID ${id}:`, error);
      }
    },
    [queryClient]
  );

  /**
   * Lấy danh sách năng suất dựa trên mã túi
   */
  const getBagGroupRatesForHandBagQuery = useCallback(
    (handBagId: string, options?: any) => {
      return useQueryClient().fetchQuery({
        queryKey: ['bag-group-rates-for-handbag', handBagId],
        queryFn: async () => {
          if (!handBagId) throw new Error('ID túi xách là bắt buộc');
          try {
            return await getBagGroupRatesForHandBag(handBagId);
          } catch (error) {
            handleQueryError(error, 'năng suất túi theo nhóm');
            throw error;
          }
        },
        staleTime: 5 * 60 * 1000, // 5 phút
        ...options
      });
    },
    [handleQueryError]
  );

  /**
   * Lấy danh sách năng suất dựa trên nhóm
   */
  const getBagGroupRatesForGroupQuery = useCallback(
    (groupId: string, options?: any) => {
      return useQueryClient().fetchQuery({
        queryKey: ['bag-group-rates-for-group', groupId],
        queryFn: async () => {
          if (!groupId) throw new Error('ID nhóm là bắt buộc');
          try {
            return await getBagGroupRatesForGroup(groupId);
          } catch (error) {
            handleQueryError(error, 'năng suất túi theo nhóm');
            throw error;
          }
        },
        staleTime: 5 * 60 * 1000, // 5 phút
        ...options
      });
    },
    [handleQueryError]
  );

  /**
   * Lấy phân tích năng suất theo mã túi
   */
  const getProductivityAnalysis = useCallback(
    (handBagId: string, options?: any) => {
      return queryClient.fetchQuery({
        queryKey: ['productivity-analysis', handBagId],
        queryFn: async () => {
          if (!handBagId) throw new Error('ID túi xách là bắt buộc');
          try {
            return await getProductivityAnalysisForHandBag(handBagId);
          } catch (error) {
            handleQueryError(error, 'phân tích năng suất');
            throw error;
          }
        },
        staleTime: 5 * 60 * 1000, // 5 phút
        ...options
      });
    },
    [queryClient, handleQueryError]
  );

  /**
   * Vô hiệu hóa bộ nhớ cache BagGroupRate
   */
  const invalidateBagGroupRateCache = useCallback(
    async (id: string, forceRefetch = false) => {
      if (!id) return;

      try {
        await queryClient.invalidateQueries({
          queryKey: ['bag-group-rate', id],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error(`Không thể vô hiệu hóa bộ nhớ cache BagGroupRate cho ID ${id}:`, error);
      }
    },
    [queryClient]
  );

  /**
   * Vô hiệu hóa bộ nhớ cache danh sách BagGroupRate
   */
  const invalidateBagGroupRatesCache = useCallback(
    async (forceRefetch = false) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: ['bag-group-rate-list'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        await queryClient.invalidateQueries({
          queryKey: ['bag-group-rates-for-handbag'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        await queryClient.invalidateQueries({
          queryKey: ['bag-group-rates-for-group'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        await queryClient.invalidateQueries({
          queryKey: ['productivity-analysis'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error('Không thể vô hiệu hóa bộ nhớ cache danh sách BagGroupRate:', error);
      }
    },
    [queryClient]
  );

  // Thêm vào useBagGroupRateQueries.ts
const getGroupedBagGroupRatesQuery = useCallback(() => {
  return queryClient.fetchQuery({
    queryKey: ['grouped-bag-group-rates'],
    queryFn: () => getGroupedBagGroupRates(),
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}, [queryClient]);

const getHandBagGroupRatesDetailsQuery = useCallback((handBagId: string) => {
  return queryClient.fetchQuery({
    queryKey: ['handbag-details', handBagId],
    queryFn: () => getHandBagGroupRatesDetailsApi(handBagId),
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}, [queryClient]);

  return {
    ...bagGroupRateQueries,
    prefetchBagGroupRateById,
    getBagGroupRatesForHandBag: (handBagId: string) => ({
      refetch: () => getBagGroupRatesForHandBagQuery(handBagId)
    }),
    getBagGroupRatesForGroup: (groupId: string) => ({
      refetch: () => getBagGroupRatesForGroupQuery(groupId)
    }),
    getProductivityAnalysis,
    invalidateBagGroupRateCache,
    invalidateBagGroupRatesCache,
    listBagGroupRates: bagGroupRateQueries.listItems,
    getBagGroupRateById: bagGroupRateQueries.getById,
    getGroupedBagGroupRates: getGroupedBagGroupRatesQuery,
    getHandBagGroupRatesDetails: getHandBagGroupRatesDetailsQuery,
  };
};