// Fixed useTableGrouping.ts - Improved search functionality

import { useState, useCallback, useMemo, useEffect } from 'react';
import { BaseData, GroupedData, UseTableGroupingProps, UseTableGroupingReturn } from '../types';

export function useTableGrouping<TData extends BaseData>({
  data,
  enableRowGrouping,
  groupByField,
  initialExpandedGroups,
  forceGrouping,
  searchValue,
  searchColumn,
  customSearchFunction
}: UseTableGroupingProps<TData>): UseTableGroupingReturn<TData> {
  // State for expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Compute if search is active
  const searchActive = useMemo(() => {
    return Boolean(searchValue && searchValue.trim() !== '');
  }, [searchValue]);

  // Initialize expandedGroups with proper initial values
  useEffect(() => {
    if (enableRowGrouping && groupByField && data?.length > 0) {
      // Only initialize if expandedGroups is empty (first render)
      if (Object.keys(expandedGroups).length === 0) {
        // Create a set of unique group values
        const uniqueGroups = new Set<string>();
        
        data.forEach(item => {
          if (item && groupByField && item[groupByField] != null) {
            const groupValue = String(item[groupByField]);
            if (groupValue && groupValue !== 'undefined') {
              uniqueGroups.add(groupValue);
            }
          }
        });
        
        // Initialize expanded state based on initialExpandedGroups prop
        const initialState: Record<string, boolean> = {};
        uniqueGroups.forEach(group => {
          initialState[group] = Boolean(initialExpandedGroups);
        });
        
        console.log("Initializing expanded groups:", initialState);
        setExpandedGroups(initialState);
      }
    }
  }, [data, groupByField, enableRowGrouping, initialExpandedGroups, expandedGroups]);

  // When search becomes active, expand relevant groups
  useEffect(() => {
    if (!enableRowGrouping || !groupByField || !searchValue || !searchValue.trim()) {
      return;
    }
    
    // If search is active, expand all groups that have matching items
    const newExpandedState = {...expandedGroups};
    let hasChanges = false;
    
    if (groupByField) {
      // Group data by the specified field
      const groupMap: Record<string, TData[]> = {};
      data.forEach(item => {
        if (item[groupByField] != null) {
          const groupValue = String(item[groupByField]);
          if (!groupMap[groupValue]) {
            groupMap[groupValue] = [];
          }
          groupMap[groupValue].push(item);
        }
      });
      
      // Check each group for matches
      Object.entries(groupMap).forEach(([groupValue, groupItems]) => {
        const hasMatch = groupItems.some(item => {
          if (customSearchFunction) {
            return customSearchFunction(item, searchValue);
          } else if (searchColumn) {
            const fieldValue = item[searchColumn as keyof TData];
            if (fieldValue == null) return false;
            
            return String(fieldValue).toLowerCase().includes(searchValue.toLowerCase());
          }
          return false;
        });
        
        if (hasMatch && !newExpandedState[groupValue]) {
          newExpandedState[groupValue] = true;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        console.log("Expanding groups for search:", newExpandedState);
        setExpandedGroups(newExpandedState);
      }
    }
  }, [searchValue, data, groupByField, enableRowGrouping, expandedGroups, searchColumn, customSearchFunction]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupValue: string) => {
    if (!groupValue) {
      console.error("Attempted to toggle group with no groupValue");
      return;
    }
    
    // Use functional update to avoid race conditions
    setExpandedGroups(prev => {
      const newState = { ...prev };
      newState[groupValue] = !prev[groupValue];
      return newState;
    });
  }, []);

  // Expand all groups
  const expandAllGroups = useCallback(() => {
    if (!enableRowGrouping || !groupByField) return;
    
    // Find all unique group values in the data
    const allGroups: Record<string, boolean> = {};

    data.forEach(item => {
      if (item && groupByField && item[groupByField] != null) {
        const groupValue = String(item[groupByField]);
        if (groupValue) {
          allGroups[groupValue] = true;
        }
      }
    });

    setExpandedGroups(allGroups);
  }, [data, groupByField, enableRowGrouping]);

  // Collapse all groups
  const collapseAllGroups = useCallback(() => {
    // Don't collapse groups if search is active
    if (searchActive) {
      return;
    }
    
    setExpandedGroups({});
  }, [searchActive]);

  // Process data with filtering logic
  const processedData = useMemo(() => {
    if (!enableRowGrouping || !groupByField) {
      return data;
    }

    // Apply filtering if search is active
    let filteredData = data;
    if (searchActive && (searchColumn || customSearchFunction)) {
      filteredData = data.filter(item => {
        if (customSearchFunction) {
          return customSearchFunction(item, searchValue || "");
        }
        
        if (searchColumn) {
          const columnValue = item[searchColumn as keyof TData];
          if (columnValue == null) return false;
          
          const normalizedValue = String(columnValue).toLowerCase();
          const normalizedSearch = searchValue?.toLowerCase() || "";
          return normalizedValue.includes(normalizedSearch);
        }
        
        return false;
      });
    }

    // Group the data by the specified field
    const groupedByField: Record<string, TData[]> = {};
    filteredData.forEach(item => {
      const groupValue = String(item[groupByField] ?? 'undefined');
      if (!groupedByField[groupValue]) {
        groupedByField[groupValue] = [];
      }
      groupedByField[groupValue].push(item);
    });

    // Create a flattened array with group rows
    const result: (TData | GroupedData<TData>)[] = [];

    Object.entries(groupedByField).forEach(([groupValue, items]) => {
      // Skip empty group values
      if (groupValue === 'undefined' || groupValue === '') {
        items.forEach(item => {
          result.push(item);
        });
        return;
      }

      // Only create a group if there's more than one item or forceGrouping is true
      if (items.length <= 1 && !forceGrouping) {
        items.forEach(item => {
          result.push(item);
        });
        return;
      }

      const isExpanded = expandedGroups[groupValue] === true || searchActive;
      const nameField = `${String(groupByField)}Name`;
      const nameValue = items[0] && nameField in items[0] ? 
                      String(items[0][nameField as keyof TData]) : '';

      // Add the group row
      const groupRow: GroupedData<TData> = {
        id: `group-${groupValue}`,
        isGroupRow: true,
        groupValue: groupValue,
        groupName: nameValue,
        groupCount: items.length,
        isExpanded: isExpanded,
        originalData: items[0]
      };

      result.push(groupRow);

      // Add child rows if expanded
      if (isExpanded) {
        items.forEach(item => {
          // Mark as child row so we can add styling
          result.push({
            ...item,
            isChildRow: true
          });
        });
      }
    });

    return result;
  }, [data, groupByField, expandedGroups, enableRowGrouping, forceGrouping, searchActive, searchColumn, searchValue, customSearchFunction]);

  return {
    expandedGroups,
    toggleGroup,
    expandAllGroups,
    collapseAllGroups,
    processedData,
    searchActive
  };
}