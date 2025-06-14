'use client';
import { useState, useCallback, useMemo } from 'react';

import {
  DigitalFormEntry,
  AttendanceStatus,
  ProductionIssueType,
} from '@/common/types/digital-form';
import { TDigitalFormEntry } from '@/schemas/digital-form.schema';

/**
 * Hook for managing digital form entries with validation and preprocessing
 * Fixed version with better performance characteristics
 */
export const useDigitalFormEntries = (formId: string, initialEntries: DigitalFormEntry[] = []) => {
  // State for entries
  const [entries, setEntries] = useState<DigitalFormEntry[]>(initialEntries);

  // State for currently selected entry
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  //// Loading state for operations
  const [loading, setLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Get the currently selected entry
  const selectedEntry = useMemo(
    () => entries.find(entry => entry.id === selectedEntryId) || null,
    [entries, selectedEntryId],
  );

  // Calculate total output for all entries
  const totalOutput = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.totalOutput || 0), 0),
    [entries],
  );

  // Get unique entity IDs across all entries
  const uniqueEntities = useMemo(() => {
    const users = new Set<string>();
    const handBags = new Set<string>();
    const processes = new Set<string>();
    const bagColors = new Set<string>();

    entries.forEach(entry => {
      if (entry.userId) users.add(entry.userId);
      if (entry.handBagId) handBags.add(entry.handBagId);
      if (entry.processId) processes.add(entry.processId);
      if (entry.bagColorId) bagColors.add(entry.bagColorId);
    });

    return {
      userIds: Array.from(users),
      handBagIds: Array.from(handBags),
      processIds: Array.from(processes),
      bagColorIds: Array.from(bagColors),
      counts: {
        users: users.size,
        handBags: handBags.size,
        processes: processes.size,
        bagColors: bagColors.size,
      },
    };
  }, [entries]);

  //  Add a new entry, updating if entry with same key fields already exists
  // Fixed to avoid dependency on entries state
  const addOrUpdateEntry = useCallback(
    (entry: TDigitalFormEntry) => {
      //  Calculate total output from hourly data
      const totalOutput = Object.values(entry.hourlyData || {}).reduce(
        (sum, output) => sum + (output || 0),
        0,
      );

      // Convert dates to string format if they are Date objects
      const checkInTime = entry.checkInTime
        ? typeof entry.checkInTime === 'object'
          ? (entry.checkInTime as Date).toISOString()
          : entry.checkInTime
        : null;

      const checkOutTime = entry.checkOutTime
        ? typeof entry.checkOutTime === 'object'
          ? (entry.checkOutTime as Date).toISOString()
          : entry.checkOutTime
        : null;

      // Create entry object with calculated values - remove temp ID generation
      const formattedEntry: DigitalFormEntry = {
        formId,
        ...entry,
        checkInTime,
        checkOutTime,
        totalOutput: entry.totalOutput || totalOutput,
        attendanceStatus: entry.attendanceStatus || AttendanceStatus.PRESENT,
        qualityScore: entry.qualityScore || 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as DigitalFormEntry;

      //  Use functional update pattern to avoid entries dependency
      setEntries(prevEntries => {
        //  Check if an entry already exists with the same key fields
        const existingEntryIndex = prevEntries.findIndex(
          e =>
            e.userId === entry.userId &&
            e.handBagId === entry.handBagId &&
            e.processId === entry.processId &&
            e.bagColorId === entry.bagColorId,
        );

        if (existingEntryIndex >= 0) {
          //  Update existing entry
          const updatedEntries = [...prevEntries];
          updatedEntries[existingEntryIndex] = {
            ...updatedEntries[existingEntryIndex],
            ...formattedEntry,
            id: updatedEntries[existingEntryIndex].id, // Keep original ID
            updatedAt: new Date().toISOString(),
          };
          return updatedEntries;
        } else {
          //   Add new entry - let backend assign ID
          return [...prevEntries, formattedEntry];
        }
      });

      // Since we can't access the updated state immediately, return the formatted entry
      return formattedEntry;
    },
    [formId],
  ); // No dependency on entries

  // Remove an entry
  const removeEntry = useCallback(
    (entryId: string) => {
      setEntries(prev => prev.filter(entry => entry.id !== entryId));

      //  Clear selected entry if it was removed
      if (selectedEntryId === entryId) {
        setSelectedEntryId(null);
      }
    },
    [selectedEntryId],
  );

  // Update an entry with partial data
  const updateEntry = useCallback((entryId: string, updates: Partial<DigitalFormEntry>) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.id === entryId
          ? {
              ...entry,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : entry,
      ),
    );
  }, []);

  // Update hourly data for an entry
  const updateHourlyData = useCallback((entryId: string, hour: string, output: number) => {
    setEntries(prev =>
      prev.map(entry => {
        if (entry.id !== entryId) return entry;

        //  Update hourly data
        const hourlyData = { ...(entry.hourlyData || {}) };
        hourlyData[hour] = output;

        // Recalculate total output
        const totalOutput = Object.values(hourlyData).reduce((sum, val) => sum + (val || 0), 0);

        return {
          ...entry,
          hourlyData,
          totalOutput,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  //  Update attendance status for an entry
  const updateAttendanceStatus = useCallback(
    (entryId: string, status: AttendanceStatus) => {
      updateEntry(entryId, { attendanceStatus: status });
    },
    [updateEntry],
  );

  //  Add an issue to an entry
  const addIssue = useCallback(
    (
      entryId: string,
      issue: {
        type: ProductionIssueType;
        hour: number;
        impact: number;
        description?: string;
      },
    ) => {
      setEntries(prev =>
        prev.map(entry => {
          if (entry.id !== entryId) return entry;

          // Add to existing issues or create new array
          const issues = [...(entry.issues || []), issue];

          return {
            ...entry,
            issues,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [],
  );

  //Remove an issue from an entry
  const removeIssue = useCallback((entryId: string, issueIndex: number) => {
    setEntries(prev =>
      prev.map(entry => {
        if (entry.id !== entryId || !entry.issues) return entry;

        // Filter out the issue by index
        const issues = entry.issues.filter((_, index) => index !== issueIndex);

        return {
          ...entry,
          issues,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  // Validate entries before submission
  const validateEntries = useCallback(() => {
    if (entries.length === 0) {
      return {
        valid: false,
        message: 'Chưa có dữ liệu nào được nhập vào biểu mẫu',
      };
    }

    // Check for entries with zero output
    const zeroOutputEntries = entries.filter(
      entry => entry.attendanceStatus === AttendanceStatus.PRESENT && entry.totalOutput === 0,
    );

    if (zeroOutputEntries.length > 0) {
      return {
        valid: false,
        message: `Có ${zeroOutputEntries.length} công nhân có mặt nhưng không có sản lượng`,
      };
    }

    return { valid: true, message: '' };
  }, [entries]);

  // Reset all data
  const resetEntries = useCallback(() => {
    setEntries(initialEntries);
    setSelectedEntryId(null);
    setError(null);
  }, [initialEntries]);

  return {
    // State
    entries,
    selectedEntryId,
    selectedEntry,
    loading,
    error,
    totalOutput,
    uniqueEntities,

    // State setters
    setEntries,
    setSelectedEntryId,
    setLoading,
    setError,

    // Entry operations
    addOrUpdateEntry,
    removeEntry,
    updateEntry,
    updateHourlyData,
    updateAttendanceStatus,
    addIssue,
    removeIssue,
    validateEntries,
    resetEntries,
  };
};
