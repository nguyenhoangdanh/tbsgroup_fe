"use client";

import React, { createContext, useState, useCallback, useContext, useEffect, ReactNode } from "react";
import { TimeSheetType } from "@/schemas/timesheet";
import { useToast } from "@/hooks/use-toast";
import { TimeSheetService, sampleTimesheets } from "./service/timesheet.service";

// Define filters type
interface TimeSheetFilters {
    employeeId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    page?: number;
    limit?: number;
}

// Define pagination metadata
interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
}

// Define the context type
interface TimeSheetContextType {
    // State
    timesheets: TimeSheetType[];
    selectedTimesheet: TimeSheetType | null;
    loading: boolean;
    error: Error | null;
    filters: TimeSheetFilters;
    pagination: PaginationMeta;

    // Actions
    fetchTimesheets: () => Promise<void>;
    getTimesheetById: (id: string) => Promise<TimeSheetType | null>;
    createTimesheet: (data: Omit<TimeSheetType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TimeSheetType>;
    updateTimesheet: (id: string, data: Partial<TimeSheetType>) => Promise<TimeSheetType>;
    deleteTimesheet: (id: string) => Promise<void>;
    deleteMultipleTimesheets: (ids: string[]) => Promise<void>;
    changeTimesheetStatus: (id: string, status: "draft" | "pending" | "approved" | "rejected") => Promise<TimeSheetType>;
    setSelectedTimesheet: (timesheet: TimeSheetType | null) => void;
    updateFilters: (newFilters: Partial<TimeSheetFilters>) => void;
    updatePagination: (page: number, limit?: number) => void;
    resetError: () => void;
}

// Create the context with default values
const TimeSheetContext = createContext<TimeSheetContextType | undefined>(undefined);

// Provider component
export const TimeSheetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State
    const [timesheets, setTimesheets] = useState<TimeSheetType[]>([]);
    const [selectedTimesheet, setSelectedTimesheet] = useState<TimeSheetType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [filters, setFilters] = useState<TimeSheetFilters>({
        page: 1,
        limit: 10,
    });
    const [pagination, setPagination] = useState<PaginationMeta>({
        total: 0,
        page: 1,
        limit: 10,
    });

    const { toast } = useToast();

    // Fetch timesheets
    const fetchTimesheets = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await TimeSheetService.getAll({
                ...filters,
                page: pagination.page,
                limit: pagination.limit,
            });

