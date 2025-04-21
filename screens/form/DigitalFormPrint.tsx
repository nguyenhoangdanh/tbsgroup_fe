import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Spin,
    Typography,
    Table,
    Descriptions,
    Card,
    Button,
    message,
    Divider
} from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { DigitalFormService } from '@/services/digitalFormService';
import { DigitalForm, DigitalFormEntry, ShiftType, STANDARD_TIME_INTERVALS } from '@/types/digitalForm';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const { Title, Text } = Typography;

const shiftLabels = {
    REGULAR: 'Ca Chính (7:30-16:30)',
    EXTENDED: 'Ca Kéo Dài (16:30-18:00)',
    OVERTIME: 'Ca Tăng Ca (18:00-20:00)',
};

const statusLabels = {
    DRAFT: 'Bản nháp',
    PENDING: 'Chờ duyệt',
    CONFIRMED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
};

const DigitalFormPrint: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<DigitalForm | null>(null);
    const [entries, setEntries] = useState<DigitalFormEntry[]>([]);
    const [printLoading, setPrintLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchFormData();
        }
    }, [id]);

    // Auto-print when loaded
    useEffect(() => {
        if (form && entries.length > 0 && !loading) {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [form, entries, loading]);

    const fetchFormData = async () => {
        try {
            setLoading(true);
            const response = await DigitalFormService.getFormWithEntries(id as string);

            if (response.success) {
                setForm(response.data.form);
                setEntries(response.data.entries);
            } else {
                message.error('Failed to fetch form data');
            }
        } catch (error) {
            console.error('Error fetching form data:', error);
            message.error('An error occurred while fetching form data');
        } finally {
            setLoading(false);
        }
    };

    const getTimeIntervals = () => {
        if (!form) return [];

        if (form.shiftType === 'REGULAR') {
            return STANDARD_TIME_INTERVALS.slice(0, 9); // Regular shift (7:30-16:30)
        } else if (form.shiftType === 'EXTENDED') {
            return STANDARD_TIME_INTERVALS.slice(8, 11); // Extended shift (16:30-18:00)
        } else {
            return STANDARD_TIME_INTERVALS.slice(10, 13); // Overtime shift (18:00-20:00)
        }
    };

    const timeIntervals = getTimeIntervals();

    const exportToPdf = async () => {
        try {
            setPrintLoading(true);
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
            pdf.save(`${form?.formCode || 'form'}.pdf`);

            message.success('PDF exported successfully');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            message.error('Failed to export PDF');
        } finally {
            setPrintLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!form) {
        return (
            <div style={{ padding: 24 }}>
                <Title level={4}>Form not found</Title>
                <Button onClick={() => router.back()}>Go back</Button>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: '100%' }}>
            <div className="print-controls" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => router.back()}>Go back</Button>
                <div>
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={() => window.print()}
                        style={{ marginRight: 8 }}
                    >
                        Print
                    </Button>
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={exportToPdf}
                        loading={printLoading}
                    >
                        Export PDF
                    </Button>
                </div>
            </div>

            <div id="printable-form" style={{ padding: 20, background: '#fff' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Title level={2} style={{ marginBottom: 0 }}>PHIẾU THEO DÕI CÔNG ĐOẠN - GIAO CHỈ TIÊU CÁ NHÂN</Title>
                    <Text strong>MS: {form.formCode}</Text>
                    <div style={{ marginTop: 10 }}>
                        <Text>BD, ngày {format(new Date(form.date), 'dd')} tháng {format(new Date(form.date), 'MM')} năm {format(new Date(form.date), 'yyyy')}</Text>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ width: '30%' }}>
                        <Text strong>HỌ TÊN: </Text>
                        <br />
                        <Text strong>MÃ SỐ THẺ: </Text>
                    </div>
                    <div style={{ width: '30%' }}>
                        <Text strong>ĐƠN VỊ: </Text>
                        <br />
                        <Text strong>TỔ/BAN LV: </Text>
                    </div>
                    <div style={{ width: '30%', textAlign: 'right' }}>
                        <Text strong>NHÓM TRƯỞNG KÝ TÊN: </Text>
                        <br />
                        <Text strong>CHUYỀN TRƯỞNG KÝ TÊN: </Text>
                    </div>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                <div className="form-table-container">
                    <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>STT</th>
                                <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>MÃ TÚI</th>
                                <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>MÃ C.ĐOẠN</th>
                                <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>TÊN C.ĐOẠN SẢN XUẤT</th>
                                <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>CHỈ TIÊU GIỜ</th>
                                <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>G.GIÁ</th>
                                {timeIntervals.map((interval) => (
                                    <th key={interval.label} style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>
                                        {interval.label}
                                    </th>
                                ))}
                                <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>TỔNG CỘNG</th>
                                <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>NGUYÊN NHÂN + / -</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, index) => (
                                <tr key={entry.id}>
                                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>{index + 1}</td>
                                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>
                                        {/* This would be filled with actual data from your API */}
                                        {`Bag ${entry.handBagId.substring(0, 4)}`}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>
                                        {/* This would be filled with actual data from your API */}
                                        {`Process ${entry.processId.substring(0, 4)}`}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>
                                        {/* This would be filled with actual data from your API */}
                                        {`Process Name ${entry.processId.substring(0, 4)}`}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>
                                        {/* This would be the target output per hour */}
                                        10
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>
                                        {/* This would be the evaluation value */}
                                    </td>
                                    {timeIntervals.map((interval) => (
                                        <td key={interval.label} style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>
                                            {entry.hourlyData[interval.label] || 0}
                                        </td>
                                    ))}
                                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center', fontWeight: 'bold' }}>
                                        {entry.totalOutput}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>
                                        {/* This would display issues */}
                                        {entry.issues && entry.issues.length > 0 ? entry.issues.map(issue => issue.type).join(', ') : ''}
                                    </td>
                                </tr>
                            ))}

                            {/* Summary row */}
                            <tr>
                                <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center', fontWeight: 'bold' }} colSpan={6}>
                                    TỔNG CỘNG
                                </td>
                                {timeIntervals.map((interval) => {
                                    const hourTotal = entries.reduce((sum, entry) => {
                                        return sum + (entry.hourlyData[interval.label] || 0);
                                    }, 0);
                                    return (
                                        <td key={interval.label} style={{ border: '1px solid #000', padding: 8, textAlign: 'center', fontWeight: 'bold' }}>
                                            {hourTotal}
                                        </td>
                                    );
                                })}
                                <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center', fontWeight: 'bold' }}>
                                    {entries.reduce((sum, entry) => sum + entry.totalOutput, 0)}
                                </td>
                                <td style={{ border: '1px solid #000', padding: 8 }}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '30%', textAlign: 'center' }}>
                        <Text strong>NGƯỜI LẬP PHIẾU</Text>
                        <br />
                        <Text>(Ký, ghi rõ họ tên)</Text>
                        <div style={{ height: 80 }}></div>
                    </div>
                    <div style={{ width: '30%', textAlign: 'center' }}>
                        <Text strong>TRƯỞNG BỘ PHẬN</Text>
                        <br />
                        <Text>(Ký, ghi rõ họ tên)</Text>
                        <div style={{ height: 80 }}></div>
                    </div>
                    <div style={{ width: '30%', textAlign: 'center' }}>
                        <Text strong>NGƯỜI THỰC HIỆN</Text>
                        <br />
                        <Text>(Ký, ghi rõ họ tên)</Text>
                        <div style={{ height: 80 }}></div>
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