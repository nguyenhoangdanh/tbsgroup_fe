import React, { useState, useCallback } from "react";
import { WorkLog } from "@/screens/public/form/workLogTypes";

/**
 * Enhanced PDF export integration for WorkLogContainer
 * Usage example:
 * 
 * // At the top of your component
 * const ExportIntegration = () => {
 *   // Other component state and hooks
 *   const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
 *   const { handleExportPDF } = usePdfExportHandler();
 *   const exportIntegration = useExportIntegration(exportFormat, handleExportPDF, exportToExcel);
 * 
 *   // Then in your DropdownMenu for exports
 *   <DropdownMenuContent align="end">
 *     <DropdownMenuItem onClick={() => exportIntegration.exportSingleEntry(workLog)}>
 *       PDF (Chỉ công việc này)
 *     </DropdownMenuItem>
 *     <DropdownMenuItem onClick={() => exportIntegration.exportFullReport(workLog)}>
 *       PDF (Tất cả công việc trong ngày)
 *     </DropdownMenuItem>
 *     <DropdownMenuItem onClick={() => exportIntegration.exportExcel(workLog)}>
 *       Excel
 *     </DropdownMenuItem>
 *   </DropdownMenuContent>
 */
export const useExportIntegration = (
  exportFormat: "pdf" | "excel",
  pdfExportHandler: (workLog: WorkLog, isFullReport: boolean) => Promise<void>,
  excelExportHandler: (workLog: WorkLog) => void
) => {
  // Export a single entry as PDF
  const exportSingleEntry = useCallback((workLog: WorkLog) => {
    return pdfExportHandler(workLog, false);
  }, [pdfExportHandler]);

  // Export full report (all entries for the day) as PDF
  const exportFullReport = useCallback((workLog: WorkLog) => {
    return pdfExportHandler(workLog, true);
  }, [pdfExportHandler]);

  // Export as Excel
  const exportExcel = useCallback((workLog: WorkLog) => {
    return excelExportHandler(workLog);
  }, [excelExportHandler]);

  return {
    exportSingleEntry,
    exportFullReport,
    exportExcel,
    currentFormat: exportFormat
  };
};