// hooks/digital-form/useDigitalFormStats.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDigitalForms } from './useDigitalForms';
import { RecordStatus, ShiftType } from '@/common/types/digital-form';
import { format, isValid, parseISO, subDays } from 'date-fns';

interface DigitalFormStatsOptions {
    lookbackDays?: number;
    maxItems?: number;
}

/**
 * Type definitions for statistics
 */
interface FormStats {
    totalForms: number;
    byStatus: Record<RecordStatus, number>;
    byShift: Record<ShiftType, number>;
    weeklyTrend: { date: string; count: number }[];
    recentlyCreated: any[];
    pendingApproval: any[];
    topLines: { lineId: string; lineName: string; count: number }[];
    totalEntries: number;
    averageEntriesPerForm: number;
}

/**
 * Hook for generating and tracking digital form statistics
 * Optimized for dashboard performance
 */
export const useDigitalFormStats = (options: DigitalFormStatsOptions = {}) => {
    const { lookbackDays = 30, maxItems = 5 } = options;

    // State for statistics
    const [stats, setStats] = useState<FormStats>({
        totalForms: 0,
        byStatus: {
            [RecordStatus.DRAFT]: 0,
            [RecordStatus.PENDING]: 0,
            [RecordStatus.CONFIRMED]: 0,
            [RecordStatus.REJECTED]: 0
        },
        byShift: {
            [ShiftType.REGULAR]: 0,
            [ShiftType.EXTENDED]: 0,
            [ShiftType.OVERTIME]: 0
        },
        weeklyTrend: [],
        recentlyCreated: [],
        pendingApproval: [],
        topLines: [],
        totalEntries: 0,
        averageEntriesPerForm: 0
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Calculate lookback date once
    const lookbackDate = useMemo(() => {
        const date = new Date();
        return subDays(date, lookbackDays);
    }, [lookbackDays]);

    const formattedLookbackDate = useMemo(() => {
        return format(lookbackDate, 'yyyy-MM-dd');
    }, [lookbackDate]);

    // Get digital forms hook
    const digitalForms = useDigitalForms();

    // Fetch forms with proper lookback period
    const { data: formsData, isLoading: isLoadingForms, refetch } = digitalForms.listForms({
        dateFrom: formattedLookbackDate,
        limit: 500, // Get a large sample for good statistics
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    /**
     * Calculate statistics from forms data
     */
    const calculateStats = useCallback((forms: any[] = []) => {
        if (!forms.length) {
            return { ...stats, totalForms: 0 };
        }

        try {
            // Initialize counters
            const byStatus: Record<RecordStatus, number> = {
                [RecordStatus.DRAFT]: 0,
                [RecordStatus.PENDING]: 0,
                [RecordStatus.CONFIRMED]: 0,
                [RecordStatus.REJECTED]: 0
            };

            const byShift: Record<ShiftType, number> = {
                [ShiftType.REGULAR]: 0,
                [ShiftType.EXTENDED]: 0,
                [ShiftType.OVERTIME]: 0
            };

            // Count by date for trend
            const dateCounts: Record<string, number> = {};

            // Track lines for top lines
            const lineCounts: Record<string, { count: number; name: string }> = {};

            // Process each form
            forms.forEach(form => {
                // Count by status
                if (form.status && byStatus[form.status as RecordStatus] !== undefined) {
                    byStatus[form.status as RecordStatus]++;
                }

                // Count by shift type
                if (form.shiftType && byShift[form.shiftType as ShiftType] !== undefined) {
                    byShift[form.shiftType as ShiftType]++;
                }

                // Track by date for trend analysis
                if (form.createdAt && isValid(parseISO(form.createdAt))) {
                    const dateStr = format(new Date(form.createdAt), 'yyyy-MM-dd');
                    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
                }

                // Track lines
                if (form.lineId) {
                    if (!lineCounts[form.lineId]) {
                        lineCounts[form.lineId] = {
                            count: 0,
                            name: form.lineName || `Line ${form.lineId.slice(0, 8)}`
                        };
                    }
                    lineCounts[form.lineId].count++;
                }
            });

            // Create weekly trend - last 7 days
            const weeklyTrend: { date: string; count: number }[] = [];
            const today = new Date();

            // Create data for the last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = subDays(today, i);
                const dateStr = format(date, 'yyyy-MM-dd');
                weeklyTrend.push({
                    date: format(date, 'MM/dd'),
                    count: dateCounts[dateStr] || 0
                });
            }

            // Get most recent forms
            const recentlyCreated = forms
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, maxItems);

            // Get pending approval forms
            const pendingApproval = forms
                .filter(form => form.status === RecordStatus.PENDING)
                .sort((a, b) => new Date(b.submitTime || b.updatedAt).getTime() - new Date(a.submitTime || a.updatedAt).getTime())
                .slice(0, maxItems);

            // Get top lines
            const topLines = Object.entries(lineCounts)
                .map(([lineId, { count, name }]) => ({ lineId, lineName: name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, maxItems);

            // Estimate total entries and average
            // Direct count is impossible without loading all entries
            // Use an estimation based on the forms we have
            let totalEntries = 0;
            forms.forEach(form => {
                // If we have the actual entry count, use it
                if (form.entryCount) {
                    totalEntries += form.entryCount;
                } else {
                    // Otherwise use a reasonable default based on your domain
                    // Typically 5-10 entries per form
                    totalEntries += 8; // Average estimate
                }
            });

            const averageEntriesPerForm = forms.length > 0
                ? Math.round(totalEntries / forms.length * 10) / 10 // Round to 1 decimal
                : 0;

            // Return compiled stats
            return {
                totalForms: forms.length,
                byStatus,
                byShift,
                weeklyTrend,
                recentlyCreated,
                pendingApproval,
                topLines,
                totalEntries,
                averageEntriesPerForm
            };
        } catch (error) {
            console.error("Error calculating form statistics:", error);
            // Return current stats if error occurs
            return { ...stats, totalForms: forms.length };
        }
    }, [stats, maxItems]);

    /**
     * Effect to update statistics when forms data changes
     */
    useEffect(() => {
        if (!isLoadingForms && formsData?.data) {
            try {
                const calculatedStats = calculateStats(formsData.data);
                setStats(calculatedStats);
                setLastUpdated(new Date());
                setError(null);
            } catch (err) {
                console.error("Error processing form statistics:", err);
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setIsLoading(false);
            }
        }
    }, [formsData, isLoadingForms, calculateStats]);

    /**
     * Refresh the statistics
     */
    const refreshStats = useCallback(async () => {
        setIsLoading(true);
        try {
            await refetch();
        } catch (err) {
            console.error("Error refreshing form statistics:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    }, [refetch]);

    /**
     * Generate chart data for dashboard consumption
     */
    const generateChartData = useCallback(() => {
        // Status distribution for pie/donut chart
        const statusChart = Object.entries(stats.byStatus).map(([status, count]) => ({
            id: status,
            label: status,
            value: count
        }));

        // Shift distribution for pie/donut chart
        const shiftChart = Object.entries(stats.byShift).map(([shift, count]) => ({
            id: shift,
            label: shift,
            value: count
        }));

        // Weekly trend for line/bar chart
        const trendChart = stats.weeklyTrend;

        return {
            statusChart,
            shiftChart,
            trendChart
        };
    }, [stats.byStatus, stats.byShift, stats.weeklyTrend]);

    return {
        stats,
        isLoading: isLoading || isLoadingForms,
        error,
        lastUpdated,
        refreshStats,
        chartData: generateChartData(),

        // Convenient extracted stats
        totalForms: stats.totalForms,
        draftForms: stats.byStatus[RecordStatus.DRAFT],
        pendingForms: stats.byStatus[RecordStatus.PENDING],
        confirmedForms: stats.byStatus[RecordStatus.CONFIRMED],
        rejectedForms: stats.byStatus[RecordStatus.REJECTED],

        // Recent and pending items
        recentForms: stats.recentlyCreated,
        pendingApprovalForms: stats.pendingApproval,

        // Performance indicators
        completionRate: stats.totalForms > 0
            ? Math.round((stats.byStatus[RecordStatus.CONFIRMED] / stats.totalForms) * 100)
            : 0,
        rejectionRate: stats.totalForms > 0
            ? Math.round((stats.byStatus[RecordStatus.REJECTED] / stats.totalForms) * 100)
            : 0
    };
};