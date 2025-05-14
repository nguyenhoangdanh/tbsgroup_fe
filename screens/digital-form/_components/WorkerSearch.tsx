// components/WorkerSearch.tsx
'use client';

import { SlidersHorizontal, Search } from 'lucide-react';

import { AttendanceStatus } from '@/common/types/digital-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WorkerSearchProps {
  filters: {
    search: string;
    status: AttendanceStatus | 'ALL';
    sortBy: 'name' | 'employeeId' | 'totalOutput';
  };
  onFilterChange: (filters: {
    search: string;
    status: AttendanceStatus | 'ALL';
    sortBy: 'name' | 'employeeId' | 'totalOutput';
  }) => void;
  onOpenFilterSheet: () => void;
}

export function WorkerSearch({ filters, onFilterChange, onOpenFilterSheet }: WorkerSearchProps) {
  return (
    <div className="flex items-center gap-2 mt-6">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm công nhân..."
          className="pl-8"
          value={filters.search}
          onChange={e => onFilterChange({ ...filters, search: e.target.value })}
        />
      </div>
      <Button variant="outline" size="sm" onClick={onOpenFilterSheet}>
        <SlidersHorizontal className="h-4 w-4 mr-1" />
        Bộ lọc
      </Button>
    </div>
  );
}
