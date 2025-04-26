"use client"
import React, { useState, useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogTitle, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AttendanceStatus, ShiftType, STANDARD_TIME_INTERVALS } from "@/common/types/digital-form"
import { digitalFormEntrySchema, type TDigitalFormEntry } from "@/schemas/digital-form.schema"
import { useHandBagContext } from "@/hooks/handbag/HandBagContext"
import { useBagProcess } from "@/hooks/handbag/bag-process/BagProcessContext"
import { toast } from "@/hooks/use-toast"

const useWorkers = () => ({
    data: [
        { id: "worker1", fullName: "Nguyễn Văn A", employeeId: "NV001" },
        { id: "worker2", fullName: "Trần Thị B", employeeId: "NV002" },
    ],
    isLoading: false,
})

const useHandBagsData = () => {
    const { listHandBags } = useHandBagContext()
    const result = listHandBags({ limit: 100, page: 1 })
    return { data: result.data?.data || [], isLoading: result.isLoading }
}

const useHandBagColors = (handBagId: string) => {
    const { getHandBagColors } = useHandBagContext()
    const result = getHandBagColors(handBagId, { enabled: !!handBagId })
    return { data: result.data || { data: [] }, isLoading: result.isLoading }
}

const useProcesses = () => {
    const { bagProcesses, isLoading } = useBagProcess()
    return { data: bagProcesses || [], isLoading }
}

interface FormEntryModalProps {
    visible: boolean
    onCancel: () => void
    onSave: (data: TDigitalFormEntry) => Promise<boolean>
    entry?: any
    formId: string
    shiftType: ShiftType
}

const FormEntryModal: React.FC<FormEntryModalProps> = React.memo(
    ({ visible, onCancel, onSave, entry, formId, shiftType }) => {
        const [activeTab, setActiveTab] = useState("basic")
        const [selectedHandBagId, setSelectedHandBagId] = useState<string | null>(null)

        const {
            control,
            handleSubmit,
            watch,
            setValue,
            reset,
            formState: { errors, isSubmitting },
        } = useForm<TDigitalFormEntry>({
            resolver: zodResolver(digitalFormEntrySchema),
            defaultValues: {
                userId: "",
                handBagId: "",
                bagColorId: "",
                processId: "",
                hourlyData: {},
                totalOutput: 0,
                attendanceStatus: AttendanceStatus.PRESENT,
                attendanceNote: "",
                issues: [],
                qualityScore: 100,
                qualityNotes: "",
            },
        })

        const { data: workers, isLoading: isLoadingWorkers } = useWorkers()
        const { data: handBags, isLoading: isLoadingHandBags } = useHandBagsData()
        const { data: processes, isLoading: isLoadingProcesses } = useProcesses()
        const { data: bagColorsData, isLoading: isLoadingColors } = useHandBagColors(selectedHandBagId || "")
        const bagColors = bagColorsData?.data || []

        const hourlyData = watch("hourlyData")
        const attendanceStatus = watch("attendanceStatus")

        useEffect(() => {
            const total = Object.values(hourlyData || {}).reduce((sum, value) => sum + (Number(value) || 0), 0)
            setValue("totalOutput", total)
        }, [hourlyData, setValue])

        useEffect(() => {
            if (visible && entry) {
                reset(entry)
                setSelectedHandBagId(entry.handBagId)
            } else if (visible) {
                reset()
                setSelectedHandBagId(null)
            }
        }, [visible, entry, reset])

        const timeIntervals = useMemo(() => {
            return shiftType === ShiftType.REGULAR
                ? STANDARD_TIME_INTERVALS.slice(0, 9)
                : shiftType === ShiftType.EXTENDED
                    ? STANDARD_TIME_INTERVALS.slice(8, 11)
                    : STANDARD_TIME_INTERVALS.slice(10, 13)
        }, [shiftType])

        const onSubmit = async (data: TDigitalFormEntry) => {
            if (data.attendanceStatus === AttendanceStatus.ABSENT) {
                const zeroedHourlyData = { ...data.hourlyData }
                timeIntervals.forEach((interval) => (zeroedHourlyData[interval.label] = 0))
                data.hourlyData = zeroedHourlyData
                data.totalOutput = 0
            }
            const success = await onSave(data)
            if (success) onCancel()
        }

        useEffect(() => {
            if (!isLoadingHandBags && (!handBags || handBags.length === 0)) {
                toast({
                    title: "Cảnh báo",
                    description: "Không có dữ liệu túi xách. Vui lòng thêm túi xách trước.",
                    variant: "destructive",
                })
            }

            if (!isLoadingProcesses && (!processes || processes.length === 0)) {
                toast({
                    title: "Cảnh báo",
                    description: "Không có dữ liệu công đoạn. Vui lòng thêm công đoạn trước.",
                    variant: "destructive",
                })
            }
        }, [isLoadingHandBags, handBags, isLoadingProcesses, processes, toast])

        return (
            <Dialog open={visible} onOpenChange={onCancel}>
                <DialogContent className="max-w-2xl">
                    <DialogTitle>{entry ? "Cập nhật dữ liệu" : "Thêm dữ liệu công nhân"}</DialogTitle>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="basic">Cơ bản</TabsTrigger>
                                <TabsTrigger value="production">Sản lượng</TabsTrigger>
                            </TabsList>
                            <TabsContent value="basic" className="space-y-4">
                                <Controller
                                    control={control}
                                    name="userId"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn công nhân" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {workers.map((w) => (
                                                    <SelectItem key={w.id} value={w.id}>
                                                        {w.fullName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <Controller
                                    control={control}
                                    name="attendanceStatus"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(AttendanceStatus).map((status) => (
                                                    <SelectItem key={status} value={status}>
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <Controller
                                    control={control}
                                    name="handBagId"
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={(v) => {
                                                field.onChange(v)
                                                setSelectedHandBagId(v)
                                                setValue("bagColorId", "")
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn túi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {handBags.map((bag) => (
                                                    <SelectItem key={bag.id} value={bag.id}>
                                                        {bag.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <Controller
                                    control={control}
                                    name="bagColorId"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange} disabled={!selectedHandBagId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn màu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bagColors.map((color) => (
                                                    <SelectItem key={color.id} value={color.id}>
                                                        {color.colorName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <Controller
                                    control={control}
                                    name="processId"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn công đoạn" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {processes.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </TabsContent>
                            <TabsContent value="production" className="space-y-4">
                                {timeIntervals.map((interval) => (
                                    <Controller
                                        key={interval.label}
                                        control={control}
                                        name={`hourlyData.${interval.label}`}
                                        render={({ field }) => (
                                            <Input
                                                type="number"
                                                placeholder={interval.label}
                                                value={field.value || 0}
                                                onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                                                disabled={attendanceStatus === AttendanceStatus.ABSENT}
                                            />
                                        )}
                                    />
                                ))}
                                <div>
                                    Tổng:{" "}
                                    <Controller control={control} name="totalOutput" render={({ field }) => <span>{field.value}</span>} />
                                </div>
                            </TabsContent>
                        </Tabs>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Đang lưu..." : "Lưu"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        )
    },
)

FormEntryModal.displayName = "FormEntryModal"
export default FormEntryModal
