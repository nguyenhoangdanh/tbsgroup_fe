// hooks/useDigitalFormStats.ts
import { useMemo } from 'react';
import { 
  DigitalForm, 
  DigitalFormEntry, 
  AttendanceStatus 
} from '@/common/types/digital-form';
import { STANDARD_TIME_INTERVALS } from '@/common/constants/time-intervals';

/**
 * Hook for calculating and analyzing digital form statistics
 * Computes useful metrics from form data
 */
export const useDigitalFormStats = (
  form?: DigitalForm | null, 
  entries?: DigitalFormEntry[] | null
) => {
  // Calculate all form stats
  const stats = useMemo(() => {
    if (!form || !entries || !entries.length) {
      return {
        totalEntries: 0,
        totalOutput: 0,
        averageOutput: 0,
        averageQuality: 0,
        present: 0,
        absent: 0,
        late: 0,
        earlyLeave: 0,
        leaveApproved: 0,
        presentPercentage: 0,
        absentPercentage: 0,
        hourlyOutputs: {},
        hourlyStats: [],
      };
    }

    // Basic stats
    const totalEntries = entries.length;
    const totalOutput = entries.reduce((sum, entry) => sum + (entry.totalOutput || 0), 0);
    const averageOutput = totalEntries > 0 ? totalOutput / totalEntries : 0;

    // Quality stats
    const totalQualityScores = entries.reduce((sum, entry) => sum + (entry.qualityScore || 100), 0);
    const averageQuality = totalEntries > 0 ? totalQualityScores / totalEntries : 100;

    // Attendance stats
    const present = entries.filter(entry => entry.attendanceStatus === AttendanceStatus.PRESENT).length;
    const absent = entries.filter(entry => entry.attendanceStatus === AttendanceStatus.ABSENT).length;
    const late = entries.filter(entry => entry.attendanceStatus === AttendanceStatus.LATE).length;
    const earlyLeave = entries.filter(entry => entry.attendanceStatus === AttendanceStatus.EARLY_LEAVE).length;
    const leaveApproved = entries.filter(entry => entry.attendanceStatus === AttendanceStatus.LEAVE_APPROVED).length;

    const presentPercentage = totalEntries > 0 ? (present / totalEntries) * 100 : 0;
    const absentPercentage = totalEntries > 0 ? (absent / totalEntries) * 100 : 0;

    // Hourly output analysis
    const hourlyOutputs: Record<string, number> = {};
    
    // Initialize with 0 for all standard hours
    STANDARD_TIME_INTERVALS.forEach(interval => {
      hourlyOutputs[interval.label] = 0;
    });
    
    // Sum up hourly data from all entries
    entries.forEach(entry => {
      const hourlyData = entry.hourlyData || {};
      Object.entries(hourlyData).forEach(([hour, output]) => {
        if (!hourlyOutputs[hour]) {
          hourlyOutputs[hour] = 0;
        }
        hourlyOutputs[hour] += output;
      });
    });

    // Calculate hourly stats array for charting
    const hourlyStats = Object.entries(hourlyOutputs)
      .map(([hour, total]) => {
        // Count how many entries have data for this hour
        const entriesWithThisHour = entries.filter(
          entry => entry.hourlyData && entry.hourlyData[hour] !== undefined
        ).length;
        
        return {
          hour,
          totalOutput: total,
          averageOutput: entriesWithThisHour > 0 ? total / entriesWithThisHour : 0,
          entriesCount: entriesWithThisHour
        };
      })
      .sort((a, b) => {
        // Sort by time order
        const timeA = a.hour.split('-')[0]; // Get start time
        const timeB = b.hour.split('-')[0]; // Get start time
        return timeA.localeCompare(timeB);
      });

    return {
      totalEntries,
      totalOutput,
      averageOutput,
      averageQuality,
      present,
      absent,
      late,
      earlyLeave,
      leaveApproved,
      presentPercentage,
      absentPercentage,
      hourlyOutputs,
      hourlyStats,
    };
  }, [form, entries]);

  /**
   * Calculate outputs grouped by a specific entity (user, bag, process, etc.)
   */
  const getOutputByEntity = (entityId: string, entityType: 'user' | 'handBag' | 'process' | 'bagColor' = 'user') => {
    if (!entries) return { totalOutput: 0, qualityScore: 0 };

    const filteredEntries = entries.filter(entry => {
      if (entityType === 'user') return entry.userId === entityId;
      if (entityType === 'handBag') return entry.handBagId === entityId;
      if (entityType === 'process') return entry.processId === entityId;
      if (entityType === 'bagColor') return entry.bagColorId === entityId;
      return false;
    });

    if (!filteredEntries.length) return { totalOutput: 0, qualityScore: 0 };

    const totalOutput = filteredEntries.reduce((sum, entry) => sum + (entry.totalOutput || 0), 0);
    const totalQuality = filteredEntries.reduce((sum, entry) => sum + (entry.qualityScore || 100), 0);
    const averageQuality = filteredEntries.length > 0 ? totalQuality / filteredEntries.length : 100;
    
    return {
      totalOutput,
      qualityScore: averageQuality,
      entries: filteredEntries,
    };
  };

  /**
   * Get hourly data for a specific entity
   */
  const getHourlyDataByEntity = (entityId: string, entityType: 'user' | 'handBag' | 'process' | 'bagColor' = 'user') => {
    if (!entries) return {};

    const filteredEntries = entries.filter(entry => {
      if (entityType === 'user') return entry.userId === entityId;
      if (entityType === 'handBag') return entry.handBagId === entityId;
      if (entityType === 'process') return entry.processId === entityId;
      if (entityType === 'bagColor') return entry.bagColorId === entityId;
      return false;
    });

    if (!filteredEntries.length) return {};

    // Initialize with standard hours
    const hourlyData: Record<string, number> = {};
    
    STANDARD_TIME_INTERVALS.forEach(interval => {
      hourlyData[interval.label] = 0;
    });

    // Sum up hourly data
    filteredEntries.forEach(entry => {
      const entryHourlyData = entry.hourlyData || {};
      Object.entries(entryHourlyData).forEach(([hour, output]) => {
        if (!hourlyData[hour]) {
          hourlyData[hour] = 0;
        }
        hourlyData[hour] += output;
      });
    });

    return hourlyData;
  };

  return {
    stats,
    getOutputByEntity,
    getHourlyDataByEntity
  };
};