// screens/digital-form/EditForm.tsx
"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft } from "lucide-react"
import { RecordStatus } from "@/common/types/digital-form"
import useDigitalFormManager from "@/hooks/digital-form/useDigitalFormManager"
import { useDigitalFormQueries } from "@/hooks/digital-form"
import { useToast } from "@/hooks/use-toast"
import { TDigitalFormUpdate } from "@/schemas/digital-form.schema"

// Schema for form validation
const formSchema = z.object({
    formName: z.string().min(3, "Tên biểu mẫu phải có ít nhất 3 ký tự").max(100),
    description: z.string().optional(),
});

export default function EditDigitalForm() {
    const router = useRouter()
    const params = useParams()
    const formId = typeof params?.formId === 'string' ? params.formId : ''

    const { toast } = useToast()
    const formManager = useDigitalFormManager()
    const { getFormById } = useDigitalFormQueries()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Get form data
    const { data: formData, isLoading: isLoadingForm, isError } = getFormById(formId, {
        enabled: !!formId
    })

    // Initialize form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            formName: "",
            description: "",
        },
    })

    // Update form when data is loaded
    useEffect(() => {
        if (formData && !isLoadingForm) {
            form.reset({
                formName: formData.formName || "",
                description: formData.description || "",
            })
            setIsLoading(false)
        }
    }, [formData, isLoadingForm, form])

    // Check if form can be edited
    const canEdit = formData && formData.status === RecordStatus.DRAFT

    // Handle form submission
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!formId || !canEdit) return

        setIsSubmitting(true)
        try {
            const formData: TDigitalFormUpdate = {
                ...data,
            }

            // Update the form
            const success = await formManager.crudHandlers.handleUpdateForm(formId, formData)

            if (success) {
                toast({
                    title: "Thành công",
                    description: "Đã cập nhật biểu mẫu thành công",
                })
                // Navigate back to the form detail
                router.push(`/digital-forms/${formId}`)
            } else {
                throw new Error("Không thể cập nhật biểu mẫu")
            }
        } catch (error) {
            console.error("Error updating form:", error)
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật biểu mẫu",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle back button
    const handleBack = () => {
        router.push(`/digital-forms/${formId}`)
    }

    // Helper function to format date
    const formatDisplayDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy', { locale: vi })
        } catch (error) {
            return 'Không hợp lệ'
        }
    }

    // Get status badge
    const getStatusBadge = (status: RecordStatus) => {
        switch (status) {
            case RecordStatus.DRAFT:
                return <Badge variant="outline" className="bg-gray-100">Nháp</Badge>
            case RecordStatus.PENDING:
                return <Badge variant="outline" className="bg-amber-100 text-amber-700">Chờ duyệt</Badge>
            case RecordStatus.CONFIRMED:
                return <Badge variant="outline" className="bg-green-100 text-green-700">Đã duyệt</Badge>
            case RecordStatus.REJECTED:
                return <Badge variant="outline" className="bg-red-100 text-red-700">Từ chối</Badge>
            default:
                return null
        }
    }

    if (isLoading || isLoadingForm) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Đang tải dữ liệu...</p>
            </div>
        )
    }

    if (isError || !formData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <p className="text-red-500 mb-4">Không thể tải dữ liệu biểu mẫu</p>
                <Button onClick={handleBack}>Quay lại</Button>
            </div>
        )
    }

    if (!canEdit) {
        return (
            <main className="container max-w-2xl mx-auto p-4 pb-24">
                <div className="mb-4">
                    <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Không thể chỉnh sửa biểu mẫu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">Biểu mẫu này không ở trạng thái Nháp nên không thể chỉnh sửa.</p>
                        <p>Trạng thái hiện tại: {getStatusBadge(formData.status)}</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleBack}>Quay lại</Button>
                    </CardFooter>
                </Card>
            </main>
        )
    }

    return (
        <main className="container max-w-2xl mx-auto p-4 pb-24">
            <div className="mb-4">
                <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Chỉnh sửa biểu mẫu số</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Mã biểu mẫu</p>
                            <p className="font-medium">{formData.formCode}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Ngày</p>
                            <p className="font-medium">{formatDisplayDate(formData.date)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Nhà máy</p>
                            <p className="font-medium">{formData.factoryName || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Dây chuyền</p>
                            <p className="font-medium">{formData.lineName || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tổ</p>
                            <p className="font-medium">{formData.teamName || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Nhóm</p>
                            <p className="font-medium">{formData.groupName || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Trạng thái</p>
                            <div>{getStatusBadge(formData.status)}</div>
                        </div>
                    </div>

                    <Separator className="mb-6" />

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="formName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên biểu mẫu</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mô tả (tùy chọn)</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <CardFooter className="flex justify-end px-0 pb-0 pt-6">
                                <Button type="button" variant="outline" className="mr-2" onClick={handleBack}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang cập nhật...
                                        </>
                                    ) : (
                                        "Lưu thay đổi"
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
    )
}