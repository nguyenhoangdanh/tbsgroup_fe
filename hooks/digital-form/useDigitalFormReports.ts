// hooks/digital-form-hooks/useDigitalFormReports.ts
import { useCallback } from 'react';
import { useDigitalFormQueries } from './useDigitalFormQueries';
import { useDigitalFormMutations } from './useDigitalFormMutations';
import { 
  FactoryProductionReport, 
  LineProductionReport, 
  TeamProductionReport, 
  GroupProductionReport, 
  ProductionComparisonReport 
} from '@/common/types/digital-form';

/**
 * Hook for accessing digital form report functionality
 * Provides easier access to queries and mutations related to reports
 */
export const useDigitalFormReports = () => {
  const queries = useDigitalFormQueries();
  const mutations = useDigitalFormMutations();

  /**
   * Get factory production report
   */
  const getFactoryReport = useCallback((
    factoryId: string,
    dateFrom: string,
    dateTo: string,
    options?: {
      includeLines?: boolean;
      includeTeams?: boolean;
      includeGroups?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    }
  ) => {
    return queries.getFactoryReport(factoryId, dateFrom, dateTo, options);
  }, [queries]);

  /**
   * Get line production report
   */
  const getLineReport = useCallback((
    lineId: string,
    dateFrom: string,
    dateTo: string,
    options?: {
      includeTeams?: boolean;
      includeGroups?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    }
  ) => {
    return queries.getLineReport(lineId, dateFrom, dateTo, options);
  }, [queries]);

  /**
   * Get team production report
   */
  const getTeamReport = useCallback((
    teamId: string,
    dateFrom: string,
    dateTo: string,
    options?: {
      includeGroups?: boolean;
      includeWorkers?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    }
  ) => {
    return queries.getTeamReport(teamId, dateFrom, dateTo, options);
  }, [queries]);

  /**
   * Get group production report
   */
  const getGroupReport = useCallback((
    groupId: string,
    dateFrom: string,
    dateTo: string,
    options?: {
      includeWorkers?: boolean;
      detailedAttendance?: boolean;
      groupByBag?: boolean;
      groupByProcess?: boolean;
    }
  ) => {
    return queries.getGroupReport(groupId, dateFrom, dateTo, options);
  }, [queries]);

  /**
   * Get comparison report
   */
  const getComparisonReport = useCallback((
    lineId: string,
    entityIds: string[],
    compareBy: 'team' | 'group',
    dateFrom: string,
    dateTo: string,
    options?: {
      includeHandBags?: boolean;
      includeProcesses?: boolean;
      includeTimeSeries?: boolean;
    }
  ) => {
    return queries.getComparisonReport(lineId, entityIds, compareBy, dateFrom, dateTo, options);
  }, [queries]);

  /**
   * Export report as PDF, Excel or CSV
   */
  const exportReport = useCallback((
    reportType: 'team' | 'group' | 'comparison',
    parameters: any,
    format: 'pdf' | 'excel' | 'csv'
  ) => {
    return mutations.exportReportMutation.mutateAsync({
      reportType,
      parameters,
      format
    });
  }, [mutations.exportReportMutation]);

  /**
   * Get print version of a form
   */
  const getPrintVersion = useCallback((formId: string) => {
    return queries.getPrintVersion(formId);
  }, [queries]);

  /**
   * Export single form data
   */
  const exportForm = useCallback((formId: string, format: 'excel' | 'pdf') => {
    return mutations.exportFormMutation ? 
      mutations.exportFormMutation.mutateAsync({ formId, format }) : 
      Promise.reject(new Error('Export form mutation not available'));
  }, [mutations]);

  return {
    // Reports
    getFactoryReport,
    getLineReport,
    getTeamReport,
    getGroupReport,
    getComparisonReport,
    
    // Print and export
    getPrintVersion,
    exportReport,
    exportForm,
    
    // Access to original queries and mutations
    queries,
    mutations
  };
};

export default useDigitalFormReports;