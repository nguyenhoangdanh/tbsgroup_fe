import { useCallback } from 'react';
import { WorkLog } from "@/screens/public/form/workLogTypes";
import { toast } from "@/hooks/use-toast";
import { generateClientSidePDF } from './pdfGenerator';

/**
 * PDF Export Handler using client-side generation
 */
export const usePdfExportHandler = () => {
  const handleExportPDF = useCallback(async (workLog: WorkLog, isFullReport: boolean = false) => {
    try {
      // Show loading toast
      toast({
        title: "Đang tạo PDF",
        description: "Vui lòng đợi trong giây lát..."
      });
      
      // Generate PDF client-side
      const pdfUrl = await generateClientSidePDF(workLog, isFullReport);
      
      // Open the PDF in a new tab
      const newWindow = window.open(pdfUrl, '_blank');
      
      // Check if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        toast({
          title: "PDF đã sẵn sàng",
          description: "Popup bị chặn. Vui lòng bỏ chặn popup hoặc nhấn vào đường dẫn",
          variant: "default"
        });
      } else {
        // Success notification
        toast({
          title: "Xuất PDF thành công",
          description: "PDF đã được tạo thành công"
        });
      }
    } catch (error) {
      console.error("Lỗi tạo PDF:", error);
      toast({
        title: "Lỗi xuất PDF",
        description: error instanceof Error ? error.message : "Không thể tạo PDF",
        variant: "destructive"
      });
    }
  }, []);

  return { handleExportPDF };
};