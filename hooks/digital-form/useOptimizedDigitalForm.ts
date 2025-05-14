// hooks/digital-form-hooks/useOptimizedDigitalForm.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDigitalFormQueries } from './useDigitalFormQueries';
import { useDigitalFormMutations } from './useDigitalFormMutations';
import { useDigitalFormHelpers } from './useDigitalFormHelpers';
import { TIME_SLOTS } from '@/common/constants/time-slots';
import { getCurrentTimeSlot } from '@/common/constants/time-slots';
import { toast } from '@/hooks/use-toast';
import { AttendanceStatus, ProductionIssueType, RecordStatus, ShiftType } from '@/common/types/digital-form';
import { FormData, Worker } from '@/common/types/worker';
import { useLoading } from '@/components/common/loading/LoadingProvider';
import { useMultiBagTimeSlot } from './useMultiBagTimeSlot';

/**
 * Optimized hook for digital form management with better performance
 * Combines multiple hooks and provides a simpler interface for the UI
 */
export const useOptimizedDigitalForm = (formId?: string) => {
  const queryClient = useQueryClient();
  
  // Get existing hooks
  const queries = useDigitalFormQueries();
  const mutations = useDigitalFormMutations();
  const helpers = useDigitalFormHelpers();

  // Get multi-bag time slot functionality
  const multiBagTimeSlot = formId ? useMultiBagTimeSlot(formId) : null;
  
  // Local state for UI
  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [currentTimeSlotLabel, setCurrentTimeSlotLabel] = useState<string | null>(
    getCurrentTimeSlot()?.label || null
  );
  
  // Load form data
  const { data: formWithEntries, isLoading, isError } = queries.getFormWithEntries(formId, {
    enabled: !!formId
  });
  const { startLoading, stopLoading } = useLoading();
  const title = 'DigitalForm';
  const loadingKey = `table-data-${title.replace(/\s+/g, "-").toLowerCase()}`;
  
  // Transform API data to UI model
  useEffect(() => {
    if (isLoading) {
      // setLoading(true);
      startLoading(loadingKey, {
        variant: 'fullscreen',
        delay: 0,
    });
      return;
    }
    
    if (isError) {
      setError('Không thể tải dữ liệu biểu mẫu. Vui lòng thử lại sau.');
      // setLoading(false);
      stopLoading(loadingKey);
      return;
    }

    if (formWithEntries) {
      try {
        // Transform data into UI-friendly format
        const uiFormData: FormData = {
          id: formWithEntries.form.id,
          formCode: formWithEntries.form.formCode || `FORM-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}`,
          formName: formWithEntries.form.formName || 'Phiếu theo dõi công đoạn',
          date: formWithEntries.form.date || new Date().toISOString(),
          factoryId: formWithEntries.form.factoryId || '',
          factoryName: formWithEntries.form.factoryName || 'Chưa xác định',
          lineId: formWithEntries.form.lineId || '',
          lineName: formWithEntries.form.lineName || 'Chưa xác định',
          teamId: formWithEntries.form.teamId || '',
          teamName: formWithEntries.form.teamName || 'Chưa xác định',
          groupId: formWithEntries.form.groupId || '',
          groupName: formWithEntries.form.groupName || 'Chưa xác định',
          status: formWithEntries.form.status,
          workers: formWithEntries.entries.map(entry => ({
            id: entry.id,
            name: entry.userName || 'Công nhân',
            employeeId: entry.userCode || entry.userId?.substring(0, 6) || 'N/A',
            bagId: entry.handBag?.id || '',
            bagName: entry.handBag?.name || 'Chưa xác định',
            processId: entry.process?.id || '',
            processName: entry.process?.name || 'Chưa xác định',
            colorId: entry.bagColor?.id || '',
            colorName: entry.bagColor?.colorName || 'Chưa xác định',
            attendanceStatus: entry.attendanceStatus || AttendanceStatus.PRESENT,
            attendanceNote: entry.attendanceNote || '',
            shiftType: entry.shiftType || ShiftType.REGULAR,
            hourlyData: entry.hourlyData || {},
            totalOutput: entry.totalOutput || 0,
            issues: entry.issues || [],
            qualityScore: entry.qualityScore || 100,
            user: entry.user,
            handBag: entry.handBag,
            process: entry.process,
            bagColor: entry.bagColor,
          }))
        };
        
        setFormData(uiFormData);
        setError(null);
      } catch (err) {
        console.error('Error transforming form data:', err);
        setError('Lỗi xử lý dữ liệu biểu mẫu.');
      }
    }
    
    // setLoading(false);
    stopLoading(loadingKey);
  }, [formWithEntries, isLoading, isError]);
  
  // Update current time slot periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentSlot = getCurrentTimeSlot();
      setCurrentTimeSlotLabel(currentSlot?.label || null);
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, []);

 
  
  // Refresh data
  const refreshData = useCallback(async () => {
    if (!formId) return;
    
    // setLoading(true);
    startLoading(loadingKey, {
      variant: 'fullscreen',
      delay: 0,
  });
    try {
      await queryClient.invalidateQueries({
        queryKey: ['digital-form-with-entries', formId]
      });
      
      toast({
        title: 'Đã làm mới dữ liệu',
        description: 'Dữ liệu biểu mẫu đã được cập nhật',
      });
    } catch (err) {
      console.error('Error refreshing data:', err);
      toast({
        title: 'Lỗi làm mới dữ liệu',
        description: 'Không thể cập nhật dữ liệu. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      // setLoading(false);
      stopLoading(loadingKey);
    }
  }, [formId, queryClient]);

  const addBagForTimeSlot = useCallback(async (
    workerId: string,
    bagData: {
      bagId: string;
      bagName: string;
      processId: string;
      processName: string;
      colorId: string;
      colorName: string;
      timeSlot: string;
      quantity: number;
    }
  ) => {
    if (!formId || !multiBagTimeSlot) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không tìm thấy dữ liệu biểu mẫu.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      const success = await multiBagTimeSlot.addBagForTimeSlot(workerId, bagData);
      
      if (success) {
        // Refresh data after successful update
        await refreshData();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error adding bag for time slot:', error);
      toast({
        title: 'Lỗi thêm túi mới',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định',
        variant: 'destructive',
      });
      return false;
    }
  }, [formId, multiBagTimeSlot, refreshData]);
   
 const updateBagTimeSlotOutput = useCallback(async (
  entryId: string,
  timeSlot: string,
  quantity: number
) => {
  if (!formId || !multiBagTimeSlot) {
    toast({
      title: 'Lỗi cập nhật',
      description: 'Không tìm thấy dữ liệu biểu mẫu.',
      variant: 'destructive',
    });
    return false;
  }
  
  try {
    const success = await multiBagTimeSlot.updateBagTimeSlotOutput(entryId, timeSlot, quantity);
    
    if (success) {
      // Refresh data after successful update
      await refreshData();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating bag time slot output:', error);
    toast({
      title: 'Lỗi cập nhật sản lượng',
      description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định',
      variant: 'destructive',
    });
    return false;
  }
}, [formId, multiBagTimeSlot, refreshData]);
  
    // Get bags for a specific time slot
    const getBagsForTimeSlot = useCallback((
      workerId: string,
      timeSlot: string
    ) => {
      if (!formWithEntries || !multiBagTimeSlot) {
        return [];
      }
      
      return multiBagTimeSlot.getBagsForTimeSlot(workerId, timeSlot, formWithEntries.entries);
    }, [formWithEntries, multiBagTimeSlot]);
  
    // Get hourly data organized by time slot
    const getHourlyDataByTimeSlot = useCallback((
      workerId: string
    ) => {
      if (!formWithEntries || !multiBagTimeSlot) {
        return {};
      }
      
      return multiBagTimeSlot.getHourlyDataByTimeSlot(workerId, formWithEntries.entries);
    }, [formWithEntries, multiBagTimeSlot]);
  
    const submitFormData = useCallback(async () => {
      if (!formId || !formData) {
        toast({
          title: 'Lỗi gửi biểu mẫu',
          description: 'Không tìm thấy dữ liệu biểu mẫu để gửi.',
          variant: 'destructive',
        });
        return false;
      }
      
      // Check if form is in DRAFT status
      if (formData.status !== RecordStatus.DRAFT) {
        toast({
          title: 'Không thể gửi biểu mẫu',
          description: 'Chỉ có thể gửi biểu mẫu ở trạng thái nháp.',
          variant: 'destructive',
        });
        return false;
      }
      
      try {
        await mutations.submitFormMutation.mutateAsync({ formId });
        
        toast({
          title: 'Gửi biểu mẫu thành công',
          description: 'Biểu mẫu đã được gửi đi thành công.',
        });
        
        return true;
      } catch (err) {
        console.error('Error submitting form:', err);
        toast({
          title: 'Lỗi gửi biểu mẫu',
          description: 'Không thể gửi biểu mẫu. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
        return false;
      }
    }, [formId, formData, mutations.submitFormMutation]);
    
    // Update hourly data
    const updateHourlyData = useCallback(async (
      workerId: string, 
      timeSlot: string, 
      quantity: number
    ) => {
      if (!formId || !formData) {
        toast({
          title: 'Lỗi cập nhật',
          description: 'Không tìm thấy dữ liệu biểu mẫu.',
          variant: 'destructive',
        });
        return false;
      }
      
      try {
        // Find the entry in form data
        const worker = formData.workers.find((w: Worker) => w.id === workerId);
        if (!worker) {
          throw new Error('Không tìm thấy công nhân');
        }
        
        // Optimize by using the dedicated hourly data mutation
        await mutations.updateHourlyDataMutation.mutateAsync({
          formId,
          entryId: workerId,
          timeSlot,
          quantity
        });
        
        // Optimistic update of local state
        setFormData(prevData => {
          if (!prevData) return null;
          
          return {
            ...prevData,
            workers: prevData.workers.map((worker: Worker) => {
              if (worker.id === workerId) {
                // Update hourly data for this specific time slot
                const newHourlyData = {
                  ...worker.hourlyData,
                  [timeSlot]: quantity
                };
                
                // Recalculate total output
                const newTotalOutput = Object.values(newHourlyData).reduce(
                  (sum, value) => sum + (value || 0), 
                  0
                );
                
                return {
                  ...worker,
                  hourlyData: newHourlyData,
                  totalOutput: newTotalOutput
                };
              }
              return worker;
            })
          };
        });
        
        return true;
      } catch (err) {
        console.error('Error updating hourly data:', err);
        
        // Revert the optimistic update on error by refreshing data
        await refreshData();
        
        toast({
          title: 'Lỗi cập nhật',
          description: 'Không thể cập nhật sản lượng. Vui lòng thử lại.',
          variant: 'destructive',
        });
        
        return false;
      }
    }, [formId, formData, mutations.updateHourlyDataMutation, refreshData]);
  // Update attendance status
  const updateAttendanceStatus = useCallback(async (
    workerId: string,
    status: AttendanceStatus,
    attendanceNote?: string
  ) => {
    if (!formId || !formData) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không tìm thấy dữ liệu biểu mẫu.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      // Update using the updateFormEntryMutation
      await mutations.updateFormEntryMutation.mutateAsync({
        formId,
        entryId: workerId,
        data: {
          attendanceStatus: status,
          attendanceNote,
        }
      });
      
      // Optimistic update
      setFormData(prevData => {
        if (!prevData) return null;
        
        return {
          ...prevData,
          workers: prevData.workers.map((worker: Worker) => {
            if (worker.id === workerId) {
              return {
                ...worker,
                attendanceStatus: status,
                attendanceNote: attendanceNote || worker.attendanceNote,
              };
            }
            return worker;
          })
        };
      });
      
      toast({
        title: 'Cập nhật thành công',
        description: 'Đã cập nhật trạng thái chuyên cần.',
      });
      
      return true;
    } catch (err) {
      console.error('Error updating attendance status:', err);
      
      // Revert optimistic update
      await refreshData();
      
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể cập nhật trạng thái. Vui lòng thử lại.',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [formId, formData, mutations.updateFormEntryMutation, refreshData]);

  const updateShiftType = useCallback(async (
    workerId: string,
    shiftType: ShiftType,
  ) => {
    if (!formId || !formData) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không tìm thấy dữ liệu biểu mẫu.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      // Update using the updateShiftTypeMutation
      await mutations.updateShiftTypeMutation.mutateAsync({
        formId,
        entryId: workerId,
        data: {
          shiftType
        }
      });
      
      // Optimistic update
      setFormData(prevData => {
        if (!prevData) return null;
        
        return {
          ...prevData,
          workers: prevData.workers.map((worker: Worker) => {
            if (worker.id === workerId) {
              return {
                ...worker,
                shiftType,
              };
            }
            return worker;
          })
        };
      });
      
      toast({
        title: 'Cập nhật thành công',
        description: 'Đã cập nhật ca làm việc.',
      });
      
      return true;
    } catch (err) {
      console.error('Error updating shift type:', err);
      
      // Revert optimistic update
      await refreshData();
      
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể cập nhật ca làm việc. Vui lòng thử lại.',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [formId, formData, mutations.updateShiftTypeMutation, refreshData]);
  
  // Add issue to entry
  const addIssue = useCallback(async (
    workerId: string, 
    issueData: {
      type: ProductionIssueType;
      hour: number;
      impact: number;
      description?: string;
    }
  ) => {
    if (!formId || !formData) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không tìm thấy dữ liệu biểu mẫu.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      // Find the worker in form data
      const worker = formData.workers.find((w: Worker) => w.id === workerId);
      if (!worker) {
        throw new Error('Không tìm thấy công nhân');
      }
      
      // Get existing issues
      const currentIssues = [...(worker.issues || [])];
      
      // Add new issue
      const updatedIssues = [...currentIssues, issueData];
      
      // Update using updateFormEntryMutation
      await mutations.updateFormEntryMutation.mutateAsync({
        formId,
        entryId: workerId,
        data: { issues: updatedIssues }
      });
      
      // Optimistic update
      setFormData(prevData => {
        if (!prevData) return null;
        
        return {
          ...prevData,
          workers: prevData.workers.map((worker: Worker) => {
            if (worker.id === workerId) {
              return {
                ...worker,
                issues: updatedIssues
              };
            }
            return worker;
          })
        };
      });
      
      toast({
        title: 'Thêm vấn đề thành công',
        description: 'Đã thêm vấn đề vào biểu mẫu.',
      });
      
      return true;
    } catch (err) {
      console.error('Error adding issue:', err);
      
      // Revert optimistic update
      await refreshData();
      
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể thêm vấn đề. Vui lòng thử lại.',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [formId, formData, mutations.updateFormEntryMutation, refreshData]);
  
  // Remove issue from entry
  const removeIssue = useCallback(async (
    workerId: string, 
    issueIndex: number
  ) => {
    if (!formId || !formData) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không tìm thấy dữ liệu biểu mẫu.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      // Find the worker in form data
      const worker = formData.workers.find((w: Worker) => w.id === workerId);
      if (!worker || !worker.issues || worker.issues.length <= issueIndex) {
        throw new Error('Không tìm thấy vấn đề cần xóa');
      }
      
      // Create a new array without the issue at the specified index
      const updatedIssues = [...worker.issues];
      updatedIssues.splice(issueIndex, 1);
      
      // Update using updateFormEntryMutation
      await mutations.updateFormEntryMutation.mutateAsync({
        formId,
        entryId: workerId,
        data: { issues: updatedIssues }
      });
      
      // Optimistic update
      setFormData(prevData => {
        if (!prevData) return null;
        
        return {
          ...prevData,
          workers: prevData.workers.map((worker: Worker) => {
            if (worker.id === workerId) {
              return {
                ...worker,
                issues: updatedIssues
              };
            }
            return worker;
          })
        };
      });
      
      toast({
        title: 'Xóa vấn đề thành công',
        description: 'Đã xóa vấn đề khỏi biểu mẫu.',
      });
      
      return true;
    } catch (err) {
      console.error('Error removing issue:', err);
      
      // Revert optimistic update
      await refreshData();
      
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể xóa vấn đề. Vui lòng thử lại.',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [formId, formData, mutations.updateFormEntryMutation, refreshData]);
  
 // Calculate statistics
 const stats = useMemo(() => {
  if (!formData || !formData.workers || formData.workers.length === 0) {
    return {
      workerCompletionStats: [],
      overallCompletionPercentage: 0,
      totalOutput: 0,
      averageOutput: 0,
      attendance: {
        present: 0,
        absent: 0,
        late: 0,
        earlyLeave: 0,
        leaveApproved: 0,
        presentPercentage: 0
      }
    };
  }
  
  // Calculate completion percentage for each worker
  const workerCompletionStats = formData.workers.map((worker: Worker) => {
    const completedSlots = Object.keys(worker.hourlyData || {}).length;
    const totalSlots = TIME_SLOTS.length;
    const completionPercentage = Math.round((completedSlots / totalSlots) * 100);
    
    return {
      workerId: worker.id,
      workerName: worker.name,
      completionPercentage,
      completedSlots,
      totalSlots
    };
  });
  
  // Calculate overall completion
  const totalSlots = formData.workers.length * TIME_SLOTS.length;
  let filledSlots = 0;
  
  formData.workers.forEach((worker: Worker) => {
    filledSlots += Object.keys(worker.hourlyData || {}).length;
  });
  
  const overallCompletionPercentage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
  
  // Total output stats
  const totalOutput = formData.workers.reduce(
    (sum: number, worker: Worker) => sum + (worker.totalOutput || 0), 
    0
  );
  
  const averageOutput = formData.workers.length > 0 
    ? Math.round(totalOutput / formData.workers.length) 
    : 0;
  
  // Attendance stats
  const present = formData.workers.filter(
    (w: Worker) => w.attendanceStatus === AttendanceStatus.PRESENT
  ).length;
  
  const absent = formData.workers.filter(
    (w: Worker) => w.attendanceStatus === AttendanceStatus.ABSENT
  ).length;
  
  const late = formData.workers.filter(
    (w: Worker) => w.attendanceStatus === AttendanceStatus.LATE
  ).length;
  
  const earlyLeave = formData.workers.filter(
    (w: Worker) => w.attendanceStatus === AttendanceStatus.EARLY_LEAVE
  ).length;
  
  const leaveApproved = formData.workers.filter(
    (w: Worker) => w.attendanceStatus === AttendanceStatus.LEAVE_APPROVED
  ).length;
  
  const presentPercentage = formData.workers.length > 0
    ? Math.round((present / formData.workers.length) * 100)
    : 0;
  
  return {
    workerCompletionStats,
    overallCompletionPercentage,
    totalOutput,
    averageOutput,
    attendance: {
      present,
      absent,
      late,
      earlyLeave,
      leaveApproved,
      presentPercentage
    }
  };
}, [formData]);
  
  return {
    // Data
    formData,
    // loading,
    error,
    currentTimeSlot: currentTimeSlotLabel,
    stats,

    // Multi-bag functionality
    addBagForTimeSlot,
    updateBagTimeSlotOutput,
    getBagsForTimeSlot,
    getHourlyDataByTimeSlot,
    
    // Actions
    refreshData,
    submitFormData,
    updateHourlyData,
    updateAttendanceStatus,
    updateShiftType,
    addIssue,
    removeIssue,
    
    // Original hooks for more advanced operations
    queries,
    mutations,
    helpers
  };
};

export default useOptimizedDigitalForm;