            setTimesheets(result.data);
            setPagination(prev => ({ ...prev, total: result.meta.total }));
        } catch (err) {
            console.error('Error fetching timesheets:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch timesheets'));
            toast({
                title: 'Lỗi',
                description: 'Không thể tải dữ liệu phiếu công đoạn',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.limit, toast]);

    // Get timesheet by ID
    const getTimesheetById = useCallback(async (id: string): Promise<TimeSheetType | null> => {
        setLoading(true);
        setError(null);

        try {
            const result = await TimeSheetService.getById(id);
            return result;
        } catch (err) {
            console.error('Error fetching timesheet by ID:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch timesheet'));
            toast({
                title: 'Lỗi',
                description: 'Không thể tải thông tin phiếu công đoạn',
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Create timesheet
    const createTimesheet = useCallback(async (data: Omit<TimeSheetType, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeSheetType> => {
        setLoading(true);
        setError(null);

        try {
            const result = await TimeSheetService.create(data);

            // Refresh list
            fetchTimesheets();

            toast({
                title: 'Thành công',
                description: 'Tạo phiếu công đoạn thành công',
            });

            return result;
        } catch (err) {
            console.error('Error creating timesheet:', err);
            setError(err instanceof Error ? err : new Error('Failed to create timesheet'));
            toast({
                title: 'Lỗi',
                description: 'Không thể tạo phiếu công đoạn',
                variant: 'destructive',
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchTimesheets, toast]);

    // Update timesheet
    const updateTimesheet = useCallback(async (id: string, data: Partial<TimeSheetType>): Promise<TimeSheetType> => {
        setLoading(true);
        setError(null);

        try {
            const result = await TimeSheetService.update(id, data);

            // Update local state if selected timesheet is the updated one
            if (selectedTimesheet && selectedTimesheet.id === id) {
                setSelectedTimesheet(result);
            }

            // Refresh list
            fetchTimesheets();

            toast({
                title: 'Thành công',
                description: 'Cập nhật phiếu công đoạn thành công',
            });

            return result;
        } catch (err) {
            console.error('Error updating timesheet:', err);
            setError(err instanceof Error ? err : new Error('Failed to update timesheet'));
            toast({
                title: 'Lỗi',
                description: 'Không thể cập nhật phiếu công đoạn',
                variant: 'destructive',
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchTimesheets, selectedTimesheet, toast]);

    // Delete timesheet
    const deleteTimesheet = useCallback(async (id: string): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await TimeSheetService.delete(id);

            // Update local state if selected timesheet is the deleted one
            if (selectedTimesheet && selectedTimesheet.id === id) {
                setSelectedTimesheet(null);
            }

            // Refresh list
            fetchTimesheets();

            toast({
                title: 'Thành công',
                description: 'Xóa phiếu công đoạn thành công',
            });
        } catch (err) {
            console.error('Error deleting timesheet:', err);
            setError(err instanceof Error ? err : new Error('Failed to delete timesheet'));
            toast({
                title: 'Lỗi',
                description: 'Không thể xóa phiếu công đoạn',
                variant: 'destructive',
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchTimesheets, selectedTimesheet, toast]);

    // Delete multiple timesheets
    const deleteMultipleTimesheets = useCallback(async (ids: string[]): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await TimeSheetService.deleteMany(ids);

            // Update local state if selected timesheet is one of the deleted
            if (selectedTimesheet && ids.includes(selectedTimesheet.id || '')) {
                setSelectedTimesheet(null);
            }

            // Refresh list
            fetchTimesheets();

            toast({
                title: 'Thành công',
                description: `Xóa ${ids.length} phiếu công đoạn thành công`,
            });
        } catch (err) {
            console.error('Error deleting multiple timesheets:', err);
            setError(err instanceof Error ? err : new Error('Failed to delete timesheets'));
            toast({
                title: 'Lỗi',
                description: 'Không thể xóa các phiếu công đoạn đã chọn',
                variant: 'destructive',
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchTimesheets, selectedTimesheet, toast]);

    // Change timesheet status
    const changeTimesheetStatus = useCallback(async (id: string, status: "draft" | "pending" | "approved" | "rejected"): Promise<TimeSheetType> => {
        setLoading(true);
        setError(null);

        try {
            const result = await TimeSheetService.changeStatus(id, status);

            // Update local state if selected timesheet is the updated one
            if (selectedTimesheet && selectedTimesheet.id === id) {
                setSelectedTimesheet(result);
            }

            // Refresh list
            fetchTimesheets();

            toast({
                title: 'Thành công',
                description: 'Cập nhật trạng thái phiếu công đoạn thành công',
            });

            return result;
        } catch (err) {
            console.error('Error changing timesheet status:', err);
            setError(err instanceof Error ? err : new Error('Failed to change timesheet status'));
            toast({
                title: 'Lỗi',
                description: 'Không thể cập nhật trạng thái phiếu công đoạn',
                variant: 'destructive',
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchTimesheets, selectedTimesheet, toast]);

    // Update filters
    const updateFilters = useCallback((newFilters: Partial<TimeSheetFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        // Reset to first page when filters change
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    // Update pagination
    const updatePagination = useCallback((page: number, limit?: number) => {
        setPagination(prev => ({
            ...prev,
            page,
            limit: limit || prev.limit,
        }));
    }, []);

    // Reset error
    const resetError = useCallback(() => {
        setError(null);
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchTimesheets();
    }, [fetchTimesheets]);

    // Context value
    const value: TimeSheetContextType = {
        timesheets,
        selectedTimesheet,
        loading,
        error,
        filters,
        pagination,

        fetchTimesheets,
        getTimesheetById,
        createTimesheet,
        updateTimesheet,
        deleteTimesheet,
        deleteMultipleTimesheets,
        changeTimesheetStatus,
        setSelectedTimesheet,
        updateFilters,
        updatePagination,
        resetError,
    };

    return (
        <TimeSheetContext.Provider value={value}>
            {children}
        </TimeSheetContext.Provider>
    );
};

// Custom hook to use the timesheet context
export const useTimeSheetContext = () => {
    const context = useContext(TimeSheetContext);
    if (context === undefined) {
        throw new Error('useTimeSheetContext must be used within a TimeSheetProvider');
    }
    return context;
};