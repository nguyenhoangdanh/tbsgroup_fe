// components/FilterSheet.tsx
'use client';

import { AttendanceStatus } from '@/common/types/digital-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export function FilterSheet({ open, onOpenChange, filters, onFilterChange }: FilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Bộ lọc công nhân</SheetTitle>
          <SheetDescription>Thiết lập bộ lọc và sắp xếp</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Trạng thái</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={filters.status === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, status: 'ALL' })}
                >
                  Tất cả
                </Button>
                <Button
                  variant={filters.status === AttendanceStatus.PRESENT ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, status: AttendanceStatus.PRESENT })}
                >
                  Có mặt
                </Button>
                <Button
                  variant={filters.status === AttendanceStatus.ABSENT ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, status: AttendanceStatus.ABSENT })}
                >
                  Vắng mặt
                </Button>
                <Button
                  variant={filters.status === AttendanceStatus.LATE ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, status: AttendanceStatus.LATE })}
                >
                  Đi muộn
                </Button>
                <Button
                  variant={filters.status === AttendanceStatus.EARLY_LEAVE ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    onFilterChange({ ...filters, status: AttendanceStatus.EARLY_LEAVE })
                  }
                >
                  Về sớm
                </Button>
                <Button
                  variant={
                    filters.status === AttendanceStatus.LEAVE_APPROVED ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    onFilterChange({ ...filters, status: AttendanceStatus.LEAVE_APPROVED })
                  }
                >
                  Nghỉ phép
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Sắp xếp theo</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={filters.sortBy === 'name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, sortBy: 'name' })}
                >
                  Tên
                </Button>
                <Button
                  variant={filters.sortBy === 'employeeId' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, sortBy: 'employeeId' })}
                >
                  Mã NV
                </Button>
                <Button
                  variant={filters.sortBy === 'totalOutput' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, sortBy: 'totalOutput' })}
                >
                  Sản lượng
                </Button>
              </div>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onFilterChange({ search: '', status: 'ALL', sortBy: 'name' })}
          >
            Đặt lại
          </Button>
          <Button onClick={() => onOpenChange(false)}>Áp dụng</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
