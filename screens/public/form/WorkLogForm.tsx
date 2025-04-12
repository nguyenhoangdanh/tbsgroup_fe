

"use client";
import React, { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FieldCombobox } from "@/components/common/Form/FieldCombobox";
import { FieldInput } from "@/components/common/Form/FieldInput";
import { FieldSelect } from "@/components/common/Form/FieldSelect";
import { FieldTextarea } from "@/components/common/Form/FieldTextarea";
import FormActions from "@/components/common/Form/FormAction";
import { useWorkLogService } from "./workLogService";

// Define production record type
type ProductionRecord = Record<string, number>;

// Định nghĩa schema bên ngoài component để tránh tạo lại mỗi lần render
const workLogSchema = z.object({
    id: z.string().optional(),
    date: z.string().min(1, "Vui lòng chọn ngày"),
    employeeId: z.string().min(1, "Vui lòng chọn nhân viên"),
    employeeCode: z.string(),
    employeeName: z.string(),
    department: z.string(),
    cardNumber: z.string(),
    workingTime: z.string().min(1, "Vui lòng chọn thời gian làm việc"),
    bagCode: z.string().min(1, "Vui lòng chọn mã túi"),
    operationCode: z.string().min(1, "Vui lòng chọn mã công đoạn"),
    operationName: z.string().min(1, "Vui lòng chọn công đoạn"),
    hourlyTarget: z.number().min(0, "Chỉ tiêu giờ không được âm"),
    production: z.record(z.string(), z.coerce.number().min(0, "Sản lượng không được âm")),
    totalProduction: z.number().min(0, "Tổng sản lượng không được âm"),
    performanceReason: z.object({
        material: z.string().optional().nullable(),
        technology: z.string().optional().nullable(),
        quality: z.string().optional().nullable(),
        machinery: z.string().optional().nullable(),
    }),
    status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

// Tạo initialProduction một lần duy nhất
const initialProduction: ProductionRecord = {
    "7:30-8:30": 0,
    "8:30-9:30": 0,
    "9:30-10:30": 0,
    "10:30-11:30": 0,
    "12:30-13:30": 0,
    "13:30-14:30": 0,
    "14:30-15:30": 0,
    "15:30-16:30": 0,
    "17:00-18:00": 0,
    "18:00-19:00": 0,
};

// Định nghĩa sẵn các time slots để tránh tính toán lại
const TIME_SLOTS = {
    "8_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30"],
    "9.5_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00"],
    "11_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00", "18:00-19:00"],
};

const BREAK_TIME_TEXT = {
    "8_hours": "Thời gian nghỉ: 11:30-12:30",
    "9.5_hours": "Thời gian nghỉ: 11:30-12:30",
    "11_hours": "Thời gian nghỉ: 11:30-12:30, 16:30-17:00",
};

export type WorkLogFormValues = z.infer<typeof workLogSchema>;

const CompactInfoDisplay: React.FC<{
    label: string;
    value: string | number;
}> = ({ label, value }) => (
    <div className="flex items-center text-sm">
        <span className="font-medium mr-2">{label}:</span>
        <span>{value || "—"}</span>
    </div>
);

interface WorkLogFormProps {
    isEdit?: boolean;
    isReadOnly?: boolean;
    defaultValues?: Partial<WorkLogFormValues>;
    onSubmit?: (data: WorkLogFormValues) => Promise<boolean>;
}

