'use client';
import { useEffect, useState } from 'react';

import { DigitalForm, DigitalFormEntry, ShiftType } from '@/common/types/digital-form';

import { useDigitalFormMutations } from './useDigitalFormMutations';
import { useDigitalFormQueries } from './useDigitalFormQueries';
import { useDigitalFormStats } from './useDigitalFormStats';
import { useWorkShifts } from './useWorkShifts';


/**
 * A higher level hook that demonstrates proper usage pattern for the query hooks
 * and resolves the React Hook rule violations from the earlier implementation
 */
export const useCustomDigitalForm = (formId?: string) => {
  const queries = useDigitalFormQueries();
  const mutations = useDigitalFormMutations();

  const [currentFormId, setCurrentFormId] = useState<string | undefined>(formId);
  const [form, setForm] = useState<DigitalForm | null>(null);
  const [entries, setEntries] = useState<DigitalFormEntry[]>([]);

  // Create form query using the creator function
  const formQuery = queries.createFormQuery(currentFormId);

  // Create form with entries query
  const formWithEntriesQuery = queries.createFormWithEntriesQuery(currentFormId);

  // Get form stats if we have form and entries
  const { stats } = useDigitalFormStats(form, entries);

  // Get time slots based on the form's shift type
  const { timeSlots } = useWorkShifts(form?.shiftType || ShiftType.REGULAR);

  // Update local state when queries change
  useEffect(() => {
    if (formQuery.data) {
      setForm(formQuery.data);
    }
  }, [formQuery.data]);

  useEffect(() => {
    if (formWithEntriesQuery.data) {
      setForm(formWithEntriesQuery.data.form);
      setEntries(formWithEntriesQuery.data.entries || []);
    }
  }, [formWithEntriesQuery.data]);

  // Load a form by ID
  const loadForm = (id: string) => {
    setCurrentFormId(id);
  };

  // Reset the current form
  const resetForm = () => {
    setCurrentFormId(undefined);
    setForm(null);
    setEntries([]);
  };

  // Create query instances for reports (only when needed)
  const getFactoryReport = (factoryId: string, dateFrom: string, dateTo: string, options?: any) => {
    return queries.createFactoryReportQuery(factoryId, dateFrom, dateTo, options);
  };

  const getLineReport = (lineId: string, dateFrom: string, dateTo: string, options?: any) => {
    return queries.createLineReportQuery(lineId, dateFrom, dateTo, options);
  };

  const getTeamReport = (teamId: string, dateFrom: string, dateTo: string, options?: any) => {
    return queries.createTeamReportQuery(teamId, dateFrom, dateTo, options);
  };

  const getGroupReport = (groupId: string, dateFrom: string, dateTo: string, options?: any) => {
    return queries.createGroupReportQuery(groupId, dateFrom, dateTo, options);
  };

  const getComparisonReport = (
    lineId: string,
    entityIds: string[],
    compareBy: 'team' | 'group',
    dateFrom: string,
    dateTo: string,
    options?: any,
  ) => {
    return queries.createComparisonReportQuery(
      lineId,
      entityIds,
      compareBy,
      dateFrom,
      dateTo,
      options,
    );
  };

  return {
    // Form data
    formId: currentFormId,
    form,
    entries,
    stats,
    timeSlots,

    // Form loading state
    isLoading: formQuery.isLoading || formWithEntriesQuery.isLoading,
    isError: formQuery.isError || formWithEntriesQuery.isError,
    error: formQuery.error || formWithEntriesQuery.error,

    // Form operations
    loadForm,
    resetForm,

    // Report creators
    getFactoryReport,
    getLineReport,
    getTeamReport,
    getGroupReport,
    getComparisonReport,

    // Access to mutations
    mutations,

    // The underlying queries for advanced use cases
    formQuery,
    formWithEntriesQuery,
  };
};

export default useCustomDigitalForm;
