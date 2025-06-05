'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  ColumnDef,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  GroupingState,
  ExpandedState,
  RowSelectionState,
  GlobalFilterState,
} from '@tanstack/react-table';

import { 
  BaseTableData, 
  DataTableProps, 
  UseTableReturn, 
  SortConfig, 
  SortDirection,
  PaginationConfig,
  SelectionConfig,
  FilterConfig,
  GlobalSearchConfig,
  GroupingConfig,
  TableEventHandlers,
  ServerDataConfig,
  OptimizationConfig
} from '../types';

// Enhanced hook interface
interface UseDataTableOptions<T extends BaseTableData> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: PaginationConfig;
  total?: number;
  selection?: SelectionConfig;
  sorting?: SortConfig[];
  filterConfigs?: FilterConfig[];
  filterValues?: Record<string, any>;
  globalSearch?: GlobalSearchConfig;
  grouping?: GroupingConfig;
  eventHandlers?: TableEventHandlers<T>;
  serverData?: ServerDataConfig;
  optimization?: OptimizationConfig;
  selectedRowKeys?: (string | number)[];
  expandedRowKeys?: (string | number)[];
}

// Utility functions
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export function useDataTable<T extends BaseTableData>({
  data: initialData,
  columns,
  pagination = {
    type: 'client',
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: false,
    showTotal: true,
  },
  total: serverTotal,
  selection = { enabled: false },
  sorting = [],
  filterConfigs = [],
  filterValues = {},
  globalSearch = { enabled: true },
  grouping,
  eventHandlers,
  serverData,
  optimization = {},
  selectedRowKeys = [],
  expandedRowKeys = [],
}: UseDataTableOptions<T>): UseTableReturn<T> {

  // ==================== State Management ====================
  
  // Core data state
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Table states
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: pagination.current ? pagination.current - 1 : 0,
    pageSize: pagination.pageSize,
  });

  const [sortingState, setSortingState] = useState<SortingState>(
    sorting.map(sort => ({
      id: sort.field,
      desc: sort.direction === 'desc',
    }))
  );

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [groupingState, setGroupingState] = useState<GroupingState>(
    grouping?.field ? [grouping.field] : []
  );
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Internal state
  const [filtersState, setFiltersState] = useState<Record<string, any>>(filterValues);
  const [selectedRowKeysState, setSelectedRowKeysState] = useState<(string | number)[]>(selectedRowKeys);
  const [expandedRowKeysState, setExpandedRowKeysState] = useState<(string | number)[]>(expandedRowKeys);

  // Refs for optimization
  const searchDebounceRef = useRef<Function>();
  const filterDebounceRef = useRef<Function>();

  // ==================== Debounced Functions ====================
  
  useEffect(() => {
    if (optimization.debounceSearch) {
      searchDebounceRef.current = debounce((value: string) => {
        setGlobalFilter(value);
        eventHandlers?.onSearch?.(value);
      }, optimization.debounceSearch);
    }

    if (optimization.debounceFilter) {
      filterDebounceRef.current = debounce((filters: Record<string, any>) => {
        eventHandlers?.onFilter?.(filters);
      }, optimization.debounceFilter);
    }
  }, [optimization, eventHandlers]);

  // ==================== Enhanced Global Search ====================
  
  const enhancedGlobalFilter = useCallback((row: any, columnId: string, value: any, search: string) => {
    if (!globalSearch?.enabled || !search) return true;

    const searchValue = removeAccents(search.toLowerCase());
    
    // Custom search function
    if (globalSearch.customSearchFn) {
      return globalSearch.customSearchFn(row.original, search);
    }

    // Search in specific fields
    if (globalSearch.searchableFields?.length) {
      return globalSearch.searchableFields.some(field => {
        const fieldValue = row.original[field];
        if (fieldValue == null) return false;
        return removeAccents(String(fieldValue).toLowerCase()).includes(searchValue);
      });
    }

    // Search in all string fields
    return Object.values(row.original).some(val => {
      if (val == null) return false;
      return removeAccents(String(val).toLowerCase()).includes(searchValue);
    });
  }, [globalSearch]);

  // ==================== Data Processing ====================
  
  // Process and transform data based on grouping
  const processedData = useMemo(() => {
    if (!grouping?.enabled || !grouping.field) {
      return data;
    }

    const grouped = data.reduce((acc, item) => {
      const groupValue = item[grouping.field!];
      if (!acc[groupValue]) {
        acc[groupValue] = [];
      }
      acc[groupValue].push(item);
      return acc;
    }, {} as Record<string, T[]>);

    const result: any[] = [];
    
    Object.entries(grouped).forEach(([groupValue, items]) => {
      // Add group header
      result.push({
        id: `group-${groupValue}`,
        isGroupRow: true,
        groupValue,
        groupName: groupValue,
        groupCount: items.length,
        isExpanded: expandedRowKeysState.includes(groupValue),
        _children: items,
      });

      // Add children if expanded
      if (expandedRowKeysState.includes(groupValue)) {
        items.forEach(item => {
          result.push({
            ...item,
            isChildRow: true,
          });
        });
      }
    });

    return result;
  }, [data, grouping, expandedRowKeysState]);

  // ==================== Table Configuration ====================
  
  const table = useReactTable({
    data: processedData,
    columns,
    pageCount: pagination.type === 'server' ? Math.ceil((serverTotal || 0) / paginationState.pageSize) : undefined,
    
    // Core features
    getCoreRowModel: getCoreRowModel(),
    
    // Filtering
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: enhancedGlobalFilter,
    
    // Pagination
    getPaginationRowModel: pagination.type === 'client' ? getPaginationRowModel() : undefined,
    manualPagination: pagination.type === 'server',
    
    // Sorting
    getSortedRowModel: getSortedRowModel(),
    manualSorting: pagination.type === 'server',
    
    // Grouping
    getGroupedRowModel: grouping?.enabled ? getGroupedRowModel() : undefined,
    getExpandedRowModel: grouping?.enabled ? getExpandedRowModel() : undefined,
    
    // Selection
    enableRowSelection: selection?.enabled,
    enableMultiRowSelection: selection?.multiple !== false,
    
    // State
    state: {
      pagination: paginationState,
      sorting: sortingState,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      grouping: groupingState,
      expanded,
    },
    
    // State handlers
    onPaginationChange: setPaginationState,
    onSortingChange: setSortingState,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGroupingChange: setGroupingState,
    onExpandedChange: setExpanded,

    // Meta data
    meta: {
      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        setData(old =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                [columnId]: value,
              };
            }
            return row;
          })
        );
      },
    },
  });

  // ==================== Computed Values ====================
  
  const selectedRows = useMemo(() => {
    const selectedRowsMap = table.getSelectedRowModel().rowsById;
    return Object.values(selectedRowsMap).map(row => row.original);
  }, [table, rowSelection]);

  const filteredData = useMemo(() => {
    return table.getFilteredRowModel().rows.map(row => row.original);
  }, [table, columnFilters, globalFilter]);

  const paginationInfo = useMemo(() => {
    const total = pagination.type === 'server' ? (serverTotal || 0) : filteredData.length;
    const current = paginationState.pageIndex + 1;
    const pageSize = paginationState.pageSize;
    const totalPages = Math.ceil(total / pageSize);

    return {
      current,
      pageSize,
      total,
      totalPages,
      hasNextPage: current < totalPages,
      hasPreviousPage: current > 1,
    };
  }, [paginationState, filteredData.length, serverTotal, pagination.type]);

  // ==================== Action Handlers ====================
  
  const setPage = useCallback((page: number) => {
    const newPagination = { ...paginationState, pageIndex: page - 1 };
    setPaginationState(newPagination);
    eventHandlers?.onPageChange?.(page, newPagination.pageSize);
  }, [paginationState, eventHandlers]);

  const setPageSize = useCallback((pageSize: number) => {
    const newPagination = { pageIndex: 0, pageSize };
    setPaginationState(newPagination);
    eventHandlers?.onPageSizeChange?.(pageSize);
  }, [eventHandlers]);

  const setSort = useCallback((field: string, direction: SortDirection) => {
    const newSorting = direction === false 
      ? sortingState.filter(sort => sort.id !== field)
      : [{ id: field, desc: direction === 'desc' }];
    
    setSortingState(newSorting);
    eventHandlers?.onSort?.(field, direction);
  }, [sortingState, eventHandlers]);

  const setSortingHandler = useCallback((sorting: SortConfig[]) => {
    const newSorting = sorting.map(sort => ({
      id: sort.field,
      desc: sort.direction === 'desc',
    }));
    setSortingState(newSorting);
  }, []);

  const setFilter = useCallback((key: string, value: any) => {
    const newFilters = { ...filtersState, [key]: value };
    setFiltersState(newFilters);
    
    // Update column filters for react-table
    setColumnFilters(prev => {
      const filtered = prev.filter(filter => filter.id !== key);
      if (value !== undefined && value !== null && value !== '') {
        filtered.push({ id: key, value });
      }
      return filtered;
    });

    if (filterDebounceRef.current) {
      filterDebounceRef.current(newFilters);
    } else {
      eventHandlers?.onFilter?.(newFilters);
    }
  }, [filtersState, eventHandlers]);

  const setFilters = useCallback((newFilters: Record<string, any>) => {
    setFiltersState(newFilters);
    
    const columnFiltersArray = Object.entries(newFilters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => ({ id: key, value }));
    
    setColumnFilters(columnFiltersArray);
    eventHandlers?.onFilter?.(newFilters);
  }, [eventHandlers]);

  const clearFilters = useCallback(() => {
    setFiltersState({});
    setColumnFilters([]);
    setGlobalFilter('');
    eventHandlers?.onFilter?.({});
  }, [eventHandlers]);

  const setSelectedRowKeysHandler = useCallback((keys: (string | number)[]) => {
    setSelectedRowKeysState(keys);
    
    // Update row selection state
    const newRowSelection: RowSelectionState = {};
    keys.forEach(key => {
      const rowIndex = data.findIndex(row => row.id === key);
      if (rowIndex !== -1) {
        newRowSelection[rowIndex] = true;
      }
    });
    setRowSelection(newRowSelection);

    // Get selected rows
    const selectedRowsData = data.filter(row => keys.includes(row.id));
    eventHandlers?.onSelectionChange?.(selectedRowsData, keys);
  }, [data, eventHandlers]);

  const setExpandedRowKeysHandler = useCallback((keys: (string | number)[]) => {
    setExpandedRowKeysState(keys);
    
    // Update expanded state for react-table
    const newExpanded: ExpandedState = {};
    keys.forEach(key => {
      newExpanded[key] = true;
    });
    setExpanded(newExpanded);
  }, []);

  const refresh = useCallback(async () => {
    if (serverData) {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(serverData.url, {
          method: serverData.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...serverData.headers,
          },
          body: serverData.method === 'POST' ? JSON.stringify(serverData.params) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        const transformedData = serverData.transform ? serverData.transform(responseData) : responseData;
        
        setData(transformedData.data || transformedData);
        
        // Update pagination if server provides total
        if (transformedData.total !== undefined) {
          setPaginationState(prev => ({
            ...prev,
            pageIndex: (transformedData.page || 1) - 1,
          }));
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch data');
        setError(error);
        serverData.onError?.(error);
      } finally {
        setLoading(false);
      }
    } else {
      // Client-side refresh - just emit event
      eventHandlers?.onLoading?.(true);
      setTimeout(() => {
        eventHandlers?.onLoading?.(false);
      }, 100);
    }
  }, [serverData, eventHandlers]);

  const reset = useCallback(() => {
    setPaginationState({
      pageIndex: 0,
      pageSize: pagination.pageSize,
    });
    setSortingState([]);
    setColumnFilters([]);
    setGlobalFilter('');
    setFiltersState({});
    setRowSelection({});
    setSelectedRowKeysState([]);
    setExpandedRowKeysState([]);
    setColumnVisibility({});
    setError(null);
  }, [pagination.pageSize]);

  // Bulk operations
  const selectAll = useCallback(() => {
    table.toggleAllRowsSelected(true);
  }, [table]);

  const selectNone = useCallback(() => {
    table.toggleAllRowsSelected(false);
  }, [table]);

  const selectInvert = useCallback(() => {
    const currentSelection = table.getSelectedRowModel().rows;
    const allRows = table.getRowModel().rows;
    
    allRows.forEach(row => {
      const isSelected = currentSelection.some(selected => selected.id === row.id);
      row.toggleSelected(!isSelected);
    });
  }, [table]);

  const selectPage = useCallback(() => {
    table.toggleAllPageRowsSelected(true);
  }, [table]);

  // Export operations
  const exportData = useCallback((format: 'csv' | 'excel' | 'pdf' | 'json', options?: any) => {
    // This will be implemented in the export hook
    console.log('Export data:', format, options);
  }, []);

  // Search operations
  const setGlobalFilterHandler = useCallback((value: string) => {
    if (searchDebounceRef.current) {
      searchDebounceRef.current(value);
    } else {
      setGlobalFilter(value);
      eventHandlers?.onSearch?.(value);
    }
  }, [eventHandlers]);

  const clearGlobalFilter = useCallback(() => {
    setGlobalFilter('');
    eventHandlers?.onSearch?.('');
  }, [eventHandlers]);

  // ==================== Effects ====================
  
  // Update data when initialData changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Update selected rows when external selectedRowKeys change
  useEffect(() => {
    if (JSON.stringify(selectedRowKeys) !== JSON.stringify(selectedRowKeysState)) {
      setSelectedRowKeysHandler(selectedRowKeys);
    }
  }, [selectedRowKeys, selectedRowKeysState, setSelectedRowKeysHandler]);

  // Update expanded rows when external expandedRowKeys change
  useEffect(() => {
    if (JSON.stringify(expandedRowKeys) !== JSON.stringify(expandedRowKeysState)) {
      setExpandedRowKeysHandler(expandedRowKeys);
    }
  }, [expandedRowKeys, expandedRowKeysState, setExpandedRowKeysHandler]);

  // Call data change handler
  useEffect(() => {
    eventHandlers?.onDataChange?.(data);
  }, [data, eventHandlers]);

  // Call error handler
  useEffect(() => {
    if (error) {
      eventHandlers?.onError?.(error);
    }
  }, [error, eventHandlers]);

  // ==================== Return Object ====================
  
  return {
    // Table instance
    table,
    
    // Data states
    data,
    filteredData,
    selectedRows,
    
    // UI states
    loading,
    error,
    
    // Pagination state
    pagination: paginationInfo,
    
    // Other states
    sorting: sortingState.map(sort => ({
      field: sort.id,
      direction: sort.desc ? 'desc' : 'asc' as SortDirection,
    })),
    filters: filtersState,
    selectedRowKeys: selectedRowKeysState,
    expandedRowKeys: expandedRowKeysState,
    columnVisibility,
    
    // Actions
    setPage,
    setPageSize,
    setSort,
    setSorting: setSortingHandler,
    setFilter,
    setFilters,
    clearFilters,
    setSelectedRowKeys: setSelectedRowKeysHandler,
    setExpandedRowKeys: setExpandedRowKeysHandler,
    setColumnVisibility,
    refresh,
    reset,
    
    // Bulk operations
    selectAll,
    selectNone,
    selectInvert,
    selectPage,
    
    // Export operations
    exportData,
    
    // Search operations
    setGlobalFilter: setGlobalFilterHandler,
    clearGlobalFilter,
  };
}