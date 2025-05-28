'use client';
import { Download, FileSpreadsheet, ChevronDown, Printer, Loader2, File } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-toast-kit';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDigitalFormMutations } from '@/hooks/digital-form/useDigitalFormMutations';

interface FormExportActionsProps {
  formId: string;
}

export const FormExportActions: React.FC<FormExportActionsProps> = ({ formId }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const { exportFormsMutation } = useDigitalFormMutations();

  const handleExport = async (format: 'excel' | 'pdf' | 'print') => {
    if (!formId || isExporting) return;

    setIsExporting(true);
    setExportFormat(format);

    try {
      if (format === 'print') {
        // Open print version in new tab
        window.open(`/forms/${formId}/print`, '_blank');
        setIsExporting(false);
        return;
      }

      // Use the export mutation for non-print formats
      const result = await exportFormsMutation.mutateAsync([formId]);

      if (result?.url) {
        // Create a temporary link element and trigger download
        const link = document.createElement('a');
        link.href = result.url;
        link.download = `form-${formId}.${format}`;
        link.click();

        toast({
          title: 'Xuất báo cáo thành công',
          description: `Báo cáo đã được tải xuống dưới dạng ${format.toUpperCase()}`,
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Lỗi xuất báo cáo',
        description: 'Không thể xuất báo cáo. Vui lòng thử lại sau.',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Đang xuất...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              Xuất báo cáo
              <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => handleExport('excel')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          <span>Xuất Excel</span>
          {exportFormat === 'excel' && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          <File className="h-4 w-4 mr-2 text-red-600" />
          <span>Xuất PDF</span>
          {exportFormat === 'pdf' && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => handleExport('print')}
          disabled={isExporting}
        >
          <Printer className="h-4 w-4 mr-2 text-blue-600" />
          <span>Phiên bản in</span>
          {exportFormat === 'print' && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FormExportActions;
