"use client"

import type React from "react"
import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogTitle, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { digitalFormCreateSchema, type TDigitalFormCreate } from "@/schemas/digital-form.schema"
import { ShiftType } from "@/common/types/digital-form"
import { DatePicker } from "@/components/ui/date-picker"
import { useFactoryLines } from "@/hooks/line/LineContext"
import { toast } from "@/hooks/use-toast"

interface CreateFormModalProps {
    visible: boolean
    onCancel: () => void
    onCreate: (formData: TDigitalFormCreate) => Promise<boolean>
    defaultFactoryId?: string
}

const CreateFormModal: React.FC<CreateFormModalProps> = ({ visible, onCancel, onCreate, defaultFactoryId }) => {
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
    } = useForm<TDigitalFormCreate>({
        resolver: zodResolver(digitalFormCreateSchema),
        defaultValues: {
            formName: "",
            description: "",
            date: new Date().toISOString().split("T")[0],
            shiftType: ShiftType.REGULAR,
            lineId: "",
        },
    })

    const { lines, isLoading: isLoadingLines } = useFactoryLines(defaultFactoryId);

    useEffect(() => {
        if (visible && lines.length > 0 && !isLoadingLines) {
            setValue("lineId", lines[0].id) // Chọn line đầu tiên mặc định
        }
    }, [visible, lines, isLoadingLines, setValue])

    const onSubmit = async (data: TDigitalFormCreate) => {
        try {
            const success = await onCreate(data)
            if (success) {
                reset()
                toast({ title: "Thành công", description: "Đã tạo phiếu mới." })
            }
            return success
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể tạo phiếu.", variant: "destructive" })
            return false
        }
    }

    useEffect(() => {
        if (!visible) reset()
    }, [visible, reset])

    return (
        <Dialog open={visible} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-md">
                <DialogTitle>Tạo Phiếu Công Đoạn Mới123</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div>
                        <label htmlFor="formName" className="font-medium text-sm">
                            Tên phiếu
                        </label>
                        <Controller
                            control={control}
                            name="formName"
                            render={({ field }) => <Input {...field} placeholder="Nhập tên phiếu" />}
                        />
                        {errors.formName && <p className="text-sm text-red-500">{errors.formName.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="description" className="font-medium text-sm">
                            Mô tả
                        </label>
                        <Controller
                            control={control}
                            name="description"
                            render={({ field }) => <Textarea {...field} placeholder="Nhập mô tả (tùy chọn)" />}
                        />
                    </div>
                    <div>
                        <label htmlFor="date" className="font-medium text-sm">
                            Ngày
                        </label>
                        <Controller
                            control={control}
                            name="date"
                            render={({ field }) => (
                                <DatePicker
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={(date) => field.onChange(date?.toISOString().split("T")[0])}
                                />
                            )}
                        />
                        {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="shiftType" className="font-medium text-sm">
                            Ca làm việc
                        </label>
                        <Controller
                            control={control}
                            name="shiftType"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn ca" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ShiftType.REGULAR}>Ca Chính</SelectItem>
                                        <SelectItem value={ShiftType.EXTENDED}>Ca Kéo Dài</SelectItem>
                                        <SelectItem value={ShiftType.OVERTIME}>Ca Tăng Ca</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.shiftType && <p className="text-sm text-red-500">{errors.shiftType.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="lineId" className="font-medium text-sm">
                            Line sản xuất
                        </label>
                        <Controller
                            control={control}
                            name="lineId"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingLines}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn line" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lines.map((line) => (
                                            <SelectItem key={line.id} value={line.id}>
                                                {line.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.lineId && <p className="text-sm text-red-500">{errors.lineId.message}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Đang tạo..." : "Tạo"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

CreateFormModal.displayName = "CreateFormModal"

export default CreateFormModal
