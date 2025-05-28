'use client';
import { useState, useMemo } from 'react';

import { useDigitalFormQueries } from './useDigitalFormQueries';
import { useDigitalFormReports, DATE_RANGES } from './useDigitalFormReports';

/**
 * Example hook for a report page component
 * Shows how to properly use the restructured hooks together
 */
export const useDigitalFormReportPage = () => {
  // Get query tools and report tools
  const queries = useDigitalFormQueries();
  const reportTools = useDigitalFormReports();

  // State for report parameters
  const [reportType, setReportType] = useState<
    'factory' | 'line' | 'team' | 'group' | 'comparison'
  >('factory');
  const [entityId, setEntityId] = useState<string>('');
  const [dateRangeType, setDateRangeType] = useState<string>(DATE_RANGES.THIS_WEEK);
  const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareBy, setCompareBy] = useState<'team' | 'group'>('team');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');

  // Options for the report
  const [options, setOptions] = useState({
    includeLines: false,
    includeTeams: false,
    includeGroups: false,
    includeWorkers: false,
    groupByBag: true,
    groupByProcess: true,
    includeTimeSeries: true,
  });

  // Calculate the effective date range
  const dateRange = useMemo(() => {
    if (dateRangeType === DATE_RANGES.CUSTOM) {
      return customDateRange;
    }
    return reportTools.getDateRange(dateRangeType);
  }, [dateRangeType, customDateRange, reportTools]);

  // Create the appropriate query based on reportType
  const reportQuery = useMemo(() => {
    if (!entityId) return null;

    switch (reportType) {
      case 'factory':
        return queries.createFactoryReportQuery(entityId, dateRange.from, dateRange.to, {
          includeLines: options.includeLines,
          includeTeams: options.includeTeams,
          includeGroups: options.includeGroups,
          groupByBag: options.groupByBag,
          groupByProcess: options.groupByProcess,
        });
      case 'line':
        return queries.createLineReportQuery(entityId, dateRange.from, dateRange.to, {
          includeTeams: options.includeTeams,
          includeGroups: options.includeGroups,
          groupByBag: options.groupByBag,
          groupByProcess: options.groupByProcess,
        });
      case 'team':
        return queries.createTeamReportQuery(entityId, dateRange.from, dateRange.to, {
          includeGroups: options.includeGroups,
          includeWorkers: options.includeWorkers,
          groupByBag: options.groupByBag,
          groupByProcess: options.groupByProcess,
        });
      case 'group':
        return queries.createGroupReportQuery(entityId, dateRange.from, dateRange.to, {
          includeWorkers: options.includeWorkers,
          detailedAttendance: true,
          groupByBag: options.groupByBag,
          groupByProcess: options.groupByProcess,
        });
      case 'comparison':
        return queries.createComparisonReportQuery(
          entityId, // lineId for comparison
          compareIds,
          compareBy,
          dateRange.from,
          dateRange.to,
          {
            includeHandBags: options.groupByBag,
            includeProcesses: options.groupByProcess,
            includeTimeSeries: options.includeTimeSeries,
          },
        );
      default:
        return null;
    }
  }, [reportType, entityId, dateRange, compareIds, compareBy, options, queries]);

  // Export the current report
  const exportReport = async () => {
    try {
      switch (reportType) {
        case 'factory':
          return await reportTools.exportFactoryReport(entityId, dateRange, format, {
            includeLines: options.includeLines,
            includeTeams: options.includeTeams,
            includeGroups: options.includeGroups,
            groupByBag: options.groupByBag,
            groupByProcess: options.groupByProcess,
          });
        case 'line':
          return await reportTools.exportLineReport(entityId, dateRange, format, {
            includeTeams: options.includeTeams,
            includeGroups: options.includeGroups,
            groupByBag: options.groupByBag,
            groupByProcess: options.groupByProcess,
          });
        case 'team':
          return await reportTools.exportTeamReport(entityId, dateRange, format, {
            includeGroups: options.includeGroups,
            includeWorkers: options.includeWorkers,
            groupByBag: options.groupByBag,
            groupByProcess: options.groupByProcess,
          });
        case 'group':
          return await reportTools.exportGroupReport(entityId, dateRange, format, {
            includeWorkers: options.includeWorkers,
            detailedAttendance: true,
            groupByBag: options.groupByBag,
            groupByProcess: options.groupByProcess,
          });
        case 'comparison':
          return await reportTools.exportComparisonReport(
            entityId,
            compareIds,
            compareBy,
            dateRange,
            format,
            {
              includeHandBags: options.groupByBag,
              includeProcesses: options.groupByProcess,
              includeTimeSeries: options.includeTimeSeries,
            },
          );
        default:
          throw new Error('Invalid report type');
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      return null;
    }
  };

  return {
    // Report parameters
    reportType,
    setReportType,
    entityId,
    setEntityId,
    dateRangeType,
    setDateRangeType,
    customDateRange,
    setCustomDateRange,
    compareIds,
    setCompareIds,
    compareBy,
    setCompareBy,
    format,
    setFormat,
    options,
    setOptions,

    // Effective date range
    dateRange,

    // Report data
    reportData: reportQuery?.data,
    isLoading: reportQuery?.isLoading || reportTools.isLoading,
    isError: reportQuery?.isError || !!reportTools.error,
    error: reportQuery?.error || reportTools.error,

    // Export function
    exportReport,

    // Date range constants
    DATE_RANGES,
  };
};

export default useDigitalFormReportPage;
