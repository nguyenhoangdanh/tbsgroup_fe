'use client';

import React, { memo, useState, useCallback, useRef } from 'react';
import { 
  Search, 
  Download, 
  ChevronDown, 
  Filter, 
  RefreshCw,
  Settings,
  Plus,
  X,
  SlidersHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

import { BaseTableData, ExportFormat, FilterConfig, BulkActionConfig, TableColumn } from '../types/enhanced-types';

interface TableToolbarProps<T extends BaseTableData = BaseTableData> {
  // Title and description
  title?: string;
  description?: string;
  
  // Search
  globalSearch?: {
    enabled: boolean;
    value: string;
    placeholder?: string;
    onSearch: (value: string) => void;
  };
  
  // Filters
  filters?: {
    configs: FilterConfig[];
    values: Record<string, any>;
    onFilterChange: (key: string, value: any) => void;
    onClearFilters: () => void;
  };
  
  // Export
  export?: {
    enabled: boolean;
    formats: ExportFormat[];
    data: T[];
    columns: TableColumn<T>[];
    filename?: string;
    title?: string;
  };
  
  // Column visibility
  columnVisibility?: {
    columns: Array<{ id: string; label: string; visible: boolean }>;
    onToggle: (columnId: string) => void;
  };
  
  // Actions
  actions?: {
    create?: {
      enabled: boolean;
      label?: string;
      onClick: () => void;
    };
    refresh?: {
      enabled: boolean;
      onClick: () => void;
      loading?: boolean;
    };
  };
  
  // Bulk actions
  bulkActions?: {
    configs: BulkActionConfig[];
    selectedCount: number;
    onAction: (action: BulkActionConfig) => void;
  };
  
  // Custom toolbar items
  customActions?: React.ReactNode;
}

export const TableToolbar = memo(<T extends BaseTableData>({
  title,
  description,
  globalSearch,
  filters,
  export: exportConfig,
  columnVisibility,
  actions,
  bulkActions,
  customActions,
}: TableToolbarProps<T>) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Handle search input change with debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (globalSearch?.onSearch) {
      globalSearch.onSearch(e.target.value);
    }
  }, [globalSearch]);
  
  // Clear search input
  const handleSearchClear = useCallback(() => {
    if (globalSearch?.onSearch && searchRef.current) {
      searchRef.current.value = '';
      globalSearch.onSearch('');
    }
  }, [globalSearch]);

  // Handle export action
  const handleExport = useCallback((format: ExportFormat) => {
    // Implement export logic here or pass to parent
    console.log(`Export ${format} format`, exportConfig?.data.length || 0, 'rows');
  }, [exportConfig]);
  
  // Count active filters
  const activeFiltersCount = filters ? 
    Object.values(filters.values).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length : 0;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      {(title || description) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          
          {actions?.create?.enabled && !isMobile && (
            <Button
              onClick={actions.create.onClick}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {actions.create.label || 'Tạo mới'}
            </Button>
          )}
        </div>
      )}

      {/* Main Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Left Side - Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center sm:flex-1">
          {/* Global Search */}
          {globalSearch?.enabled && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder={globalSearch.placeholder || 'Tìm kiếm...'}
                defaultValue={globalSearch.value}
                onChange={handleSearchChange}
                className="pl-10 pr-10"
              />
              {globalSearch.value && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-0"
                  onClick={handleSearchClear}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          )}

          {/* Filters Button */}
          {filters && filters.configs.length > 0 && (
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "flex items-center gap-1",
                  activeFiltersCount > 0 && "bg-primary/5"
                )}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Bộ lọc
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {/* Filters Dropdown/Panel */}
              <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <CollapsibleContent className="absolute z-10 top-full left-0 mt-2 p-4 bg-card border rounded-md shadow-md w-72 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Lọc dữ liệu</h3>
                    {activeFiltersCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={filters.onClearFilters}
                        className="h-7 px-2 text-xs"
                      >
                        Xóa tất cả
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {filters.configs.map((filter) => (
                      <div key={filter.key} className="space-y-1">
                        <label htmlFor={`filter-${filter.key}`} className="text-sm font-medium block">
                          {filter.label}
                        </label>
                        
                        {filter.type === 'select' && (
                          <Select
                            value={filters.values[filter.key] || ''}
                            onValueChange={(value) => filters.onFilterChange(filter.key, value)}
                          >
                            <SelectTrigger id={`filter-${filter.key}`} className="w-full">
                              <SelectValue placeholder={filter.placeholder || 'Chọn...'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Tất cả</SelectItem>
                              {filter.options?.map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={String(option.value)}
                                  disabled={option.disabled}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {filter.type === 'text' && (
                          <Input
                            id={`filter-${filter.key}`}
                            type="text"
                            placeholder={filter.placeholder}
                            value={filters.values[filter.key] || ''}
                            onChange={(e) => filters.onFilterChange(filter.key, e.target.value)}
                            className="w-full"
                          />
                        )}
                        
                        {filter.type === 'number' && (
                          <Input
                            id={`filter-${filter.key}`}
                            type="number"
                            placeholder={filter.placeholder}
                            value={filters.values[filter.key] || ''}
                            onChange={(e) => filters.onFilterChange(filter.key, e.target.value)}
                            className="w-full"
                          />
                        )}
                        
                        {/* Custom filter component */}
                        {filter.type === 'custom' && filter.component && (
                          <filter.component
                            id={`filter-${filter.key}`}
                            value={filters.values[filter.key]}
                            onChange={(value: any) => filters.onFilterChange(filter.key, value)}
                            options={filter.options}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Custom Actions */}
          {customActions && <div className="ml-2">{customActions}</div>}
        </div>

        {/* Right Side - Actions */}
        <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
          {/* Mobile Create Button */}
          {actions?.create?.enabled && isMobile && (
            <Button
              onClick={actions.create.onClick}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 mr-1" />
              {actions.create.label || 'Tạo mới'}
            </Button>
          )}

          {/* Refresh Button */}
          {actions?.refresh?.enabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={actions.refresh.onClick}
              disabled={actions.refresh.loading}
              title="Làm mới"
              className="sm:w-9 sm:p-0 flex-none"
            >
              <RefreshCw 
                className={cn(
                  "h-4 w-4", 
                  actions.refresh.loading && "animate-spin"
                )} 
              />
              {isMobile && <span className="ml-2">Làm mới</span>}
            </Button>
          )}

          {/* Export Dropdown */}
          {exportConfig?.enabled && exportConfig.data.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Xuất</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Xuất dữ liệu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {exportConfig.formats.includes('csv') && (
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <span className="mr-2">📄</span> CSV (.csv)
                  </DropdownMenuItem>
                )}
                {exportConfig.formats.includes('excel') && (
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <span className="mr-2">📊</span> Excel (.xlsx)
                  </DropdownMenuItem>
                )}
                {exportConfig.formats.includes('pdf') && (
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <span className="mr-2">📕</span> PDF (.pdf)
                  </DropdownMenuItem>
                )}
                {exportConfig.formats.includes('json') && (
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <span className="mr-2">🔧</span> JSON (.json)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column Visibility Dropdown */}
          {columnVisibility && columnVisibility.columns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Cột</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columnVisibility.columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.visible}
                    onCheckedChange={() => columnVisibility.onToggle(column.id)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkActions && bulkActions.selectedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
          <span className="text-sm font-medium whitespace-nowrap">
            Đã chọn {bulkActions.selectedCount} mục
          </span>
          <div className="flex flex-wrap gap-2 ml-auto">
            {bulkActions.configs.map((action) => (
              <Button
                key={action.type}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => bulkActions.onAction(action)}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

TableToolbar.displayName = 'TableToolbar';