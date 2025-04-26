// hooks/digital-form-hooks/useCustomDigitalForm.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useDigitalFormQueries } from './useDigitalFormQueries';
import { useDigitalFormMutations } from './useDigitalFormMutations';
import { 
  DigitalForm, 
  DigitalFormEntry, 
  AttendanceStatus, 
  ProductionIssueType,
  RecordStatus 
} from '@/common/types/digital-form';
import { getCurrentTimeSlot } from '@/common/constants/time-slots';

/**
 * Enhanced hook for digital form management with optimized performance
 * Simpler API surface with better performance characteristics
 */
export const useCustomDigitalForm = (formId?: string) => {
  const queryClient = useQueryClient();
  
  // Core hooks
  const queries = useDigitalFormQueries();
  const mutations = useDigitalFormMutations();
  
  // Local state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeSlot, setCurrentTimeSlot] = useState<string | null>(
    getCurrentTimeSlot()?.label || null
  );
  
  // Get form data with entries
  const { 
    data: formWithEntries, 
    isLoading, 
    isError, 
    refetch 
  } = queries.getFormWithEntries(formId, {
    enabled: !!formId
  });
  
  // Derived UI model (converts API model to UI-friendly structure)
  const formData = useMemo(() => {
    if (!formWithEntries) return null;
    
    try {
      const { form, entries } = formWithEntries;
      
      // Map entries to worker objects for UI
      const workers = entries.map(entry => ({
        id: entry.id,
        name: entry.userName || 'Công nhân',
        employeeId: entry.userCode || entry.userId?.substring(0, 6) || 'N/A',
        bagId: entry.handBagId || '',
        bagName: entry.handBagName || 'Chưa xác định',
        processId: entry.processId || '',
        processName: entry.processName || 'Chưa xác định',
        colorId: entry.bagColorId || '',
        colorName: entry.bagColorName || 'Chưa xác định',
        attendanceStatus: entry.attendanceStatus || AttendanceStatus.PRESENT,
        hourlyData: entry.hourlyData || {},
        totalOutput: entry.totalOutput || 0,
        issues: entry.issues || [],
        qualityScore: entry.qualityScore || 100
      }));
      
      // Create UI model
      return {
        id: form.id,
        formCode: form.formCode || `FORM-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}`,
        formName: form.formName || 'Phiếu theo dõi công đoạn',
        date: form.date || new Date().toISOString(),
        factoryId: form.factoryId || '',
        factoryName: form.factoryName || 'Chưa xác định',
        lineId: form.lineId || '',
        lineName: form.lineName || 'Chưa xác định',
        teamId: form.teamId || '',
        teamName: form.teamName || 'Chưa xác định',
        groupId: form.groupId || '',
        groupName: form.groupName || 'Chưa xác định',
        status: form.status,
        workers
      };
    } catch (err) {
      console.error('Error transforming form data:', err);
      setError('Lỗi xử lý dữ liệu biểu mẫu.');
      return null;
    }
  }, [formWithEntries]);
  
  // Update loading state based on query status
  useEffect(() => {
    setLoading(isLoading);
    
    if (isError) {
      setError('Không thể tải dữ liệu biểu mẫu. Vui lòng thử lại sau.');
    } else if (formWithEntries) {
      setError(null);
    }
  }, [isLoading, isError, formWithEntries]);
  
  // Update current time slot periodically
  useEffect(() => {
    const updateTimeSlot = () => {
      const currentSlot = getCurrentTimeSlot();
      setCurrentTimeSlot(currentSlot?.label || null);
    };
    
    // Update immediately
    updateTimeSlot();
    
    // Set interval for updates
    const intervalId = setInterval(updateTimeSlot, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Refresh data function with optimized loading state
  const refreshData = useCallback(async () => {
    if (!formId) return;
    
    try {
      setLoading(true);
      await refetch();
      
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
      setLoading(false);
    }
  }, [formId, refetch]);
  
  // Submit form
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
  
  // Update hourly data with optimized mutation
  const updateHourlyData = useCallback(async (
    workerId: string, 
    timeSlot: string, 
    quantity: number
  ) => {
    if (!formId) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không tìm thấy dữ liệu biểu mẫu.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      // Use dedicated hourly data mutation for better performance
      await mutations.updateHourlyDataMutation.mutateAsync({
        formId,
        entryId: workerId,
        timeSlot,
        quantity
      });
      
      return true;
    } catch (err) {
      console.error('Error updating hourly data:', err);
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể cập nhật sản lượng. Vui lòng thử lại.',
        variant: 'destructive',
      });
      return false;
    }
  }, [formId, mutations.updateHourlyDataMutation]);
  
  // Update attendance status
  const updateAttendanceStatus = useCallback(async (
    workerId: string, 
    status: AttendanceStatus
  ) => {
    if (!formId) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không tìm thấy dữ liệu biểu mẫu.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      await mutations.updateFormEntryMutation.mutateAsync({
        formId,
        entryId: workerId,
        data: { attendanceStatus: status }
      });
      
      toast({
        title: 'Cập nhật thành công',
        description: 'Đã cập nhật trạng thái chuyên cần.',
      });
      
      return true;
    } catch (err) {
      console.error('Error updating attendance status:', err);
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể cập nhật trạng thái. Vui lòng thử lại.',
        variant: 'destructive',
      });
      return false;
    }
  }, [formId, mutations.updateFormEntryMutation]);
  
  // Add issue to worker
  const addIssue = useCallback(async (
    workerId: string, 
    issueData: {
      type: ProductionIssueType;
      hour: number;
      impact: number;
      description?: string;
    }
  ) => {
    if (!formId) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không tìm thấy dữ liệu biểu mẫu.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      // Find current worker to get existing issues
      const worker = formData?.workers.find(w => w.id === workerId);
      if (!worker) {
        throw new Error('Không tìm thấy công nhân');
      }
      
      // Create updated issues array
      const updatedIssues = [...(worker.issues || []), issueData];
      
      // Update using the entry mutation
      await mutations.updateFormEntryMutation.mutateAsync({
        formId,
        entryId: workerId,
        data: { issues: updatedIssues }
      });
      
      toast({
        title: 'Thêm vấn đề thành công',
        description: 'Đã thêm vấn đề vào biểu mẫu.',
      });
      
      return true;
    } catch (err) {
      console.error('Error adding issue:', err);
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể thêm vấn đề. Vui lòng thử lại.',
        variant: 'destructive',
      });
      return false;
    }
  }, [formId, formData, mutations.updateFormEntryMutation]);
  
  // Remove issue from worker
  const removeIssue = useCallback(async (
    workerId: string, 
    issueIndex: number
  ) => {
    if (!formId) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không tìm thấy dữ liệu biểu mẫu.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      // Find current worker to get existing issues
      const worker = formData?.workers.find(w => w.id === workerId);
      if (!worker || !worker.issues || worker.issues.length <= issueIndex) {
        throw new Error('Không tìm thấy vấn đề cần xóa');
      }
      
      // Create updated issues array without the removed issue
      const updatedIssues = [...worker.issues];
      updatedIssues.splice(issueIndex, 1);
      
      // Update using the entry mutation
      await mutations.updateFormEntryMutation.mutateAsync({
        formId,
        entryId: workerId,
        data: { issues: updatedIssues }
      });
      
      toast({
        title: 'Xóa vấn đề thành công',
        description: 'Đã xóa vấn đề khỏi biểu mẫu.',
      });
      
      return true;
    } catch (err) {
      console.error('Error removing issue:', err);
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể xóa vấn đề. Vui lòng thử lại.',
        variant: 'destructive',
      });
      return false;
    }
  }, [formId, formData, mutations.updateFormEntryMutation]);
  
  // Calculate statistics for the form
  const stats = useMemo(() => {
    if (!formData || !formData.workers || formData.workers.length === 0) {
      return {
        totalWorkers: 0,
        totalOutput: 0,
        averageOutput: 0,
        attendance: {
          present: 0,
          absent: 0,
          late: 0,
          earlyLeave: 0,
          leaveApproved: 0,
          presentPercentage: 0
        },
        completionPercentage: 0
      };
    }
    
    const totalWorkers = formData.workers.length;
    
    // Calculate total and average output
    const totalOutput = formData.workers.reduce(
      (sum, worker) => sum + (worker.totalOutput || 0),
      0
    );
    
    const averageOutput = totalWorkers > 0 
      ? Math.round(totalOutput / totalWorkers) 
      : 0;
    
    // Calculate attendance stats
    const present = formData.workers.filter(
      worker => worker.attendanceStatus === AttendanceStatus.PRESENT
    ).length;
    
    const absent = formData.workers.filter(
      worker => worker.attendanceStatus === AttendanceStatus.ABSENT
    ).length;
    
    const late = formData.workers.filter(
      worker => worker.attendanceStatus === AttendanceStatus.LATE
    ).length;
    
    const earlyLeave = formData.workers.filter(
      worker => worker.attendanceStatus === AttendanceStatus.EARLY_LEAVE
    ).length;
    
    const leaveApproved = formData.workers.filter(
      worker => worker.attendanceStatus === AttendanceStatus.LEAVE_APPROVED
    ).length;
    
    const presentPercentage = totalWorkers > 0
      ? Math.round((present / totalWorkers) * 100)
      : 0;
    
    // Calculate form completion percentage
    let filledTimeSlots = 0;
    let totalTimeSlots = 0;
    
    formData.workers.forEach(worker => {
      // Count time slots that have data
      filledTimeSlots += Object.keys(worker.hourlyData || {}).length;
      // Each worker has 12 potential time slots (based on TIME_SLOTS constant)
      totalTimeSlots += 12;
    });
    
    const completionPercentage = totalTimeSlots > 0
      ? Math.round((filledTimeSlots / totalTimeSlots) * 100)
      : 0;
    
    return {
      totalWorkers,
      totalOutput,
      averageOutput,
      attendance: {
        present,
        absent,
        late,
        earlyLeave,
        leaveApproved,
        presentPercentage
      },
      completionPercentage
    };
  }, [formData]);
  
  // Approve form
  const approveForm = useCallback(async () => {
    if (!formId) return false;
    
    try {
      await mutations.approveFormMutation.mutateAsync(formId);
      
      toast({
        title: 'Phê duyệt thành công',
        description: 'Biểu mẫu đã được phê duyệt.',
      });
      
      return true;
    } catch (err) {
      console.error('Error approving form:', err);
      toast({
        title: 'Lỗi phê duyệt',
        description: 'Không thể phê duyệt biểu mẫu. Vui lòng thử lại.',
        variant: 'destructive',
      });
      return false;
    }
  }, [formId, mutations.approveFormMutation]);
  
  // Reject form
  const rejectForm = useCallback(async () => {
    if (!formId) return false;
    
    try {
      await mutations.rejectFormMutation.mutateAsync(formId);
      
      toast({
        title: 'Từ chối thành công',
        description: 'Biểu mẫu đã bị từ chối.',
      });
      
      return true;
    } catch (err) {
      console.error('Error rejecting form:', err);
      toast({
        title: 'Lỗi từ chối',
        description: 'Không thể từ chối biểu mẫu. Vui lòng thử lại.',
        variant: 'destructive',
      });
      return false;
    }
  }, [formId, mutations.rejectFormMutation]);
  
  return {
    // Data
    formData,
    loading,
    error,
    stats,
    currentTimeSlot,
    
    // Core operations
    refreshData,
    submitFormData,
    updateHourlyData,
    updateAttendanceStatus,
    addIssue,
    removeIssue,
    approveForm,
    rejectForm,
    
    // Access to underlying hooks
    queries,
    mutations
  };
};