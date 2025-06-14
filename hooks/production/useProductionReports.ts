'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { fetchWithAuth } from '@/lib/fetcher';

// Định nghĩa kiểu dữ liệu báo cáo
export interface ProductionReport {
  summary: {
    totalOutput: number;
    totalPlanned: number;
    efficiency: number;
    totalForms: number;
    totalEntries: number;
  }
  // Thêm các thuộc tính khác tùy theo loại báo cáo
}

export const useProductionReports = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  /**
   * Lấy báo cáo sản xuất theo nhà máy
   */
  const getFactoryReport = (factoryId: string, startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['production-reports', 'factory', factoryId, startDate, endDate],
      queryFn: async () => {
        const response = await fetchWithAuth(
          `/api/reports/production/factory/${factoryId}?startDate=${startDate}&endDate=${endDate}`
        );
        if (!response.success) {
          throw new Error(response.error || 'Không thể tải báo cáo nhà máy');
        }
        return response.data;
      }
    });
  };

  /**
   * Lấy báo cáo sản xuất theo dây chuyền
   */
  const getLineReport = (lineId: string, startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['production-reports', 'line', lineId, startDate, endDate],
      queryFn: async () => {
        const response = await fetchWithAuth(
          `/api/reports/production/line/${lineId}?startDate=${startDate}&endDate=${endDate}`
        );
        if (!response.success) {
          throw new Error(response.error || 'Không thể tải báo cáo dây chuyền');
        }
        return response.data;
      }
    });
  };

  /**
   * Lấy báo cáo sản xuất theo team
   */
  const getTeamReport = (teamId: string, startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['production-reports', 'team', teamId, startDate, endDate],
      queryFn: async () => {
        const response = await fetchWithAuth(
          `/api/reports/production/team/${teamId}?startDate=${startDate}&endDate=${endDate}`
        );
        if (!response.success) {
          throw new Error(response.error || 'Không thể tải báo cáo team');
        }
        return response.data;
      }
    });
  };

  /**
   * Lấy báo cáo sản xuất theo group
   */
  const getGroupReport = (groupId: string, startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['production-reports', 'group', groupId, startDate, endDate],
      queryFn: async () => {
        const response = await fetchWithAuth(
          `/api/reports/production/group/${groupId}?startDate=${startDate}&endDate=${endDate}`
        );
        if (!response.success) {
          throw new Error(response.error || 'Không thể tải báo cáo group');
        }
        return response.data;
      }
    });
  };

  /**
   * So sánh báo cáo giữa nhiều entities
   */
  const getComparisonReport = (
    entityType: 'team' | 'group',
    entityIds: string[],
    startDate: string,
    endDate: string,
  ) => {
    const entityIdsParam = entityIds.join(',');
    
    return useQuery({
      queryKey: ['production-reports', 'comparison', entityType, entityIdsParam, startDate, endDate],
      queryFn: async () => {
        const response = await fetchWithAuth(
          `/api/reports/production/compare?entityType=${entityType}&entityIds=${entityIdsParam}&startDate=${startDate}&endDate=${endDate}`
        );
        if (!response.success) {
          throw new Error(response.error || 'Không thể tải báo cáo so sánh');
        }
        return response.data;
      }
    });
  };

  /**
   * Xuất báo cáo
   */
  const exportReport = async (
    reportType: 'factory' | 'line' | 'team' | 'group' | 'comparison',
    format: 'excel' | 'pdf' | 'csv',
    params: {
      id?: string;
      entityType?: 'team' | 'group';
      entityIds?: string[];
      startDate: string;
      endDate: string;
    }
  ) => {
    try {
      setIsExporting(true);
      setExportError(null);
      
      let url = `/api/reports/production/export/${reportType}?format=${format}`;
      
      if (params.startDate) url += `&startDate=${params.startDate}`;
      if (params.endDate) url += `&endDate=${params.endDate}`;
      
      if (reportType === 'comparison') {
        if (params.entityType) url += `&entityType=${params.entityType}`;
        if (params.entityIds) url += `&entityIds=${params.entityIds.join(',')}`;
      } else {
        if (params.id) url += `&id=${params.id}`;
      }
      
      const response = await fetchWithAuth(url);
      
      if (!response.success) {
        throw new Error(response.error || 'Không thể xuất báo cáo');
      }
      
      // Mở báo cáo trong tab mới
      if (response.data && response.data.fileUrl) {
        window.open(response.data.fileUrl, '_blank');
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      setExportError(errorMessage);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Lấy thống kê dashboard
   */
  const getDashboardStats = (params: {
    factoryId?: string;
    lineId?: string;
    teamId?: string;
    groupId?: string;
    date?: string;
  }) => {
    // Xây dựng query params
    const queryParams = new URLSearchParams();
    if (params.factoryId) queryParams.append('factoryId', params.factoryId);
    if (params.lineId) queryParams.append('lineId', params.lineId);
    if (params.teamId) queryParams.append('teamId', params.teamId);
    if (params.groupId) queryParams.append('groupId', params.groupId);
    if (params.date) queryParams.append('date', params.date);
    
    return useQuery({
      queryKey: ['production-reports', 'dashboard', params],
      queryFn: async () => {
        const response = await fetchWithAuth(
          `/api/reports/production/dashboard?${queryParams}`
        );
        if (!response.success) {
          throw new Error(response.error || 'Không thể tải thống kê dashboard');
        }
        return response.data;
      },
      // Cập nhật dữ liệu mỗi 5 phút
      refetchInterval: 5 * 60 * 1000,
    });
  };

  return {
    getFactoryReport,
    getLineReport,
    getTeamReport,
    getGroupReport,
    getComparisonReport,
    getDashboardStats,
    exportReport,
    isExporting,
    exportError,
  };
};

export default useProductionReports;