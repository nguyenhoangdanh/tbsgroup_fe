// hooks/digital-form-hooks/mutations/exportFormMutation.ts
import { useMutation } from '@tanstack/react-query';
import { DigitalFormService } from '@/services/digitalFormService';
import { toast } from '@/hooks/use-toast';

/**
 * Hook for exporting a digital form to Excel or PDF
 */
export const useExportFormMutation = () => {
  return useMutation({
    mutationFn: ({ formId, format }: { formId: string, format: 'excel' | 'pdf' }) => 
      DigitalFormService.exportForm(formId, format),
    
    onMutate: () => {
      toast({
        title: 'Đang xuất biểu mẫu...',
        description: 'Quá trình này có thể mất vài giây.',
        duration: 5000,
      });
    },
    
    onSuccess: (result) => {
      toast({
        title: 'Biểu mẫu đã được xuất thành công',
        description: 'File sẽ được tải xuống sau ít giây.',
        duration: 2000,
      });
      
      // Trigger download if fileUrl is available
      if (result?.data?.fileUrl) {
        window.open(result.data.fileUrl, '_blank');
      }
    },
    
    onError: (error) => {
      toast({
        title: 'Không thể xuất biểu mẫu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
        duration: 3000,
      });
    },
  });
};

export default useExportFormMutation;