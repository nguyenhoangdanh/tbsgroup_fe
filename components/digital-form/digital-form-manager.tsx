'use client';
import {
  Search,
  Filter,
  ChevronDown,
  Loader2,
  Save,
  ArrowLeft,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useCallback } from 'react';

import { FormExportActions } from './form-export-actions';
import { FormStatsCard } from './form-stats-card';
import { WorkerView } from './worker-view';

import { AttendanceStatus, RecordStatus, ShiftType } from '@/common/types/digital-form';
import type { Worker } from '@/common/types/worker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDigitalFormContext } from '@/hooks/digital-form';
import { useWorkShifts } from '@/hooks/digital-form/useWorkShifts';

interface DigitalFormManagerProps {
  formId?: string;
}

export const DigitalFormManager: React.FC<DigitalFormManagerProps> = ({ formId }) => {
  const router = useRouter();

  // Get form context
  const {
    form,
    entries,
    isLoading,
    error,
    currentTimeSlot,
    updateHourlyData,
    updateAttendanceStatus,
    updateShiftType,
    addEntry,
    submitForm,
    refreshData,
  } = useDigitalFormContext();

  // State management
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL' as AttendanceStatus | 'ALL',
    sortBy: 'name' as 'name' | 'employeeId' | 'totalOutput',
  });

  const [statsSheetOpen, setStatsSheetOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statsTab, setStatsTab] = useState<'summary' | 'production' | 'attendance'>('summary');

  // Get work shifts
  const { timeSlots } = useWorkShifts(form?.shiftType || ShiftType.REGULAR);

  // Group workers by user ID to avoid duplicates
  const uniqueWorkers = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const userMap = new Map<string, Worker>();

    entries.forEach(worker => {
      const userId = worker.user?.id || worker.id;
      if (userId && !userMap.has(userId)) {
        userMap.set(userId, worker);
      }
    });

    return Array.from(userMap.values());
  }, [entries]);

  // Filter and sort workers
  const filteredWorkers = useMemo(() => {
    if (uniqueWorkers.length === 0) return [];

    let workers = [...uniqueWorkers];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      workers = workers.filter(
        worker =>
          (worker.name || '').toLowerCase().includes(searchLower) ||
          (worker.employeeId || '').toLowerCase().includes(searchLower) ||
          (worker.user?.fullName || '').toLowerCase().includes(searchLower) ||
          (worker.user?.employeeId || '').toLowerCase().includes(searchLower),
      );
    }

    // Apply status filter
    if (filters.status !== 'ALL') {
      workers = workers.filter(worker => worker.attendanceStatus === filters.status);
    }

    // Apply sorting
    workers.sort((a, b) => {
      if (filters.sortBy === 'name') {
        const nameA = a.user?.fullName || a.name || '';
        const nameB = b.user?.fullName || b.name || '';
        return nameA.localeCompare(nameB);
      } else if (filters.sortBy === 'employeeId') {
        const idA = a.user?.employeeId || a.employeeId || '';
        const idB = b.user?.employeeId || b.employeeId || '';
        return idA.localeCompare(idB);
      } else {
        // For total output, calculate from all entries
        const getWorkerTotalOutput = (worker: Worker) => {
          if (!entries) return 0;
          return entries
            .filter(entry => {
              const entryUserId = entry.user?.id || entry.id;
              const workerId = worker.user?.id || worker.id;
              return entryUserId === workerId;
            })
            .reduce((sum, entry) => sum + (entry.totalOutput || 0), 0);
        };

        return getWorkerTotalOutput(b) - getWorkerTotalOutput(a);
      }
    });

    return workers;
  }, [uniqueWorkers, filters, entries]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: {
      search: string;
      status: AttendanceStatus | 'ALL';
      sortBy: 'name' | 'employeeId' | 'totalOutput';
    }) => {
      setFilters(newFilters);
      setFilterSheetOpen(false);
    },
    [],
  );

  // Handler for refreshing data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      setIsRefreshing(false);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setIsRefreshing(false);
    }
  }, [refreshData]);

  // Handler for submitting form
  const handleSubmitForm = useCallback(async () => {
    if (!submitForm) return;

    setIsSubmitting(true);
    try {
      const success = await submitForm();
      setIsSubmitting(false);
      if (success) {
        router.push('/forms');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setIsSubmitting(false);
    }
  }, [submitForm, router]);

  // Get worker's entries
  const getWorkerEntries = useCallback(
    (worker: Worker) => {
      if (!entries || !worker) return [];

      return entries.filter(entry => {
        const entryUserId = entry.user?.id || entry.id;
        const workerId = worker.user?.id || worker.id;
        return entryUserId === workerId;
      });
    },
    [entries],
  );

  // Check if form can be submitted
  const canSubmitForm = form?.status === RecordStatus.DRAFT;

  // Handle navigation back to forms list
  const handleBackToList = useCallback(() => {
    router.push('/forms');
  }, [router]);

  // If there's an error loading the form
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
        <p className="text-red-500 mb-2">Lỗi tải dữ liệu biểu mẫu</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24">
      {/* Back button */}
      {formId && (
        <div className="mb-4">
          <Button variant="ghost" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
      )}

      {/* Form header card */}
      {form && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form info */}
              <div>
                <h2 className="text-lg font-semibold mb-1">
                  {form.formName || 'Biểu mẫu không tên'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {form.date ? new Date(form.date).toLocaleDateString('vi-VN') : 'Không có ngày'}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.factoryName && (
                    <Badge variant="outline" className="bg-blue-50">
                      {form.factoryName}
                    </Badge>
                  )}
                  {form.lineName && (
                    <Badge variant="outline" className="bg-green-50">
                      {form.lineName}
                    </Badge>
                  )}
                  {form.teamName && (
                    <Badge variant="outline" className="bg-yellow-50">
                      {form.teamName}
                    </Badge>
                  )}
                  {form.groupName && (
                    <Badge variant="outline" className="bg-purple-50">
                      {form.groupName}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setStatsSheetOpen(true)}>
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Thống kê
                </Button>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ArrowLeft className="h-4 w-4 mr-1" />
                  )}
                  Làm mới
                </Button>

                <FormExportActions formId={form.id} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and filters */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm công nhân..."
            className="pl-8"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setFilterSheetOpen(true)}>
          <Filter className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              Sắp xếp
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setFilters({ ...filters, sortBy: 'name' })}
                className={filters.sortBy === 'name' ? 'bg-muted' : ''}
              >
                Theo tên
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilters({ ...filters, sortBy: 'employeeId' })}
                className={filters.sortBy === 'employeeId' ? 'bg-muted' : ''}
              >
                Theo mã nhân viên
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilters({ ...filters, sortBy: 'totalOutput' })}
                className={filters.sortBy === 'totalOutput' ? 'bg-muted' : ''}
              >
                Theo sản lượng
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Workers list */}
      <div className="space-y-4 mb-20">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">Không tìm thấy công nhân nào</p>
            <Button
              variant="ghost"
              onClick={() => setFilters({ search: '', status: 'ALL', sortBy: 'name' })}
              className="mt-2"
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkers.map(worker => (
              <WorkerView
                key={worker.id}
                worker={worker}
                allWorkerEntries={getWorkerEntries(worker)}
                onUpdateHourlyData={updateHourlyData}
                onUpdateAttendanceStatus={updateAttendanceStatus}
                onUpdateShiftType={updateShiftType}
                onAddBag={(workerId, bagData) => {
                  if (!addEntry) return Promise.resolve(false);

                  return addEntry({
                    userId: workerId,
                    bagId: bagData.bagId,
                    bagName: bagData.bagName,
                    processId: bagData.processId,
                    processName: bagData.processName,
                    colorId: bagData.colorId,
                    colorName: bagData.colorName,
                    hourlyData: bagData.timeSlot
                      ? { [bagData.timeSlot]: bagData.quantity || 0 }
                      : undefined,
                  });
                }}
                refreshData={refreshData}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit button (only for draft forms) */}
      {canSubmitForm && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-center z-10">
          <Button
            onClick={handleSubmitForm}
            disabled={isSubmitting || !canSubmitForm}
            className="w-full max-w-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu và gửi báo cáo
              </>
            )}
          </Button>
        </div>
      )}

      {/* Stats Sheet */}
      <Sheet open={statsSheetOpen} onOpenChange={setStatsSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Thống kê biểu mẫu</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <Tabs value={statsTab} onValueChange={v => setStatsTab(v as any)}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="summary">Tổng quan</TabsTrigger>
                <TabsTrigger value="production">Sản lượng</TabsTrigger>
                <TabsTrigger value="attendance">Điểm danh</TabsTrigger>
              </TabsList>
              <ScrollArea className="h-[calc(100vh-180px)] mt-3">
                <TabsContent value="summary">
                  <FormStatsCard form={form} entries={entries} type="summary" />
                </TabsContent>
                <TabsContent value="production">
                  <FormStatsCard form={form} entries={entries} type="production" />
                </TabsContent>
                <TabsContent value="attendance">
                  <FormStatsCard form={form} entries={entries} type="attendance" />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Lọc công nhân</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Tình trạng điểm danh</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'ALL', label: 'Tất cả' },
                  { value: AttendanceStatus.PRESENT, label: 'Có mặt' },
                  { value: AttendanceStatus.ABSENT, label: 'Vắng' },
                  { value: AttendanceStatus.LATE, label: 'Đi muộn' },
                  { value: AttendanceStatus.EARLY_LEAVE, label: 'Về sớm' },
                  { value: AttendanceStatus.LEAVE_APPROVED, label: 'Nghỉ phép' },
                ].map(status => (
                  <div
                    key={status.value}
                    className={`border rounded-md p-2 cursor-pointer ${
                      filters.status === status.value ? 'bg-primary/10 border-primary' : ''
                    }`}
                    onClick={() => setFilters({ ...filters, status: status.value as any })}
                  >
                    <span className="text-xs">{status.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Sắp xếp theo</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'name', label: 'Tên công nhân' },
                  { value: 'employeeId', label: 'Mã nhân viên' },
                  { value: 'totalOutput', label: 'Sản lượng' },
                ].map(sort => (
                  <div
                    key={sort.value}
                    className={`border rounded-md p-2 cursor-pointer ${
                      filters.sortBy === sort.value ? 'bg-primary/10 border-primary' : ''
                    }`}
                    onClick={() => setFilters({ ...filters, sortBy: sort.value as any })}
                  >
                    <span className="text-xs">{sort.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button className="w-full" onClick={() => handleFilterChange(filters)}>
                Áp dụng bộ lọc
              </Button>
            </div>

            <div>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() =>
                  handleFilterChange({
                    search: '',
                    status: 'ALL',
                    sortBy: 'name',
                  })
                }
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DigitalFormManager;