const WorkLogForm: React.FC<WorkLogFormProps> = ({
    isEdit = false,
    defaultValues,
    isReadOnly = false,
    onSubmit
}) => {
    // Dùng useRef để lưu trữ tổng production, tránh re-render
    const totalProductionRef = useRef<number>(0);

    // Sử dụng useRef để lưu trữ timeout ID cho debounce
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sử dụng useState cho việc hiển thị chi tiết nhân viên
    const [showEmployeeDetails, setShowEmployeeDetails] = useState(
        !!defaultValues?.employeeId
    );

    // Sử dụng useState cho các giá trị production để tối ưu render
    const [productionState, setProductionState] = useState<ProductionRecord>(
        defaultValues?.production || initialProduction
    );

    const {
        employees,
        bagCodes,
        operations,
        workingTimeOptions,
        getEmployeeDetails,
        getOperationDetails
    } = useWorkLogService();

    const form = useForm<WorkLogFormValues>({
        resolver: zodResolver(workLogSchema),
        defaultValues: {
            id: undefined,
            date: new Date().toISOString().split('T')[0],
            employeeId: "",
            employeeCode: "",
            employeeName: "",
            department: "",
            cardNumber: "",
            workingTime: "",
            bagCode: "",
            operationCode: "",
            operationName: "",
            hourlyTarget: 0,
            production: defaultValues?.production || initialProduction,
            totalProduction: defaultValues?.totalProduction || 0,
            performanceReason: {
                material: "",
                technology: "",
                quality: "",
                machinery: "",
            },
            status: "pending",
            ...defaultValues
        },
        mode: "onBlur", // Thay đổi từ onChange sang onBlur để giảm số lần validate
    });

    const { control, watch, setValue, handleSubmit, formState: { isSubmitting } } = form;

    const selectedEmployeeId = watch("employeeId");
    const selectedWorkingTime = watch("workingTime");
    const selectedOperationName = watch("operationName");
    const employeeCode = watch("employeeCode");
    const cardNumber = watch("cardNumber");
    const department = watch("department");

    // Fetch employee details khi employee được chọn
    useEffect(() => {
        if (selectedEmployeeId) {
            const employee = getEmployeeDetails(selectedEmployeeId);
            if (employee) {
                setValue("employeeCode", employee.code);
                setValue("employeeName", employee.name);
                setValue("department", employee.department);
                setValue("cardNumber", employee.cardNumber);

                // Hiển thị chi tiết nhân viên
                setShowEmployeeDetails(true);
            }
        }
    }, [selectedEmployeeId, getEmployeeDetails, setValue]);

    // Fetch operation details khi operation được chọn
    useEffect(() => {
        if (selectedOperationName) {
            const operation = getOperationDetails(selectedOperationName);
            if (operation) {
                setValue("hourlyTarget", operation.hourlyTarget);
                setValue("operationCode", operation.code);
            }
        }
    }, [selectedOperationName, getOperationDetails, setValue]);

    // Tính tổng production một cách hiệu quả
    const calculateTotalProduction = useCallback((production: ProductionRecord): number => {
        return Object.values(production).reduce(
            (sum, value) => sum + (typeof value === 'string' ? parseInt(value, 10) || 0 : (value || 0)),
            0
        );
    }, []);

    // Sử dụng useMemo cho time slots để tránh tính toán lại
    const timeSlots = useMemo(() => {
        if (!selectedWorkingTime) return [];
        return TIME_SLOTS[selectedWorkingTime as keyof typeof TIME_SLOTS] || [];
    }, [selectedWorkingTime]);

    // Xử lý thay đổi giá trị production với debounce để tránh cập nhật liên tục
    const handleProductionChange = useCallback((timeSlot: string, value: number) => {
        // Cập nhật state local trước để UI phản hồi ngay lập tức
        setProductionState(prev => {
            const newState = { ...prev, [timeSlot]: value };

            // Cập nhật ref để luôn có giá trị mới nhất
            totalProductionRef.current = calculateTotalProduction(newState);

            return newState;
        });

        // Hủy bỏ timeout trước đó nếu có
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Đặt timeout mới để debounce việc cập nhật form
        debounceTimerRef.current = setTimeout(() => {
            // Cập nhật giá trị vào form
            setValue(`production.${timeSlot}`, value, { shouldValidate: false });
            setValue("totalProduction", totalProductionRef.current, { shouldValidate: false });

            // Chỉ validate một lần sau khi đã cập nhật tất cả
            form.trigger(["production", "totalProduction"]);

            debounceTimerRef.current = null;
        }, 100); // 100ms debounce time
    }, [setValue, form, calculateTotalProduction]);

    // Đảm bảo dọn dẹp timeout khi component unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Cập nhật tổng production ban đầu khi component mount
    useEffect(() => {
        if (defaultValues?.production) {
            const total = calculateTotalProduction(defaultValues.production);
            setValue("totalProduction", total);
            totalProductionRef.current = total;
        }
    }, [defaultValues, calculateTotalProduction, setValue]);

    // Xử lý khi thay đổi workingTime
    useEffect(() => {
        if (selectedWorkingTime) {
            // Reset production values cho các time slots không cần thiết
            const validTimeSlots = TIME_SLOTS[selectedWorkingTime as keyof typeof TIME_SLOTS] || [];
            const updatedProduction = { ...productionState };

            // Chỉ giữ lại các time slots phù hợp với workingTime đã chọn
            Object.keys(updatedProduction).forEach(slot => {
                if (!validTimeSlots.includes(slot)) {
                    updatedProduction[slot] = 0;
                }
            });

            setProductionState(updatedProduction);
            setValue("production", updatedProduction);

            const total = calculateTotalProduction(updatedProduction);
            setValue("totalProduction", total);
            totalProductionRef.current = total;
        }
    }, [selectedWorkingTime, setValue, calculateTotalProduction]);

    // Memo hóa breakTimeText để tránh tính toán lại
    const breakTimeText = useMemo(() => {
        if (!selectedWorkingTime) return "";
        return BREAK_TIME_TEXT[selectedWorkingTime as keyof typeof BREAK_TIME_TEXT] || "";
    }, [selectedWorkingTime]);

    // Handle form submission
    const handleFormSubmit = async (data: WorkLogFormValues) => {
        if (onSubmit && !isReadOnly) {
            return await onSubmit(data);
        }
        return false;
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{isEdit ? "Cập nhật báo cáo sản lượng" : "Báo cáo sản lượng mới"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="space-y-6"
                >
                    {/* Section 1: Thông tin nhân viên */}
                    <div className="border rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">1. Thông tin nhân viên</h3>
                        <Separator className="mb-4" />

                        <div className="space-y-4">
                            <FieldCombobox
                                name="employeeId"
                                label="Họ tên nhân viên"
                                control={control}
                                options={employees.map(emp => ({ value: emp.id, label: emp.name }))}
                                placeholder="Chọn nhân viên"
                                required
                                searchPlaceholder="Tìm kiếm nhân viên..."
                                disabled={isReadOnly}
                            />

                            {showEmployeeDetails && (
                                <div className="grid grid-cols-3 gap-4 mt-2">
                                    <CompactInfoDisplay
                                        label="Mã nhân viên"
                                        value={employeeCode}
                                    />
                                    <CompactInfoDisplay
                                        label="Mã số thẻ"
                                        value={cardNumber}
                                    />
                                    <CompactInfoDisplay
                                        label="Đơn vị"
                                        value={department}
                                    />

                                </div >
                            )}
                        </div >
                    </div >

                    {/* Section 2: Thông tin công việc */}
                    < div className="border rounded-md p-4" >
                        <h3 className="text-lg font-medium mb-2">2. Thông tin công việc</h3>
                        <Separator className="mb-4" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <FieldSelect
                                    name="workingTime"
                                    label="Thời gian làm việc"
                                    control={control}
                                    options={workingTimeOptions}
                                    placeholder="Chọn thời gian làm việc"
                                    required
                                    disabled={isReadOnly}
                                />
                                {breakTimeText && (
                                    <div className="text-sm text-gray-500 italic mt-2">
                                        {breakTimeText}
                                    </div>
                                )}
                            </div>

                            <FieldCombobox
                                name="bagCode"
                                label="Mã túi"
                                control={control}
                                options={bagCodes}
                                placeholder="Chọn mã túi"
                                required
                                searchPlaceholder="Tìm kiếm mã túi..."
                                disabled={isReadOnly}
                            />

                            <FieldCombobox
                                name="operationName"
                                label="Tên công đoạn"
                                control={control}
                                options={operations.map(op => ({ value: op.name, label: op.name }))}
                                placeholder="Chọn công đoạn"
                                required
                                searchPlaceholder="Tìm kiếm công đoạn..."
                                disabled={isReadOnly}
                            />


                            <div className="flex items-center justify-between">
                                <CompactInfoDisplay
                                    label="Mã công đoạn"
                                    value={watch("operationCode")}
                                />
                                <CompactInfoDisplay
                                    label="Chỉ tiêu giờ"
                                    value={watch("hourlyTarget")}
                                />
                            </div>
                        </div>
                    </ div>

                    {/* Section 3: Chi tiết sản lượng */}
                    {
                        selectedWorkingTime && (
                            <div className="border rounded-md p-4">
                                <h3 className="text-lg font-medium mb-2">3. Chi tiết sản lượng</h3>
                                <Separator className="mb-4" />

                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        {timeSlots.map((timeSlot) => (
                                            <div key={timeSlot} className="flex items-center space-x-2">
                                                <label className="w-20 text-sm font-medium">{timeSlot}</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    placeholder="0"
                                                    disabled={isReadOnly}
                                                    value={productionState[timeSlot]?.toString() || "0"}
                                                    onChange={(e) => {
                                                        const numValue = parseInt(e.target.value, 10) || 0;
                                                        handleProductionChange(timeSlot, numValue);
                                                    }}
                                                    className="w-full flex-1 border border-gray-300 rounded-md px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end mt-4">
                                        <div className="flex items-center space-x-2">
                                            <label className="font-medium">Tổng cộng:</label>
                                            <div className="w-32 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-right 
                                            dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                                                {totalProductionRef.current}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Section 4: Nguyên nhân (nếu có) */}
                    <div className="border rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">4. Nguyên nhân (nếu có)</h3>
                        <Separator className="mb-4" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FieldTextarea
                                name="performanceReason.material"
                                label="Nguyên nhân vật tư"
                                control={control}
                                placeholder="Nhập nguyên nhân vật tư..."
                                disabled={isReadOnly}
                            />
                            <FieldTextarea
                                name="performanceReason.technology"
                                label="Nguyên nhân công nghệ"
                                control={control}
                                placeholder="Nhập nguyên nhân công nghệ..."
                                disabled={isReadOnly}
                            />
                            <FieldTextarea
                                name="performanceReason.quality"
                                label="Nguyên nhân chất lượng"
                                control={control}
                                placeholder="Nhập nguyên nhân chất lượng..."
                                disabled={isReadOnly}
                            />
                            <FieldTextarea
                                name="performanceReason.machinery"
                                label="Nguyên nhân máy móc"
                                control={control}
                                placeholder="Nhập nguyên nhân máy móc..."
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    {/* Fixed action buttons at bottom */}
                    {
                        !isReadOnly && (
                            // <div className="fixed-submit-button">
                            <FormActions
                                isSubmitting={isSubmitting}
                                isEdit={isEdit}
                                submitLabel={{
                                    create: "Tạo mới",
                                    update: "Cập nhật",
                                    loading: "Đang xử lý..."
                                }}
                            />
                            // </div>
                        )
                    }
                </form >
            </CardContent >
        </Card >
    );
};

// Sử dụng React.memo để tránh re-render không cần thiết
export default React.memo(WorkLogForm);






























// "use client";
// import React, { useEffect, useCallback, useMemo, useState, useRef } from "react";
// import { z } from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { FieldCombobox } from "@/components/common/Form/FieldCombobox";
// import { FieldInput } from "@/components/common/Form/FieldInput";
// import { FieldSelect } from "@/components/common/Form/FieldSelect";
// import { FieldTextarea } from "@/components/common/Form/FieldTextarea";
// import FormActions from "@/components/common/Form/FormAction";
// import { useWorkLogService, WorkLog } from "./workLogService";
import { m } from 'framer-motion';

// // Define production record type
// type ProductionRecord = Record<string, number>;

// // Định nghĩa schema bên ngoài component để tránh tạo lại mỗi lần render
// const workLogSchema = z.object({
//     id: z.string().optional(),
//     date: z.string().min(1, "Vui lòng chọn ngày"),
//     employeeId: z.string().min(1, "Vui lòng chọn nhân viên"),
//     employeeCode: z.string(),
//     employeeName: z.string(),
//     department: z.string(),
//     cardNumber: z.string(),
//     workingTime: z.string().min(1, "Vui lòng chọn thời gian làm việc"),
//     bagCode: z.string().min(1, "Vui lòng chọn mã túi"),
//     operationName: z.string().min(1, "Vui lòng chọn công đoạn"),
//     hourlyTarget: z.number().min(0, "Chỉ tiêu giờ không được âm"),
//     production: z.record(z.string(), z.coerce.number().min(0, "Sản lượng không được âm")),
//     totalProduction: z.number().min(0, "Tổng sản lượng không được âm"),
//     performanceReason: z.object({
//         material: z.string().optional().nullable(),
//         technology: z.string().optional().nullable(),
//         quality: z.string().optional().nullable(),
//         machinery: z.string().optional().nullable(),
//     }),
//     status: z.enum(["pending", "approved", "rejected"]).default("pending"),
// });

// // Định nghĩa sẵn các time slots để tránh tính toán lại
// const TIME_SLOTS = {
//     "8_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30"],
//     "9.5_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00"],
//     "11_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00", "18:00-19:00"],
// };

// const BREAK_TIME_TEXT = {
//     "8_hours": "Thời gian nghỉ: 11:30-12:30",
//     "9.5_hours": "Thời gian nghỉ: 11:30-12:30",
//     "11_hours": "Thời gian nghỉ: 11:30-12:30, 16:30-17:00",
// };

// export type WorkLogFormValues = z.infer<typeof workLogSchema>;

// interface WorkLogFormProps {
//     isEdit?: boolean;
//     isReadOnly?: boolean;
//     defaultValues?: Partial<WorkLogFormValues>;
//     onSubmit?: (data: WorkLogFormValues) => Promise<boolean>;
// }

// // Tạo initialProduction một lần duy nhất
// const initialProduction: ProductionRecord = {
//     "7:30-8:30": 0,
//     "8:30-9:30": 0,
//     "9:30-10:30": 0,
//     "10:30-11:30": 0,
//     "12:30-13:30": 0,
//     "13:30-14:30": 0,
//     "14:30-15:30": 0,
//     "15:30-16:30": 0,
//     "17:00-18:00": 0,
//     "18:00-19:00": 0,
// };

// const WorkLogForm: React.FC<WorkLogFormProps> = ({
//     isEdit = false,
//     defaultValues,
//     isReadOnly = false,
//     onSubmit
// }) => {
//     // Dùng useRef để lưu trữ tổng production, tránh re-render
//     const totalProductionRef = useRef<number>(0);

//     // Sử dụng useRef để lưu trữ timeout ID cho debounce
//     const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

//     // Sử dụng useState cho các giá trị production để tối ưu render
//     const [productionState, setProductionState] = useState<ProductionRecord>(
//         defaultValues?.production || initialProduction
//     );

//     const {
//         employees,
//         bagCodes,
//         operations,
//         workingTimeOptions,
//         getEmployeeDetails,
//         getOperationDetails
//     } = useWorkLogService();

//     const form = useForm<WorkLogFormValues>({
//         resolver: zodResolver(workLogSchema),
//         defaultValues: {
//             id: undefined,
//             date: new Date().toISOString().split('T')[0],
//             employeeId: "",
//             employeeCode: "",
//             employeeName: "",
//             department: "",
//             cardNumber: "",
//             workingTime: "",
//             bagCode: "",
//             operationName: "",
//             hourlyTarget: 0,
//             production: defaultValues?.production || initialProduction,
//             totalProduction: defaultValues?.totalProduction || 0,
//             performanceReason: {
//                 material: "",
//                 technology: "",
//                 quality: "",
//                 machinery: "",
//             },
//             status: "pending",
//             ...defaultValues
//         },
//         mode: "onBlur", // Thay đổi từ onChange sang onBlur để giảm số lần validate
//     });

//     const { control, watch, setValue, handleSubmit, formState: { isSubmitting } } = form;

//     const selectedEmployeeId = watch("employeeId");
//     const selectedWorkingTime = watch("workingTime");
//     const selectedOperationName = watch("operationName");

//     // Fetch employee details khi employee được chọn
//     useEffect(() => {
//         if (selectedEmployeeId) {
//             const employee = getEmployeeDetails(selectedEmployeeId);
//             if (employee) {
//                 setValue("employeeCode", employee.code);
//                 setValue("employeeName", employee.name);
//                 setValue("department", employee.department);
//                 setValue("cardNumber", employee.cardNumber);
//             }
//         }
//     }, [selectedEmployeeId, getEmployeeDetails, setValue]);

//     // Fetch operation details khi operation được chọn
//     useEffect(() => {
//         if (selectedOperationName) {
//             const operation = getOperationDetails(selectedOperationName);
//             if (operation) {
//                 setValue("hourlyTarget", operation.hourlyTarget);
//             }
//         }
//     }, [selectedOperationName, getOperationDetails, setValue]);

//     // Tính tổng production một cách hiệu quả
//     const calculateTotalProduction = useCallback((production: ProductionRecord): number => {
//         return Object.values(production).reduce(
//             (sum, value) => sum + (typeof value === 'string' ? parseInt(value, 10) || 0 : (value || 0)),
//             0
//         );
//     }, []);

//     // Sử dụng useMemo cho time slots để tránh tính toán lại
//     const timeSlots = useMemo(() => {
//         if (!selectedWorkingTime) return [];
//         return TIME_SLOTS[selectedWorkingTime as keyof typeof TIME_SLOTS] || [];
//     }, [selectedWorkingTime]);

//     // Xử lý thay đổi giá trị production với debounce để tránh cập nhật liên tục
//     const handleProductionChange = useCallback((timeSlot: string, value: number) => {
//         // Cập nhật state local trước để UI phản hồi ngay lập tức
//         setProductionState(prev => {
//             const newState = { ...prev, [timeSlot]: value };

//             // Cập nhật ref để luôn có giá trị mới nhất
//             totalProductionRef.current = calculateTotalProduction(newState);

//             return newState;
//         });

//         // Hủy bỏ timeout trước đó nếu có
//         if (debounceTimerRef.current) {
//             clearTimeout(debounceTimerRef.current);
//         }

//         // Đặt timeout mới để debounce việc cập nhật form
//         debounceTimerRef.current = setTimeout(() => {
//             // Cập nhật giá trị vào form
//             setValue(`production.${timeSlot}`, value, { shouldValidate: false });
//             setValue("totalProduction", totalProductionRef.current, { shouldValidate: false });

//             // Chỉ validate một lần sau khi đã cập nhật tất cả
//             form.trigger(["production", "totalProduction"]);

//             debounceTimerRef.current = null;
//         }, 100); // 100ms debounce time
//     }, [setValue, form, calculateTotalProduction]);

//     // Đảm bảo dọn dẹp timeout khi component unmount
//     useEffect(() => {
//         return () => {
//             if (debounceTimerRef.current) {
//                 clearTimeout(debounceTimerRef.current);
//             }
//         };
//     }, []);

//     // Cập nhật tổng production ban đầu khi component mount
//     useEffect(() => {
//         if (defaultValues?.production) {
//             const total = calculateTotalProduction(defaultValues.production);
//             setValue("totalProduction", total);
//             totalProductionRef.current = total;
//         }
//     }, [defaultValues, calculateTotalProduction, setValue]);

//     // Xử lý khi thay đổi workingTime
//     useEffect(() => {
//         if (selectedWorkingTime) {
//             // Reset production values cho các time slots không cần thiết
//             const validTimeSlots = TIME_SLOTS[selectedWorkingTime as keyof typeof TIME_SLOTS] || [];
//             const updatedProduction = { ...productionState };

//             // Chỉ giữ lại các time slots phù hợp với workingTime đã chọn
//             Object.keys(updatedProduction).forEach(slot => {
//                 if (!validTimeSlots.includes(slot)) {
//                     updatedProduction[slot] = 0;
//                 }
//             });

//             setProductionState(updatedProduction);
//             setValue("production", updatedProduction);

//             const total = calculateTotalProduction(updatedProduction);
//             setValue("totalProduction", total);
//             totalProductionRef.current = total;
//         }
//     }, [selectedWorkingTime, setValue, calculateTotalProduction]);

//     // Memo hóa breakTimeText để tránh tính toán lại
//     const breakTimeText = useMemo(() => {
//         if (!selectedWorkingTime) return "";
//         return BREAK_TIME_TEXT[selectedWorkingTime as keyof typeof BREAK_TIME_TEXT] || "";
//     }, [selectedWorkingTime]);

//     // Handle form submission
//     const handleFormSubmit = async (data: WorkLogFormValues) => {
//         if (onSubmit && !isReadOnly) {
//             return await onSubmit(data);
//         }
//         return false;
//     };

//     return (
//         <Card className="w-full" style={{ overflow: 'visible' }}>
//             <CardHeader>
//                 <CardTitle>{isEdit ? "Cập nhật báo cáo sản lượng" : "Báo cáo sản lượng mới"}</CardTitle>
//             </CardHeader>
//             <CardContent style={{ overflow: 'visible' }}>
//                 <form
//                     onSubmit={handleSubmit(handleFormSubmit)}
//                     className="space-y-6"
//                     style={{ paddingBottom: '80px' }}
//                 >
//                     {/* Employee Information Section */}
//                     <div className="space-y-4">
//                         <h3 className="text-lg font-medium">Thông tin nhân viên</h3>
//                         <Separator />
//                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//                             <FieldCombobox
//                                 name="employeeId"
//                                 label="Họ tên nhân viên"
//                                 control={control}
//                                 options={employees.map(emp => ({ value: emp.id, label: emp.name }))}
//                                 placeholder="Chọn nhân viên"
//                                 required
//                                 searchPlaceholder="Tìm kiếm nhân viên..."
//                                 disabled={isReadOnly}
//                             />
//                             <FieldInput
//                                 name="employeeCode"
//                                 label="Mã nhân viên"
//                                 control={control}
//                                 disabled
//                             />
//                             <FieldInput
//                                 name="cardNumber"
//                                 label="Mã số thẻ"
//                                 control={control}
//                                 disabled
//                             />
//                             <FieldInput
//                                 name="department"
//                                 label="Đơn vị"
//                                 control={control}
//                                 disabled
//                             />
//                         </div>
//                     </div>

//                     {/* Work Information Section */}
//                     <div className="space-y-4">
//                         <h3 className="text-lg font-medium">Thông tin công việc</h3>
//                         <Separator />
//                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//                             <FieldSelect
//                                 name="workingTime"
//                                 label="Thời gian làm việc"
//                                 control={control}
//                                 options={workingTimeOptions}
//                                 placeholder="Chọn thời gian làm việc"
//                                 required
//                                 disabled={isReadOnly}
//                             />
//                             <FieldCombobox
//                                 name="bagCode"
//                                 label="Mã túi"
//                                 control={control}
//                                 options={bagCodes}
//                                 placeholder="Chọn mã túi"
//                                 required
//                                 searchPlaceholder="Tìm kiếm mã túi..."
//                                 disabled={isReadOnly}
//                             />
//                             <FieldCombobox
//                                 name="operationName"
//                                 label="Tên công đoạn"
//                                 control={control}
//                                 options={operations.map(op => ({ value: op.name, label: op.name }))}
//                                 placeholder="Chọn công đoạn"
//                                 required
//                                 searchPlaceholder="Tìm kiếm công đoạn..."
//                                 disabled={isReadOnly}
//                             />
//                             <FieldInput
//                                 name="hourlyTarget"
//                                 label="Chỉ tiêu giờ"
//                                 control={control}
//                                 type="number"
//                                 disabled
//                             />
//                         </div>

//                         {selectedWorkingTime && (
//                             <div className="text-sm text-gray-500 italic mt-2">
//                                 {breakTimeText}
//                             </div>
//                         )}
//                     </div>

//                     {/* Production Details Section */}
//                     {selectedWorkingTime && (
//                         <div className="space-y-4">
//                             <h3 className="text-lg font-medium">Chi tiết sản lượng</h3>
//                             <Separator />
//                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
//                                 {timeSlots.map((timeSlot) => (
//                                     <FieldInput
//                                         key={timeSlot}
//                                         name={`production.${timeSlot}`}
//                                         label={`${timeSlot}`}
//                                         control={control}
//                                         type="number"
//                                         min={0}
//                                         placeholder="Nhập sản lượng"
//                                         disabled={isReadOnly}
//                                         onChange={(e) => {
//                                             const value = parseInt(e.target.value, 10) || 0;
//                                             handleProductionChange(timeSlot, value);
//                                         }}
//                                         // Sử dụng giá trị từ state thay vì từ form để UI phản hồi nhanh hơn
//                                         value={productionState[timeSlot]?.toString() || "0"}
//                                     />
//                                 ))}
//                             </div>
//                             <div className="flex justify-end">
//                                 <FieldInput
//                                     name="totalProduction"
//                                     label="Tổng cộng"
//                                     control={control}
//                                     type="number"
//                                     disabled
//                                     className="w-full sm:w-1/3 md:w-1/4"
//                                     // Sử dụng ref để hiển thị tổng ngay lập tức
//                                     value={totalProductionRef.current.toString()}
//                                 />
//                             </div>
//                         </div>
//                     )}

//                     {/* Reason Section */}
//                     <div className="space-y-4 mb-28">
//                         <h3 className="text-lg font-medium">Nguyên nhân (nếu có)</h3>
//                         <Separator />
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <FieldTextarea
//                                 name="performanceReason.material"
//                                 label="Nguyên liệu"
//                                 control={control}
//                                 placeholder="Nguyên nhân về nguyên liệu..."
//                                 rows={2}
//                                 disabled={isReadOnly}
//                             />
//                             <FieldTextarea
//                                 name="performanceReason.technology"
//                                 label="Kỹ thuật"
//                                 control={control}
//                                 placeholder="Nguyên nhân về kỹ thuật..."
//                                 rows={2}
//                                 disabled={isReadOnly}
//                             />
//                             <FieldTextarea
//                                 name="performanceReason.quality"
//                                 label="Chất lượng"
//                                 control={control}
//                                 placeholder="Nguyên nhân về chất lượng..."
//                                 rows={2}
//                                 disabled={isReadOnly}
//                             />
//                             <FieldTextarea
//                                 name="performanceReason.machinery"
//                                 label="Máy móc"
//                                 control={control}
//                                 placeholder="Nguyên nhân về máy móc thiết bị..."
//                                 rows={2}
//                                 disabled={isReadOnly}
//                             />
//                         </div>
//                     </div>

//                     {/* Fixed action buttons at bottom */}
//                     {!isReadOnly && (
//                         <div className="fixed-submit-button">
//                             <FormActions
//                                 isSubmitting={isSubmitting}
//                                 isEdit={isEdit}
//                                 submitLabel={{
//                                     create: "Tạo mới",
//                                     update: "Cập nhật",
//                                     loading: "Đang xử lý..."
//                                 }}
//                             />
//                         </div>
//                     )}
//                 </form>
//             </CardContent>
//         </Card>
//     );
// };

// // Sử dụng React.memo để tránh re-render không cần thiết
// export default React.memo(WorkLogForm);
