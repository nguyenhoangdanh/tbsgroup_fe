"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useDigitalForms } from "@/hooks/digital-form/useDigitalForms"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { RecordStatus, ShiftType, AttendanceStatus } from "@/common/types/digital-form"

// Các ánh xạ nhãn
const STATUS_LABELS: Record<RecordStatus, string> = {
    [RecordStatus.DRAFT]: "Nháp",
    [RecordStatus.PENDING]: "Chờ duyệt",
    [RecordStatus.CONFIRMED]: "Đã duyệt",
    [RecordStatus.REJECTED]: "Bị từ chối",
}

const SHIFT_LABELS: Record<ShiftType, string> = {
    [ShiftType.REGULAR]: "Ca Chính (7h30-16h30)",
    [ShiftType.EXTENDED]: "Ca Kéo Dài (16h30-18h)",
    [ShiftType.OVERTIME]: "Ca Tăng Ca (18h-20h)",
}

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: "Có mặt",
    [AttendanceStatus.ABSENT]: "Vắng mặt",
    [AttendanceStatus.LATE]: "Đi muộn",
    [AttendanceStatus.EARLY_LEAVE]: "Về sớm",
    [AttendanceStatus.LEAVE_APPROVED]: "Nghỉ phép",
}

export default function DigitalFormPrintPage() {
    const params = useParams()
    const id = params?.id as string
    const [isPrinting, setIsPrinting] = useState(false)

    const { getFormPrintVersion } = useDigitalForms()
    const { data, isLoading, error } = getFormPrintVersion(id)

    const form = data?.data?.form
    const entries = data?.data?.entries || []

    // Tự động in khi dữ liệu đã tải xong
    useEffect(() => {
        if (form && entries.length > 0 && !isLoading && !isPrinting) {
            setIsPrinting(true)
            // Đợi một chút để đảm bảo trang đã render
            const timer = setTimeout(() => {
                window.print()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [form, entries, isLoading, isPrinting])

    if (isLoading)
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        )
    if (error) return <div className="py-8 text-center">Lỗi: {error.message}</div>
    if (!form) return <div className="py-8 text-center">Không tìm thấy phiếu công đoạn</div>

    return (
        <div className="container mx-auto py-8 print:py-2">
            <div className="print:hidden mb-4 flex justify-end">
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                    In phiếu
                </button>
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">PHIẾU CÔNG ĐOẠN</h1>
                <p className="text-lg">{form.formName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <p>
                        <strong>Mã phiếu:</strong> {form.formCode}
                    </p>
                    <p>
                        <strong>Ngày:</strong> {format(new Date(form.date), "dd/MM/yyyy")}
                    </p>
                    <p>
                        <strong>Ca làm việc:</strong> {SHIFT_LABELS[form.shiftType]}
                    </p>
                </div>
                <div>
                    <p>
                        <strong>Trạng thái:</strong> {STATUS_LABELS[form.status]}
                    </p>
                    <p>
                        <strong>Người tạo:</strong> {form.createdById}
                    </p>
                    <p>
                        <strong>Ngày tạo:</strong> {format(new Date(form.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                </div>
            </div>

            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2">STT</th>
                        <th className="border border-gray-300 p-2">Công nhân</th>
                        <th className="border border-gray-300 p-2">Túi xách</th>
                        <th className="border border-gray-300 p-2">Màu</th>
                        <th className="border border-gray-300 p-2">Công đoạn</th>
                        <th className="border border-gray-300 p-2">Trạng thái</th>
                        <th className="border border-gray-300 p-2">Tổng SL</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry, index) => (
                        <tr key={entry.id}>
                            <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                            <td className="border border-gray-300 p-2">
                                {entry.worker?.fullName || `Công nhân ${entry.userId.substring(0, 4)}`}
                            </td>
                            <td className="border border-gray-300 p-2">
                                {entry.handBag?.name || `Túi ${entry.handBagId.substring(0, 4)}`}
                            </td>
                            <td className="border border-gray-300 p-2">
                                {entry.bagColor?.colorName || `Màu ${entry.bagColorId.substring(0, 4)}`}
                            </td>
                            <td className="border border-gray-300 p-2">
                                {entry.process?.name || `Công đoạn ${entry.processId.substring(0, 4)}`}
                            </td>
                            <td className="border border-gray-300 p-2">{ATTENDANCE_LABELS[entry.attendanceStatus]}</td>
                            <td className="border border-gray-300 p-2 text-center">{entry.totalOutput}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="grid grid-cols-3 gap-4 mt-8 print:mt-16">
                <div className="text-center">
                    <p className="font-bold">Người lập phiếu</p>
                    <p className="italic">(Ký, ghi rõ họ tên)</p>
                </div>
                <div className="text-center">
                    <p className="font-bold">Trưởng bộ phận</p>
                    <p className="italic">(Ký, ghi rõ họ tên)</p>
                </div>
                <div className="text-center">
                    <p className="font-bold">Giám đốc</p>
                    <p className="italic">(Ký, ghi rõ họ tên)</p>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            font-size: 12pt;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:py-2 {
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
          }
          .print\\:mt-16 {
            margin-top: 4rem;
          }
        }
      `}</style>
        </div>
    )
}
