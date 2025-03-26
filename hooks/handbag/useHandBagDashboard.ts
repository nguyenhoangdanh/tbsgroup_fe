import { useState, useCallback, useEffect } from 'react';
import { useHandBagQueries } from './useHandBagQueries';
import { useHandBagMutations } from './useHandBagMutations';
import { useHandBagHelpers } from './useHandBagHelpers';
import { useBagColorHelpers } from './useBagColorHelpers';
import { HandBag, BagColor, HandBagCondDTO, BagColorCondDTO } from '@/common/interface/handbag';
import { BasePaginationParams } from '../base/useBaseQueries';
import { toast } from '../use-toast';

/**
 * Cấu trúc các thống kê tổng quan
 */
interface DashboardStats {
  totalHandBags: number;
  activeHandBags: number;
  totalColors: number;
  activeColors: number;
  recentlyUpdatedHandBags: HandBag[];
  topHandBags: { handBag: HandBag; colorCount: number }[];
}

/**
 * Hook cho dashboard túi xách, tổng hợp dữ liệu từ nhiều nguồn
 */
export const useHandBagDashboard = () => {
    // State quản lý thống kê
    const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
        totalHandBags: 0,
        activeHandBags: 0,
        totalColors: 0,
        activeColors: 0,
        recentlyUpdatedHandBags: [],
        topHandBags: [],
    });

    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState<Error | null>(null);

    // Sử dụng các hooks liên quan
    const { listItems: listHandBags, getById: getHandBagById } = useHandBagQueries();
    const { listBagColors } = useHandBagQueries();
    const handBagHelpers = useHandBagHelpers();
    const bagColorHelpers = useBagColorHelpers();
    const {
        onHandBagMutationSuccess,
        createHandBagMutation,
        updateHandBagMutation,
        deleteHandBagMutation
    } = useHandBagMutations();

    // HandBag filters và pagination - sử dụng đúng thuộc tính trả về từ useBaseHelpers
    const {
        filterValues: handBagFilters,
        updateFilter: updateHandBagFilter,
        pagination: handBagPagination,
        updatePagination: updateHandBagPagination,
        resetFilters: resetHandBagFilters
    } = handBagHelpers;

    // BagColor filters và pagination - sử dụng đúng thuộc tính trả về từ useBaseHelpers
    const {
        filterValues: bagColorFilters,
        updateFilter: updateBagColorFilter,
        pagination: bagColorPagination,
        updatePagination: updateBagColorPagination,
        resetFilters: resetBagColorFilters
    } = bagColorHelpers;

    // Queries cho danh sách túi xách với filters và pagination
    const {
        data: handBagList,
        isLoading: isLoadingHandBags,
        error: handBagError,
        refetch: refetchHandBags
    } = listHandBags({
        ...handBagFilters,
        ...handBagPagination
    });

    // Queries cho danh sách màu túi với filters và pagination
    const {
        data: bagColorList,
        isLoading: isLoadingBagColors,
        error: bagColorError,
        refetch: refetchBagColors
    } = listBagColors({
        ...bagColorFilters,
        ...bagColorPagination
    });

    /**
     * Tính toán các thống kê tổng quan dựa trên dữ liệu hiện có
     */
    const calculateDashboardStats = useCallback(async () => {
        setIsLoadingStats(true);
        setStatsError(null);

        try {
            // Lấy tất cả túi (không phân trang, giới hạn 500 để tránh quá tải)
            const allHandBagsResponse = await listHandBags({
                limit: 500,
                page: 1,
                sortBy: 'updatedAt',
                sortOrder: 'desc'
            }).refetch();

            const allHandBags = allHandBagsResponse.data?.data || [];

            // Lấy tất cả màu túi (không phân trang, giới hạn 1000)
            const allColorsResponse = await listBagColors({
                limit: 1000,
                page: 1
            }).refetch();

            const allColors = allColorsResponse.data?.data || [];

            // Tính toán các thống kê
            const totalHandBags = allHandBags.length;
            const activeHandBags = allHandBags.filter(bag => bag.active).length;
            const totalColors = allColors.length;
            const activeColors = allColors.filter(color => color.active).length;

            // Túi được cập nhật gần đây (5 túi mới nhất)
            const recentlyUpdated = [...allHandBags]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 5);

            // Tính số lượng màu cho mỗi túi
            const handBagColorCounts = allHandBags.map(bag => {
                const colorCount = allColors.filter(color => color.handBagId === bag.id).length;
                return { handBag: bag, colorCount };
            });

            // Top túi có nhiều màu nhất
            const topHandBags = [...handBagColorCounts]
                .sort((a, b) => b.colorCount - a.colorCount)
                .slice(0, 5);

            // Cập nhật state với thống kê mới
            setDashboardStats({
                totalHandBags,
                activeHandBags,
                totalColors,
                activeColors,
                recentlyUpdatedHandBags: recentlyUpdated,
                topHandBags
            });
        } catch (error) {
            console.error('Failed to calculate dashboard stats:', error);
            setStatsError(error instanceof Error ? error : new Error('Unknown error loading dashboard stats'));
      
            toast({
                title: 'Không thể tải thống kê',
                description: 'Đã xảy ra lỗi khi tải dữ liệu thống kê. Vui lòng thử lại sau.',
                variant: 'destructive',
                duration: 3000,
            });
        } finally {
            setIsLoadingStats(false);
        }
    }, [listHandBags, listBagColors]);

    // Tính toán thống kê khi component được mount
    useEffect(() => {
        calculateDashboardStats();
    }, [calculateDashboardStats]);

    /**
     * Refresh tất cả dữ liệu dashboard
     */
    const refreshDashboardData = useCallback(async () => {
        await refetchHandBags();
        await refetchBagColors();
        await calculateDashboardStats();
    
        toast({
            title: 'Đã cập nhật dữ liệu',
            description: 'Dữ liệu bảng điều khiển đã được cập nhật mới nhất.',
            duration: 2000,
        });
    }, [refetchHandBags, refetchBagColors, calculateDashboardStats]);

    /**
     * Xử lý khi tạo túi xách mới thành công
     */
    const handleCreateHandBagSuccess = useCallback((id: string) => {
        onHandBagMutationSuccess(id);
        refreshDashboardData();
    
        toast({
            title: 'Tạo túi xách thành công',
            description: 'Túi xách mới đã được tạo và thêm vào hệ thống.',
            duration: 2000,
        });
    }, [onHandBagMutationSuccess, refreshDashboardData]);

    /**
     * Xử lý khi cập nhật túi xách thành công
     */
    const handleUpdateHandBagSuccess = useCallback((id: string) => {
        onHandBagMutationSuccess(id);
        refreshDashboardData();
    
        toast({
            title: 'Cập nhật túi xách thành công',
            description: 'Thông tin túi xách đã được cập nhật.',
            duration: 2000,
        });
    }, [onHandBagMutationSuccess, refreshDashboardData]);

    /**
     * Xử lý khi xóa túi xách thành công
     */
    const handleDeleteHandBagSuccess = useCallback((id: string) => {
        onHandBagMutationSuccess(id);
        refreshDashboardData();
    
        toast({
            title: 'Xóa túi xách thành công',
            description: 'Túi xách đã được xóa khỏi hệ thống.',
            duration: 2000,
        });
    }, [onHandBagMutationSuccess, refreshDashboardData]);

    /**
     * Hàm tìm kiếm túi xách nhanh
     */
    const searchHandBags = useCallback((searchTerm: string) => {
        updateHandBagFilter('search', searchTerm);
        refetchHandBags();
    }, [updateHandBagFilter, refetchHandBags]);

    /**
     * Hàm lọc túi xách theo trạng thái active
     */
    const filterHandBagsByStatus = useCallback((active: boolean | undefined) => {
        updateHandBagFilter('active', active);
        refetchHandBags();
    }, [updateHandBagFilter, refetchHandBags]);

    /**
     * Hàm lọc túi xách theo danh mục
     */
    const filterHandBagsByCategory = useCallback((category: string | undefined) => {
        updateHandBagFilter('category', category || '');
        refetchHandBags();
    }, [updateHandBagFilter, refetchHandBags]);

    /**
     * Cập nhật phân trang cho túi xách
     */
    const setHandBagPagination = useCallback((page: number, limit?: number) => {
        updateHandBagPagination(page, limit || handBagPagination.limit);
    }, [updateHandBagPagination, handBagPagination.limit]);

    /**
     * Cập nhật phân trang cho màu túi
     */
    const setBagColorPagination = useCallback((page: number, limit?: number) => {
        updateBagColorPagination(page, limit || bagColorPagination.limit);
    }, [updateBagColorPagination, bagColorPagination.limit]);

    /**
     * Lấy danh sách tất cả các danh mục túi xách
     */
    const getAllCategories = useCallback(() => {
        if (!handBagList?.data) return [];
    
        const categories = new Set<string>();
        handBagList.data.forEach(bag => {
            if (bag.category) categories.add(bag.category);
        });
    
        return Array.from(categories).sort();
    }, [handBagList]);

    /**
     * Lấy tỷ lệ phần trăm túi active
     */
    const getActiveHandBagPercentage = useCallback(() => {
        if (dashboardStats.totalHandBags === 0) return 0;
        return Math.round((dashboardStats.activeHandBags / dashboardStats.totalHandBags) * 100);
    }, [dashboardStats]);

    /**
     * Lấy tỷ lệ phần trăm màu túi active
     */
    const getActiveColorPercentage = useCallback(() => {
        if (dashboardStats.totalColors === 0) return 0;
        return Math.round((dashboardStats.activeColors / dashboardStats.totalColors) * 100);
    }, [dashboardStats]);

    /**
     * Hàm tiện ích để cập nhật nhiều filters cho túi xách
     */
    const setHandBagFilters = useCallback((filters: Partial<HandBagCondDTO>) => {
        Object.entries(filters).forEach(([key, value]) => {
            updateHandBagFilter(key as keyof HandBagCondDTO, value);
        });
        // Sau khi cập nhật filters, gọi refetch để lấy dữ liệu mới
        refetchHandBags();
    }, [updateHandBagFilter, refetchHandBags]);

    /**
     * Hàm tiện ích để cập nhật nhiều filters cho màu túi
     */
    const setBagColorFilters = useCallback((filters: Partial<BagColorCondDTO>) => {
        Object.entries(filters).forEach(([key, value]) => {
            updateBagColorFilter(key as keyof BagColorCondDTO, value);
        });
        // Sau khi cập nhật filters, gọi refetch để lấy dữ liệu mới
        refetchBagColors();
    }, [updateBagColorFilter, refetchBagColors]);

    return {
        // Dữ liệu túi xách
        handBagList,
        bagColorList,
        dashboardStats,
    
        // Loading và Error states
        isLoadingHandBags,
        isLoadingBagColors,
        isLoadingStats,
        handBagError,
        bagColorError,
        statsError,
    
        // Filters và Pagination
        handBagFilters,
        setHandBagFilters,
        handBagPagination,
        setHandBagPagination,
        resetHandBagFilters,
        bagColorFilters,
        setBagColorFilters,
        bagColorPagination,
        setBagColorPagination,
        resetBagColorFilters,
    
        // Mutations
        createHandBagMutation,
        updateHandBagMutation,
        deleteHandBagMutation,
    
        // Callback handlers
        handleCreateHandBagSuccess,
        handleUpdateHandBagSuccess,
        handleDeleteHandBagSuccess,
    
        // Utility functions
        refreshDashboardData,
        searchHandBags,
        filterHandBagsByStatus,
        filterHandBagsByCategory,
        getAllCategories,
        getActiveHandBagPercentage,
        getActiveColorPercentage,
    
        // Queries
        getHandBagById
    };
};