'use client';

import { Loader2, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-toast-kit';

import { AttendanceStatus, RecordStatus } from '@/common/types/digital-form';
import type { Worker } from '@/common/types/worker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { FilterSheet } from './_components/FilterSheet';
import { FormHeader } from './_components/FormHeader';
import { ImprovedWorkerView } from './_components/ImprovedWorkerView';
import { StatsSheet } from './_components/StatsSheet';
import { SubmitDialog } from './_components/SubmitDialog';




import { useForm } from '@/contexts/form-context';

interface DigitalFormContainerProps {
  formId?: string;
}

export default function DigitalFormContainer({ formId }: DigitalFormContainerProps) {
  const router = useRouter();
  const {
    formData,
    error,
    currentTimeSlot,
    refreshData,
    submitFormData,
    updateHourlyData,
    updateAttendanceStatus,
    updateShiftType,
    addBagForTimeSlot,
  } = useForm();

  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL' as AttendanceStatus | 'ALL',
    sortBy: 'name' as 'name' | 'employeeId' | 'totalOutput',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showStatsSheet, setShowStatsSheet] = useState(false);
  const [statsTab, setStatsTab] = useState<'summary' | 'production' | 'attendance'>('summary');

  //Group all workers by user ID to avoid duplicate cards
  const uniqueWorkers = useMemo(() => {
    if (!formData || !formData.workers) return [];

    //Group entries by user ID
    const userMap = new Map();

    //Select one entry for each user (we'll pass all entries later)
    formData.workers.forEach(worker => {
      if (worker.user?.id) {
        //Only add the first instance of each worker
        if (!userMap.has(worker.user.id)) {
          userMap.set(worker.user.id, worker);
        }
      } else if (worker.id && !userMap.has(worker.id)) {
        //Fallback to worker ID if no user ID
        userMap.set(worker.id, worker);
      }
    });

    return Array.from(userMap.values());
  }, [formData]);

  //Filter and sort workers when formData or filters change
  useEffect(() => {
    if (uniqueWorkers.length > 0) {
      let workers = [...uniqueWorkers];

      //Apply search filter
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
      workers.sort((a: Worker, b: Worker) => {
        if (filters.sortBy === 'name') {
          const nameA = a.user?.fullName || a.name || '';
          const nameB = b.user?.fullName || b.name || '';
          return nameA.localeCompare(nameB);
        } else if (filters.sortBy === 'employeeId') {
          const idA = a.user?.employeeId || a.employeeId || '';
          const idB = b.user?.employeeId || b.employeeId || '';
          return idA.localeCompare(idB);
        } else {
          // For total output, we calculate from all of user's entries
          const getWorkerTotalOutput = (worker: Worker) => {
            if (!formData) return 0;

            // Find all entries for this worker
            const workerEntries = formData.workers.filter(entry => {
              if (worker.user?.id && entry.user?.id) {
                return entry.user.id === worker.user.id;
              } else {
                return entry.id === worker.id;
              }
            });

            //Sum all outputs
            return workerEntries.reduce((sum, entry) => sum + (entry.totalOutput || 0), 0);
          };

          return getWorkerTotalOutput(b) - getWorkerTotalOutput(a);
        }
      });

      setFilteredWorkers(workers);
    }
  }, [uniqueWorkers, filters, formData]);

  //Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: {
      search: string;
      status: AttendanceStatus | 'ALL';
      sortBy: 'name' | 'employeeId' | 'totalOutput';
    }) => {
      setFilters(newFilters);
    },
    [],
  );

  //Handle refresh action
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshData();
      toast({
        title: 'Đã làm mới dữ liệu',
        description: 'Dữ liệu biểu mẫu đã được cập nhật thành công',
      });
    } catch (err) {
      console.error('Error refreshing data:', err);
      toast({
        title: 'Lỗi làm mới dữ liệu',
        description: 'Không thể làm mới dữ liệu. Vui lòng thử lại sau.',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData, toast]);

  //Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const success = await submitFormData();

      if (success) {
        toast({
          title: 'Gửi thành công',
          description: 'Biểu mẫu đã được gửi thành công',
        });
        setShowSubmitDialog(false);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      toast({
        title: 'Lỗi gửi biểu mẫu',
        description: 'Không thể gửi biểu mẫu. Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [submitFormData, toast]);

  //Navigate back to the list page
  const handleBackToList = useCallback(() => {
    router.push('/digital-forms');
  }, [router]);

  //Check if form can be submitted
  const canSubmitForm = formData?.status === RecordStatus.DRAFT;

  //Get worker entries for selected worker
  const getWorkerEntries = useCallback(
    (worker: Worker) => {
      if (!formData || !formData.workers || !worker) return [];

      return formData.workers.filter(entry => {
        if (worker.user?.id && entry.user?.id) {
          return entry.user.id === worker.user.id;
        } else {
          return entry.id === worker.id;
        }
      });
    },
    [formData],
  );

  //Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
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

  //Get current worker (the first one in the filtered list)
  const currentWorker = filteredWorkers.length > 0 ? filteredWorkers[0] : null;
  const workerEntries = currentWorker ? getWorkerEntries(currentWorker) : [];

  return (
    <main className="container mx-auto p-4 pb-24">
      {formData && (
        <>
          {formId && (
            <div className="mb-4">
              <Button variant="ghost" onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách
              </Button>
            </div>
          )}

          <Card className="mb-6">
            {/* Form Header Component */}
            <FormHeader
              formData={formData}
              onOpenStats={() => setShowStatsSheet(true)}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </Card>

          <div className="space-y-4 mb-20">
            {currentWorker ? (
              <ImprovedWorkerView
                worker={currentWorker}
                currentTimeSlot={currentTimeSlot}
                allWorkerEntries={workerEntries}
                onUpdateHourlyData={updateHourlyData}
                onUpdateAttendanceStatus={updateAttendanceStatus}
                onUpdateShiftType={updateShiftType}
                onAddBag={(workerId, bagData) => {
                  if (bagData.timeSlot) {
                    return addBagForTimeSlot(workerId, {
                      ...bagData,
                      timeSlot: bagData.timeSlot || currentTimeSlot || '',
                      quantity: bagData.quantity || 0,
                    });
                  } else {
                    return addBagForTimeSlot(workerId, {
                      ...bagData,
                      timeSlot: currentTimeSlot || '',
                      quantity: 0,
                    });
                  }
                }}
                refreshData={refreshData}
              />
            ) : (
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
            )}
          </div>

          {/* Only show submit button for DRAFT forms */}
          {canSubmitForm && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-center z-10">
              <Button
                onClick={() => setShowSubmitDialog(true)}
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

          {/* Filter Sheet Component */}
          <FilterSheet
            open={showFilterSheet}
            onOpenChange={setShowFilterSheet}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Stats Sheet Component */}
          <StatsSheet
            open={showStatsSheet}
            onOpenChange={setShowStatsSheet}
            formData={formData}
            activeTab={statsTab}
            onTabChange={(tab: 'summary' | 'production' | 'attendance') => setStatsTab(tab)}
          />

          {/* Submit Dialog Component */}
          <SubmitDialog
            open={showSubmitDialog}
            onOpenChange={setShowSubmitDialog}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </>
      )}
    </main>
  );
}
