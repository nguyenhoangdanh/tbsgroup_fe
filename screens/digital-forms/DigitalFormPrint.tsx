// screens/digital-forms/DigitalFormPrint.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    ShiftType,
    AttendanceStatus,
    STANDARD_TIME_INTERVALS
} from '@/common/types/digital-form';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { useDigitalForms } from '@/hooks/digital-form/useDigitalForms';

const shiftLabels = {
    [ShiftType.REGULAR]: 'Ca Chính (7h30-16h30)',
    [ShiftType.EXTENDED]: 'Ca Kéo Dài (16h30-18h)',
    [ShiftType.OVERTIME]: 'Ca Tăng Ca (18h-20h)',
};

const DigitalFormPrint: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;

    // Fetch form data with entries
    const { data, isLoading } = useDigitalForms().getFormWithEntries(id as string);
    const form = data?.data?.form;
    const entries = data?.data?.entries || [];

    // Auto-print when loaded
    useEffect(() => {
        if (form && entries.length > 0 && !isLoading) {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [form, entries, isLoading]);

    // Handle back button
    const handleBack = () => {
        router.push(`/digital-forms/${id}`);
    };

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Handle export PDF
    const handleExportPDF = async () => {
        try {
            const element = document.getElementById('printable-form');
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 1,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 297; // A4 width in landscape (mm)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${form?.formCode || 'phieu-cong-doan'}.pdf`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
        }
    };

    // Get appropriate time intervals based on shift type
    const getTimeIntervals = () => {
        if (!form) return [];

        if (form.shiftType === ShiftType.REGULAR) {
            return STANDARD_TIME_INTERVALS.slice(0, 9); // Regular shift (7:30-16:30)
        } else if (form.shiftType === ShiftType.EXTENDED) {
            return STANDARD_TIME_INTERVALS.slice(8, 11); // Extended shift (16:30-18:00)
        } else {
            return STANDARD_TIME_INTERVALS.slice(10, 13); // Overtime shift (18:00-20:00)
        }
    };

    const timeIntervals = getTimeIntervals();

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="container mx-auto py-8">
                <h1 className="text-2xl font-bold">Không tìm thấy phiếu công đoạn</h1>
                <Button onClick={handleBack} className="mt-4 flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Quay lại
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-4">
            <div className="print-controls flex justify-between items-center mb-4 print:hidden">
                <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Quay lại
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} className="flex items-center gap-2">
                        <Printer size={16} />
                        In
                    </Button>
                    <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
                        <Download size={16} />
                        Xuất PDF
                    </Button>
                </div>
            </div>

            <div id="printable-form" className="bg-white p-8 rounded-lg shadow-sm print:shadow-none">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">PHIẾU THEO DÕI CÔNG ĐOẠN</h1>
                    <p className="text-lg mt-1 font-semibold">Mã phiếu: {form.formCode}</p>
                    <p className="mt-4">
                        Ngày {format(new Date(form.date), 'dd')} tháng {format(new Date(form.date), 'MM')} năm {format(new Date(form.date), 'yyyy')}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-8 mb-8">
                    <div>
                        <p className="font-bold">HỌ TÊN: ___________________</p>
                        <p className="font-bold mt-2">MÃ SỐ THẺ: ____________</p>
                    </div>
                    <div>
                        <p className="font-bold">ĐƠN VỊ: ___________________</p>
                        <p className="font-bold mt-2">TỔ/BAN LV: _____________</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">NHÓM TRƯỞNG KÝ TÊN: _____________</p>
                        <p className="font-bold mt-2">CHUYỀN TRƯỞNG KÝ TÊN: ___________</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-center">STT</th>
                                <th className="border border-gray-300 p-2 text-center">MÃ TÚI</th>
                                <th className="border border-gray-300 p-2 text-center">MÃ C.ĐOẠN</th>
                                <th className="border border-gray-300 p-2 text-center">TÊN C.ĐOẠN SẢN XUẤT</th>
                                <th className="border border-gray-300 p-2 text-center">CHỈ TIÊU GIỜ</th>
                                <th className="border border-gray-300 p-2 text-center">G.GIÁ</th>
                                {timeIntervals.map((interval) => (
                                    <th key={interval.label} className="border border-gray-300 p-2 text-center">
                                        {interval.label}
                                    </th>
                                ))}
                                <th className="border border-gray-300 p-2 text-center">TỔNG CỘNG</th>
                                <th className="border border-gray-300 p-2 text-center">NGUYÊN NHÂN + / -</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, index) => (
                                <tr key={entry.id}>
                                    <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                                    <td className="border border-gray-300 p-2 text-center">
                                        {/* Placeholder values - actual data would come from your API */}
                                        {`Túi ${entry.handBagId.substring(0, 4)}`}
                                    </td>
                                    <td className="border border-gray-300 p-2 text-center">
                                        {`CĐ-${entry.processId.substring(0, 4)}`}
                                    </td>
                                    <td className="border border-gray-300 p-2 text-center">
                                        {`Công đoạn ${entry.processId.substring(0, 4)}`}
                                    </td>
                                    <td className="border border-gray-300 p-2 text-center">
                                        {/* Target per hour - placeholder value */}
                                        10
                                    </td>
                                    <td className="border border-gray-300 p-2 text-center">
                                        {/* Evaluation value */}
                                    </td>
                                    {timeIntervals.map((interval) => (
                                        <td key={interval.label} className="border border-gray-300 p-2 text-center">
                                            {entry.hourlyData[interval.label] || 0}
                                        </td>
                                    ))}
                                    <td className="border border-gray-300 p-2 text-center font-bold">
                                        {entry.totalOutput}
                                    </td>
                                    <td className="border border-gray-300 p-2 text-center">
                                        {entry.issues && entry.issues.length > 0
                                            ? entry.issues.map(issue => issue.type).join(', ')
                                            : ''}
                                    </td>
                                </tr>
                            ))}

                            {/* Summary row */}
                            <tr className="bg-gray-50">
                                <td className="border border-gray-300 p-2 text-center font-bold" colSpan={6}>
                                    TỔNG CỘNG
                                </td>
                                {timeIntervals.map((interval) => {
                                    const hourTotal = entries.reduce((sum, entry) => {
                                        return sum + (entry.hourlyData[interval.label] || 0);
                                    }, 0);
                                    return (
                                        <td key={interval.label} className="border border-gray-300 p-2 text-center font-bold">
                                            {hourTotal}
                                        </td>
                                    );
                                })}
                                <td className="border border-gray-300 p-2 text-center font-bold">
                                    {entries.reduce((sum, entry) => sum + entry.totalOutput, 0)}
                                </td>
                                <td className="border border-gray-300 p-2"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-3 gap-8 mt-12">
                    <div className="text-center">
                        <p className="font-bold">NGƯỜI LẬP PHIẾU</p>
                        <p>(Ký, ghi rõ họ tên)</p>
                        <div className="h-20"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold">TRƯỞNG BỘ PHẬN</p>
                        <p>(Ký, ghi rõ họ tên)</p>
                        <div className="h-20"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold">NGƯỜI THỰC HIỆN</p>
                        <p>(Ký, ghi rõ họ tên)</p>
                        <div className="h-20"></div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          .print-controls {
            display: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          @page {
            size: landscape;
            margin: 10mm;
          }
        }
      `}</style>
        </div>
    );
};

export default DigitalFormPrint;