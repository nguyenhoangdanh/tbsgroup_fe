"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import UnifiedFormField from "@/components/common/Form/custom/UnifiedFormField";

// Define the form schema with Zod
const formSchema = z.object({
    // Text input fields
    fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    phoneNumber: z.string().regex(/^[0-9]{10}$/, "Số điện thoại phải có 10 chữ số"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    aboutMe: z.string().optional(),

    // Select/Combobox fields
    gender: z.string().min(1, "Vui lòng chọn giới tính"),
    role: z.string().min(1, "Vui lòng chọn vai trò"),
    department: z.string().min(1, "Vui lòng chọn phòng ban"),

    // Boolean fields
    agreeTerms: z.boolean().refine(val => val === true, {
        message: "Bạn phải đồng ý với điều khoản sử dụng"
    }),
    receiveNotifications: z.boolean().optional(),

    // Radio field
    contactMethod: z.string().min(1, "Vui lòng chọn phương thức liên hệ"),

    // Date & Time fields
    birthDate: z.date().optional(),
    appointmentDate: z.date().optional(),
    availableFrom: z.string().optional(),
    workingHours: z.object({
        startTime: z.date(),
        endTime: z.date()
    }).optional(),
    vacationPeriod: z.object({
        startDateTime: z.date(),
        endDateTime: z.date()
    }).optional(),

    // Color field
    accentColor: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

const FormTestPage = () => {
    const [formData, setFormData] = useState<FormValues | null>(null);
    const [activeTab, setActiveTab] = useState("basic-info");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form with React Hook Form
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            fullName: "",
            email: "",
            phoneNumber: "",
            password: "",
            aboutMe: "",
            gender: "",
            role: "",
            department: "",
            agreeTerms: false,
            receiveNotifications: false,
            contactMethod: "",
            birthDate: undefined,
            appointmentDate: undefined,
            availableFrom: "",
            workingHours: undefined,
            vacationPeriod: undefined,
            accentColor: ""
        }
    });

    // Handle form submission
    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Clear previous errors
            setFormErrors({});

            // Set form data
            setFormData(data);

            // Show success message
            alert("Đã gửi form thành công!");
        } catch (error) {
            console.error("Error submitting form:", error);

            // Example of how to handle server-side errors
            setFormErrors({
                email: "Email đã tồn tại trong hệ thống"
            });

            // Move to the tab containing the error
            if (formErrors.email) {
                setActiveTab("basic-info");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Options for select/combobox/radio fields
    const genderOptions = [
        { value: "male", label: "Nam" },
        { value: "female", label: "Nữ" },
        { value: "other", label: "Khác" }
    ];

    const roleOptions = [
        { value: "user", label: "Người dùng" },
        { value: "admin", label: "Quản trị viên" },
        { value: "moderator", label: "Điều phối viên" },
        { value: "editor", label: "Biên tập viên" },
        { value: "viewer", label: "Người xem" }
    ];

    const departmentOptions = [
        { value: "it", label: "Công nghệ thông tin" },
        { value: "hr", label: "Nhân sự" },
        { value: "finance", label: "Tài chính" },
        { value: "marketing", label: "Marketing" },
        { value: "sales", label: "Kinh doanh" },
        { value: "operations", label: "Vận hành" },
        { value: "customerservice", label: "Chăm sóc khách hàng" },
        { value: "rd", label: "Nghiên cứu và phát triển" }
    ];

    const contactMethodOptions = [
        { value: "email", label: "Email" },
        { value: "phone", label: "Điện thoại" },
        { value: "sms", label: "Tin nhắn SMS" },
        { value: "app", label: "Thông báo ứng dụng" }
    ];

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-8 text-center">Form Field Test Page</h1>

            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Form Test</CardTitle>
                            <CardDescription>Kiểm tra tất cả các loại trường form</CardDescription>
                        </CardHeader>

                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <div className="px-6">
                                <TabsList className="w-full">
                                    <TabsTrigger value="basic-info" className="flex-1">
                                        Thông tin cơ bản
                                    </TabsTrigger>
                                    <TabsTrigger value="advanced-info" className="flex-1">
                                        Thông tin nâng cao
                                    </TabsTrigger>
                                    <TabsTrigger value="dates-times" className="flex-1">
                                        Ngày & Giờ
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <CardContent className="pt-6">
                                <TabsContent value="basic-info" className="space-y-6">
                                    <UnifiedFormField
                                        name="fullName"
                                        label="Họ và tên"
                                        control={methods.control}
                                        type="text"
                                        placeholder="Nhập họ và tên"
                                        required
                                    />

                                    <UnifiedFormField
                                        name="email"
                                        label="Email"
                                        control={methods.control}
                                        type="email"
                                        placeholder="your.email@example.com"
                                        required
                                        autoComplete="email"
                                        description="Email sẽ được sử dụng để đăng nhập và nhận thông báo"
                                    />

                                    <UnifiedFormField
                                        name="phoneNumber"
                                        label="Số điện thoại"
                                        control={methods.control}
                                        type="text"
                                        placeholder="0987654321"
                                        required
                                        autoComplete="tel"
                                    />

                                    <UnifiedFormField
                                        name="password"
                                        label="Mật khẩu"
                                        control={methods.control}
                                        type="password"
                                        placeholder="********"
                                        required
                                        description="Mật khẩu phải có ít nhất 8 ký tự"
                                    />

                                    <UnifiedFormField
                                        name="aboutMe"
                                        label="Giới thiệu"
                                        control={methods.control}
                                        type="textarea"
                                        placeholder="Viết vài dòng về bản thân..."
                                        rows={4}
                                        description="Thông tin này sẽ hiển thị trên trang cá nhân của bạn"
                                    />
                                </TabsContent>

                                <TabsContent value="advanced-info" className="space-y-6">
                                    <UnifiedFormField
                                        name="gender"
                                        label="Giới tính"
                                        control={methods.control}
                                        type="select"
                                        placeholder="Chọn giới tính"
                                        options={genderOptions}
                                        required
                                    />

                                    <UnifiedFormField
                                        name="role"
                                        label="Vai trò"
                                        control={methods.control}
                                        type="select"
                                        placeholder="Chọn vai trò"
                                        options={roleOptions}
                                        required
                                    />

                                    <UnifiedFormField
                                        name="department"
                                        label="Phòng ban"
                                        control={methods.control}
                                        type="combobox"
                                        placeholder="Chọn phòng ban"
                                        options={departmentOptions}
                                        searchPlaceholder="Tìm phòng ban..."
                                        required
                                        description="Sử dụng combobox cho danh sách lớn có tính năng tìm kiếm"
                                    />

                                    <UnifiedFormField
                                        name="contactMethod"
                                        label="Phương thức liên hệ ưa thích"
                                        control={methods.control}
                                        type="radio"
                                        options={contactMethodOptions}
                                        orientation="horizontal"
                                        required
                                    />

                                    <div className="space-y-4">
                                        <UnifiedFormField
                                            name="agreeTerms"
                                            label="Tôi đồng ý với điều khoản và điều kiện"
                                            control={methods.control}
                                            type="checkbox"
                                            required
                                        />

                                        <UnifiedFormField
                                            name="receiveNotifications"
                                            label="Nhận thông báo về sản phẩm và dịch vụ mới"
                                            control={methods.control}
                                            type="checkbox"
                                            description="Bạn có thể hủy đăng ký bất kỳ lúc nào"
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="dates-times" className="space-y-6">
                                    <UnifiedFormField
                                        name="birthDate"
                                        label="Ngày sinh"
                                        control={methods.control}
                                        type="date"
                                        placeholder="Chọn ngày sinh"
                                        maxDate={new Date()}
                                    />

                                    <UnifiedFormField
                                        name="appointmentDate"
                                        label="Ngày và giờ cuộc hẹn"
                                        control={methods.control}
                                        type="datetime"
                                        placeholder="Chọn ngày và giờ cuộc hẹn"
                                        minDate={new Date()}
                                    />

                                    <UnifiedFormField
                                        name="availableFrom"
                                        label="Giờ làm việc"
                                        control={methods.control}
                                        type="time"
                                        placeholder="Chọn giờ bắt đầu làm việc"
                                    />

                                    <UnifiedFormField
                                        name="workingHours"
                                        label="Khung giờ làm việc"
                                        control={methods.control}
                                        type="time-range"
                                        placeholder="Chọn khung giờ làm việc"
                                        allowSameTime={false}
                                        description="Thời gian bắt đầu và kết thúc ca làm việc"
                                    />

                                    <UnifiedFormField
                                        name="vacationPeriod"
                                        label="Kỳ nghỉ phép"
                                        control={methods.control}
                                        type="date-range"
                                        placeholder="Chọn thời gian nghỉ phép"
                                        minDate={new Date()}
                                        allowSameDateTime={false}
                                    />

                                    <UnifiedFormField
                                        name="accentColor"
                                        label="Màu sắc yêu thích"
                                        control={methods.control}
                                        type="color"
                                        description="Chọn màu sắc thể hiện cá tính của bạn"
                                    />
                                </TabsContent>
                            </CardContent>

                            <CardFooter className="flex justify-between border-t pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => methods.reset()}
                                    disabled={isSubmitting}
                                >
                                    Đặt lại
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Đang xử lý..." : "Hoàn thành"}
                                </Button>
                            </CardFooter>
                        </Tabs>
                    </Card>
                </form>
            </FormProvider>

            {formData && (
                <Card className="mt-10">
                    <CardHeader>
                        <CardTitle>Dữ liệu form đã gửi</CardTitle>
                        <CardDescription>Dữ liệu này sẽ được gửi đến server</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px] rounded-md border p-4">
                            <pre className="text-sm">
                                {JSON.stringify(formData, (key, value) => {
                                    // Format date objects for better readability
                                    if (value instanceof Date) {
                                        return value.toISOString();
                                    }
                                    return value;
                                }, 2)}
                            </pre>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            <div className="mt-10">
                <h2 className="text-xl font-semibold mb-4">Performance Optimization Tips</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Sử dụng <code>memo</code> để tối ưu việc render lại các component con (đã thực hiện trong các field components)</li>
                    <li>Sử dụng <code>FormProvider</code> để truyền context form xuống component con mà không cần prop drilling</li>
                    <li>Thiết lập <code>mode: "onChange"</code> trong useForm để validate khi người dùng thay đổi giá trị</li>
                    <li>Phân chia form thành nhiều tab để tránh render quá nhiều field cùng lúc</li>
                    <li>Sử dụng <code>React.lazy</code> để tải các component phức tạp theo nhu cầu</li>
                    <li>Sử dụng hooks như <code>useCallback</code> và <code>useMemo</code> để tối ưu các hàm và giá trị được tính toán</li>
                </ul>
            </div>
        </div>
    );
};

export default FormTestPage;