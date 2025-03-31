"use client";

import React, { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import UnifiedFormField from "@/components/common/Form/custom/UnifiedFormField";

// Lazy-loaded components
const FormPreview = lazy(() => import("@/screens/FormPreview"));
const FormSuccess = lazy(() => import("@/screens/FormSuccess"));

// Define schema for each section separately for better code organization
const personalInfoSchema = z.object({
    fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    phoneNumber: z.string().regex(/^[0-9]{10}$/, "Số điện thoại phải có 10 chữ số"),
});

const accountInfoSchema = z.object({
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
});

const profileInfoSchema = z.object({
    department: z.string().min(1, "Vui lòng chọn phòng ban"),
    position: z.string().min(1, "Vui lòng chọn vị trí"),
    bio: z.string().optional(),
});

const preferenceSchema = z.object({
    contactMethod: z.string().min(1, "Vui lòng chọn phương thức liên hệ"),
    receiveNotifications: z.boolean().optional(),
    theme: z.string().optional(),
});

// Combine schemas
const formSchema = z.object({
    ...personalInfoSchema.shape,
    ...accountInfoSchema.shape,
    ...profileInfoSchema.shape,
    ...preferenceSchema.shape,
    // Additional field that applies to the entire form
    agreeTerms: z.boolean().refine(val => val === true, {
        message: "Bạn phải đồng ý với điều khoản sử dụng"
    }),
});

type FormValues = z.infer<typeof formSchema>;

// Section interface for organizing form tabs
interface FormSection {
    title: string;
    description: string;
    tabId: string;
    validator: (data: any) => boolean;
}

const OptimizedFormExample = () => {
    // React states
    const [activeTab, setActiveTab] = useState("personal");
    const [formData, setFormData] = useState<FormValues | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Initialize form with React Hook Form
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onBlur", // Validate on blur for better UX
        defaultValues: {
            fullName: "",
            email: "",
            phoneNumber: "",
            username: "",
            password: "",
            department: "",
            position: "",
            bio: "",
            contactMethod: "",
            receiveNotifications: false,
            theme: "",
            agreeTerms: false,
        }
    });

    const { control, formState, handleSubmit, trigger, watch, getValues } = methods;
    const { errors, isValid, dirtyFields, touchedFields } = formState;

    // Memoized values for options
    const departmentOptions = useMemo(() => [
        { value: "engineering", label: "Kỹ thuật" },
        { value: "product", label: "Sản phẩm" },
        { value: "marketing", label: "Marketing" },
        { value: "sales", label: "Kinh doanh" },
        { value: "hr", label: "Nhân sự" },
    ], []);

    const positionOptions = useMemo(() => [
        { value: "developer", label: "Lập trình viên" },
        { value: "designer", label: "Thiết kế UI/UX" },
        { value: "manager", label: "Quản lý dự án" },
        { value: "analyst", label: "Phân tích dữ liệu" },
        { value: "tester", label: "Kiểm thử phần mềm" },
    ], []);

    const contactMethodOptions = useMemo(() => [
        { value: "email", label: "Email" },
        { value: "phone", label: "Điện thoại" },
        { value: "sms", label: "Tin nhắn SMS" },
    ], []);

    const themeOptions = useMemo(() => [
        { value: "light", label: "Sáng" },
        { value: "dark", label: "Tối" },
        { value: "system", label: "Theo hệ thống" },
    ], []);

    // Section definitions with validation logic
    const sections = useMemo<FormSection[]>(() => [
        {
            title: "Thông tin cá nhân",
            description: "Nhập thông tin cá nhân của bạn",
            tabId: "personal",
            validator: (data) => {
                try {
                    personalInfoSchema.parse({
                        fullName: data.fullName,
                        email: data.email,
                        phoneNumber: data.phoneNumber,
                    });
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            title: "Thông tin tài khoản",
            description: "Thiết lập tài khoản đăng nhập",
            tabId: "account",
            validator: (data) => {
                try {
                    accountInfoSchema.parse({
                        username: data.username,
                        password: data.password,
                    });
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            title: "Hồ sơ",
            description: "Hoàn thiện hồ sơ của bạn",
            tabId: "profile",
            validator: (data) => {
                try {
                    profileInfoSchema.parse({
                        department: data.department,
                        position: data.position,
                        bio: data.bio,
                    });
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            title: "Tùy chọn",
            description: "Thiết lập tùy chọn cá nhân",
            tabId: "preferences",
            validator: (data) => {
                try {
                    preferenceSchema.parse({
                        contactMethod: data.contactMethod,
                        receiveNotifications: data.receiveNotifications,
                        theme: data.theme,
                    });
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
    ], []);

    // Validate section when switching tabs
    const handleTabChange = useCallback(async (tabId: string) => {
        // Find the current tab index and validate if moving forward
        const currentTabIndex = sections.findIndex(section => section.tabId === activeTab);
        const newTabIndex = sections.findIndex(section => section.tabId === tabId);

        if (newTabIndex > currentTabIndex) {
            // Only validate the current section
            const currentSection = sections[currentTabIndex];
            const fieldsToValidate = Object.keys(getValues()).filter(field => {
                // This is a simplified approach - in a real app, you'd map section fields more explicitly
                return currentSection.validator({ ...getValues() });
            });

            const isValid = await trigger(fieldsToValidate as any);
            if (!isValid) return;
        }

        setActiveTab(tabId);
    }, [activeTab, sections, trigger, getValues]);

    // Handle next button click
    const handleNext = useCallback(async () => {
        const currentTabIndex = sections.findIndex(section => section.tabId === activeTab);
        if (currentTabIndex < sections.length - 1) {
            // Chỉ xác thực các trường của tab hiện tại
            let fieldsToValidate = [];

            // Xác định các trường cần xác thực dựa trên tab hiện tại
            if (activeTab === 'personal') {
                fieldsToValidate = ['fullName', 'email', 'phoneNumber'];
            } else if (activeTab === 'account') {
                fieldsToValidate = ['username', 'password'];
            } else if (activeTab === 'profile') {
                fieldsToValidate = ['department', 'position', 'bio'];
            } else if (activeTab === 'preferences') {
                fieldsToValidate = ['contactMethod', 'receiveNotifications', 'theme', 'agreeTerms'];
            }

            // Kích hoạt xác thực chỉ cho các trường của tab hiện tại
            const isValid = await trigger(fieldsToValidate);
            if (isValid) {
                const nextTab = sections[currentTabIndex + 1].tabId;
                setActiveTab(nextTab);
            } else {
                console.log("Vui lòng điền đầy đủ thông tin cho tab hiện tại");
            }
        }
    }, [activeTab, sections, trigger]);

    // Submit handler
    const onSubmit = useCallback(async (data: FormValues) => {
        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Set form data
            setFormData(data);
            setIsSubmitted(true);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    // If form is submitted, show success message
    if (isSubmitted && formData) {
        return (
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>}>
                <FormSuccess data={formData} onReset={() => {
                    methods.reset();
                    setIsSubmitted(false);
                    setFormData(null);
                    setActiveTab("personal");
                }} />
            </Suspense>
        );
    }

    console.log("Form data:", methods.formState.errors);

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8 text-center">Tối ưu hiệu suất Form</h1>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Đăng ký thành viên</CardTitle>
                            <CardDescription>Hoàn thành các bước đăng ký</CardDescription>
                        </CardHeader>

                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            <div className="px-6">
                                <TabsList className="grid grid-cols-4 mb-4">
                                    {sections.map((section) => (
                                        <TabsTrigger
                                            key={section.tabId}
                                            value={section.tabId}
                                            className="text-sm"
                                        >
                                            {section.title}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <CardContent>
                                <TabsContent value="personal" className="space-y-4">
                                    <UnifiedFormField
                                        name="fullName"
                                        label="Họ và tên"
                                        control={control}
                                        type="text"
                                        placeholder="Nhập họ và tên"
                                        required
                                    />

                                    <UnifiedFormField
                                        name="email"
                                        label="Email"
                                        control={control}
                                        type="email"
                                        placeholder="your.email@example.com"
                                        required
                                        autoComplete="email"
                                    />

                                    <UnifiedFormField
                                        name="phoneNumber"
                                        label="Số điện thoại"
                                        control={control}
                                        type="text"
                                        placeholder="0987654321"
                                        required
                                        autoComplete="tel"
                                    />
                                </TabsContent>

                                <TabsContent value="account" className="space-y-4">
                                    <UnifiedFormField
                                        name="username"
                                        label="Tên đăng nhập"
                                        control={control}
                                        type="text"
                                        placeholder="your_username"
                                        required
                                        autoComplete="username"
                                    />

                                    <UnifiedFormField
                                        name="password"
                                        label="Mật khẩu"
                                        control={control}
                                        type="password"
                                        placeholder="********"
                                        required
                                        description="Mật khẩu phải có ít nhất 8 ký tự"
                                    />
                                </TabsContent>

                                <TabsContent value="profile" className="space-y-4">
                                    <UnifiedFormField
                                        name="department"
                                        label="Phòng ban"
                                        control={control}
                                        type="select"
                                        placeholder="Chọn phòng ban"
                                        options={departmentOptions}
                                        required
                                    />

                                    <UnifiedFormField
                                        name="position"
                                        label="Vị trí"
                                        control={control}
                                        type="combobox"
                                        placeholder="Chọn vị trí"
                                        options={positionOptions}
                                        searchPlaceholder="Tìm vị trí..."
                                        required
                                    />

                                    <UnifiedFormField
                                        name="bio"
                                        label="Giới thiệu"
                                        control={control}
                                        type="textarea"
                                        placeholder="Viết vài dòng về bản thân..."
                                        rows={4}
                                    />
                                </TabsContent>

                                <TabsContent value="preferences" className="space-y-4">
                                    <UnifiedFormField
                                        name="contactMethod"
                                        label="Phương thức liên hệ ưa thích"
                                        control={control}
                                        type="radio"
                                        options={contactMethodOptions}
                                        orientation="horizontal"
                                        required
                                    />

                                    <UnifiedFormField
                                        name="theme"
                                        label="Giao diện"
                                        control={control}
                                        type="select"
                                        placeholder="Chọn giao diện"
                                        options={themeOptions}
                                    />

                                    <UnifiedFormField
                                        name="receiveNotifications"
                                        label="Nhận thông báo về sản phẩm và dịch vụ mới"
                                        control={control}
                                        type="checkbox"
                                        description="Bạn có thể hủy đăng ký bất kỳ lúc nào"
                                    />

                                    <Separator className="my-4" />

                                    <UnifiedFormField
                                        name="agreeTerms"
                                        label="Tôi đồng ý với điều khoản và điều kiện"
                                        control={control}
                                        type="checkbox"
                                        required
                                    />
                                </TabsContent>
                            </CardContent>

                            <CardFooter className="flex justify-between border-t pt-6">
                                <div>
                                    {activeTab !== sections[0].tabId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                const currentTabIndex = sections.findIndex(section => section.tabId === activeTab);
                                                if (currentTabIndex > 0) {
                                                    setActiveTab(sections[currentTabIndex - 1].tabId);
                                                }
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            Quay lại
                                        </Button>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => methods.reset()}
                                        disabled={isSubmitting}
                                    >
                                        Đặt lại
                                    </Button>

                                    {activeTab !== sections[sections.length - 1].tabId ? (
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={isSubmitting}
                                        >
                                            Tiếp theo
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !isValid}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Đang xử lý
                                                </>
                                            ) : "Hoàn thành"}
                                        </Button>
                                    )}
                                </div>
                            </CardFooter>
                        </Tabs>
                    </Card>
                </form>
            </FormProvider>

            {formData && <FormPreview data={formData} />}
        </div>
    );
}

export default OptimizedFormExample;