import { useMemo } from 'react';

import { useWorkShifts } from './useWorkShifts';

import { AttendanceStatus, DigitalForm, DigitalFormEntry } from '@/common/types/digital-form';

interface FormStatsOptions {
  includeAttendance?: boolean;
  includeProductivity?: boolean;
  includeQuality?: boolean;
  includeHourlyBreakdown?: boolean;
}

/**
 * Hook for digital form statistics
 * Provides analytics and statistics for digital forms and entries
 */
export const useDigitalFormStats = (
  form?: DigitalForm | null,
  entries?: DigitalFormEntry[],
  options: FormStatsOptions = {
    includeAttendance: true,
    includeProductivity: true,
    includeQuality: true,
    includeHourlyBreakdown: true,
  },
) => {
  const { timeSlots, calculateTotalOutput } = useWorkShifts(form?.shiftType);

  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        totalWorkers: 0,
        present: 0,
        absent: 0,
        late: 0,
        earlyLeave: 0,
        leaveApproved: 0,
        presentPercentage: 0,
      };
    }

    const totalWorkers = entries.length;
    const present = entries.filter(e => e.attendanceStatus === AttendanceStatus.PRESENT).length;
    const absent = entries.filter(e => e.attendanceStatus === AttendanceStatus.ABSENT).length;
    const late = entries.filter(e => e.attendanceStatus === AttendanceStatus.LATE).length;
    const earlyLeave = entries.filter(
      e => e.attendanceStatus === AttendanceStatus.EARLY_LEAVE,
    ).length;
    const leaveApproved = entries.filter(
      e => e.attendanceStatus === AttendanceStatus.LEAVE_APPROVED,
    ).length;

    const presentPercentage = totalWorkers > 0 ? Math.round((present / totalWorkers) * 100) : 0;

    return {
      totalWorkers,
      present,
      absent,
      late,
      earlyLeave,
      leaveApproved,
      presentPercentage,
    };
  }, [entries]);

  // Calculate productivity statistics
  const productivityStats = useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        totalOutput: 0,
        averageOutput: 0,
        plannedOutput: 0,
        completionRate: 0,
      };
    }

    // Total actual output
    const totalOutput = entries.reduce((sum, entry) => sum + (entry.totalOutput || 0), 0);

    // Calculate planned output
    const plannedOutput = entries.reduce((sum, entry) => sum + (entry.plannedOutput || 0), 0);

    // Average output per worker
    const presentWorkers = entries.filter(
      e =>
        e.attendanceStatus === AttendanceStatus.PRESENT ||
        e.attendanceStatus === AttendanceStatus.LATE ||
        e.attendanceStatus === AttendanceStatus.EARLY_LEAVE,
    ).length;

    const averageOutput = presentWorkers > 0 ? Math.round(totalOutput / presentWorkers) : 0;

    // Completion rate (percentage of planned output achieved)
    const completionRate = plannedOutput > 0 ? Math.round((totalOutput / plannedOutput) * 100) : 0;

    return {
      totalOutput,
      averageOutput,
      plannedOutput,
      completionRate,
    };
  }, [entries]);

  // Calculate quality statistics
  const qualityStats = useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        averageQuality: 0,
        issueCount: 0,
        issuesByType: {},
        workersWithIssues: 0,
        workersWithoutIssues: 0,
      };
    }

    // Average quality score
    const totalQualityScore = entries.reduce((sum, entry) => sum + (entry.qualityScore || 100), 0);
    const averageQuality = Math.round(totalQualityScore / entries.length);

    // Issues statistics
    let issueCount = 0;
    const issuesByType: Record<string, number> = {};
    const workersWithIssues = entries.filter(
      entry => entry.issues && entry.issues.length > 0,
    ).length;

    entries.forEach(entry => {
      if (entry.issues && entry.issues.length > 0) {
        issueCount += entry.issues.length;

        entry.issues.forEach(issue => {
          issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
        });
      }
    });

    return {
      averageQuality,
      issueCount,
      issuesByType,
      workersWithIssues,
      workersWithoutIssues: entries.length - workersWithIssues,
    };
  }, [entries]);

  // Calculate hourly breakdown statistics
  const hourlyStats = useMemo(() => {
    if (!entries || entries.length === 0 || !timeSlots || timeSlots.length === 0) {
      return [];
    }

    return timeSlots.map(slot => {
      const hourTotal = entries.reduce((sum, entry) => {
        if (entry.hourlyData && entry.hourlyData[slot.label]) {
          return sum + entry.hourlyData[slot.label];
        }
        return sum;
      }, 0);

      const presentWorkers = entries.filter(
        e =>
          e.attendanceStatus === AttendanceStatus.PRESENT ||
          e.attendanceStatus === AttendanceStatus.LATE ||
          e.attendanceStatus === AttendanceStatus.EARLY_LEAVE,
      ).length;

      const hourAverage = presentWorkers > 0 ? Math.round(hourTotal / presentWorkers) : 0;
      const hourCompletionCount = entries.filter(
        entry =>
          entry.hourlyData && entry.hourlyData[slot.label] && entry.hourlyData[slot.label] > 0,
      ).length;
      const filledPercentage =
        presentWorkers > 0 ? Math.round((hourCompletionCount / presentWorkers) * 100) : 0;

      return {
        timeSlot: slot.label,
        startTime: slot.start,
        endTime: slot.end,
        totalOutput: hourTotal,
        averageOutput: hourAverage,
        filledEntries: hourCompletionCount,
        filledPercentage,
      };
    });
  }, [entries, timeSlots]);

  // Calculate form completion percentage
  const completionStats = useMemo(() => {
    if (!entries || entries.length === 0 || !timeSlots || timeSlots.length === 0) {
      return {
        completionPercentage: 0,
        filledTimeSlots: 0,
        totalTimeSlots: 0,
      };
    }

    let filledTimeSlots = 0;
    let totalTimeSlots = 0;

    entries.forEach(entry => {
      // Only count present workers for completion stats
      if (
        entry.attendanceStatus === AttendanceStatus.PRESENT ||
        entry.attendanceStatus === AttendanceStatus.LATE ||
        entry.attendanceStatus === AttendanceStatus.EARLY_LEAVE
      ) {
        totalTimeSlots += timeSlots.length;

        // Count filled time slots
        if (entry.hourlyData) {
          timeSlots.forEach(slot => {
            if (entry.hourlyData[slot.label] && entry.hourlyData[slot.label] > 0) {
              filledTimeSlots++;
            }
          });
        }
      }
    });

    const completionPercentage =
      totalTimeSlots > 0 ? Math.round((filledTimeSlots / totalTimeSlots) * 100) : 0;

    return {
      completionPercentage,
      filledTimeSlots,
      totalTimeSlots,
    };
  }, [entries, timeSlots]);

  // Combined form statistics with all metrics
  const formStats = useMemo(() => {
    return {
      formId: form?.id || '',
      formName: form?.formName || '',
      formDate: form?.date || '',
      status: form?.status,
      factory: {
        id: form?.factoryId || '',
        name: form?.factoryName || '',
      },
      line: {
        id: form?.lineId || '',
        name: form?.lineName || '',
      },
      team: {
        id: form?.teamId || '',
        name: form?.teamName || '',
      },
      group: {
        id: form?.groupId || '',
        name: form?.groupName || '',
      },
      attendance: options.includeAttendance ? attendanceStats : undefined,
      productivity: options.includeProductivity ? productivityStats : undefined,
      quality: options.includeQuality ? qualityStats : undefined,
      hourly: options.includeHourlyBreakdown ? hourlyStats : undefined,
      completion: completionStats,
    };
  }, [
    form,
    options,
    attendanceStats,
    productivityStats,
    qualityStats,
    hourlyStats,
    completionStats,
  ]);

  // Calculate efficiency for a single entry
  const calculateEntryEfficiency = (entry: DigitalFormEntry) => {
    if (!entry.plannedOutput || entry.plannedOutput === 0) return 0;
    return Math.round((entry.totalOutput / entry.plannedOutput) * 100);
  };

  // Calculate total output for a single entry
  const calculateEntryTotalOutput = (entry: DigitalFormEntry) => {
    if (!entry.hourlyData) return entry.totalOutput || 0;
    return calculateTotalOutput(entry.hourlyData);
  };

  return {
    // Statistics
    stats: formStats,
    attendance: attendanceStats,
    productivity: productivityStats,
    quality: qualityStats,
    hourly: hourlyStats,
    completion: completionStats,

    // Utility functions
    calculateEntryEfficiency,
    calculateEntryTotalOutput,
  };
};

export default useDigitalFormStats;
