"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

// Shadcn UI components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define Zod validation schema for work entry
export const WorkEntrySchema = z.object({
    id: z.string().optional().default(() => uuidv4()),
    bagCode: z.string().nonempty({ message: "Mã túi là bắt buộc" }),
    operationCode: z.string().nonempty({ message: "Mã công đoạn là bắt buộc" }),
    operationName: z.string().nonempty({ message: "Tên công đoạn là bắt buộc" }),
    hourlyTarget: z.number().min(0, { message: "Chỉ tiêu không được âm" }),
    production: z.record(z.string(), z.number().min(0).or(z.string().transform(val => {
        const num = parseInt(val);
        return isNaN(num) ? 0 : num;
    }))),
    totalProduction: z.number().min(0, { message: "Sản lượng không được âm" }),
    performanceReason: z.object({
        material: z.string().optional(),
        technology: z.string().optional(),
        quality: z.string().optional(),
        machinery: z.string().optional(),
    }),
});

export type WorkEntryFormValues = z.infer<typeof WorkEntrySchema>;

// Enhanced worklog form schema
export const EnhancedWorkLogFormSchema = z.object({
    id: z.string().optional(),
    date: z.string().nonempty({ message: "Ngày làm việc là bắt buộc" }),
    employeeId: z.string().nonempty({ message: "Mã nhân viên là bắt buộc" }),
    employeeCode: z.string().nonempty({ message: "Mã nhân viên là bắt buộc" }),
    employeeName: z.string().nonempty({ message: "Tên nhân viên là bắt buộc" }),
    department: z.string().nonempty({ message: "Đơn vị là bắt buộc" }),
    cardNumber: z.string().optional(),
    workingTime: z.string().nonempty({ message: "Thời gian làm việc là bắt buộc" }),
    entries: z.array(WorkEntrySchema).min(1, { message: "Phải có ít nhất một mục công việc" }),
    status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

export type EnhancedWorkLogFormValues = z.infer<typeof EnhancedWorkLogFormSchema>;

// Mock data for UI components
const bagCodeOptions = [
    { value: 'BAG001', label: 'BAG001 - Túi loại A' },
    { value: 'BAG002', label: 'BAG002 - Túi loại B' },
    { value: 'BAG003', label: 'BAG003 - Túi loại C' },
    { value: 'BAG004', label: 'BAG004 - Túi loại D' },
    { value: 'BAG005', label: 'BAG005 - Túi loại E' },
];

const operationOptions = [
    { code: 'OP001', name: 'May lót', hourlyTarget: 25 },
    { code: 'OP002', name: 'May thân', hourlyTarget: 20 },
    { code: 'OP003', name: 'May ráp', hourlyTarget: 18 },
    { code: 'OP004', name: 'Chặt', hourlyTarget: 30 },
    { code: 'OP005', name: 'Lạng', hourlyTarget: 10 },
    { code: 'OP006', name: 'Hoàn thiện', hourlyTarget: 15 },
];

const workingTimeOptions = [
    { value: '8_hours', label: '8 tiếng (07:30 - 16:30)' },
    { value: '9.5_hours', label: '9 tiếng 30 phút (07:30 - 18:00)' },
    { value: '11_hours', label: '11 tiếng (07:30 - 20:00)' },
];

interface EnhancedWorkLogFormProps {
    defaultValues?: Partial<EnhancedWorkLogFormValues>;
    isEdit?: boolean;
    isReadOnly?: boolean;
    onSubmit?: (data: EnhancedWorkLogFormValues) => Promise<boolean>;
}

const EnhancedWorkLogForm: React.FC<EnhancedWorkLogFormProps> = ({
    defaultValues,
    isEdit = false,
    isReadOnly = false,
    onSubmit,
}) => {
    // Set up form with validation
    const form = useForm<EnhancedWorkLogFormValues>({
        resolver: zodResolver(EnhancedWorkLogFormSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            employeeId: '',
            employeeCode: '',
            employeeName: '',
            department: '',
            cardNumber: '',
            workingTime: '8_hours',
            entries: [
                {
                    id: uuidv4(),
                    bagCode: '',
                    operationCode: '',
                    operationName: '',
                    hourlyTarget: 0,
                    production: {},
                    totalProduction: 0,
                    performanceReason: {
                        material: '',
                        technology: '',
                        quality: '',
                        machinery: '',
                    },
                },
            ],
            status: 'pending',
            ...defaultValues,
        },
    });

    // State to track which accordion items are open
    const [openItems, setOpenItems] = useState<string[]>([]);
    // State to track which entry we are about to delete
    const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

    // Initialize time slots
    useEffect(() => {
        const entries = form.getValues().entries;
        const workingTime = form.watch('workingTime');

        // Update each entry with default production records for its time slots
        entries.forEach((entry, index) => {
            if (!entry.production || Object.keys(entry.production).length === 0) {
                const timeSlots = getTimeSlots(workingTime);
                const production: Record<string, number> = {};

                timeSlots.forEach(slot => {
                    production[slot] = 0;
                });

                form.setValue(`entries.${index}.production`, production);
            }
        });

        // Open the first accordion item by default
        if (entries.length > 0 && entries[0].id && openItems.length === 0) {
            setOpenItems([entries[0].id]);
        }
    }, [form, openItems]);

    // Get time slots based on working time
    const getTimeSlots = (workingTime: string): string[] => {
        switch (workingTime) {
            case "8_hours":
                return ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30', '12:30-13:30', '13:30-14:30', '14:30-15:30', '15:30-16:30'];
            case "9.5_hours":
                return ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30', '12:30-13:30', '13:30-14:30', '14:30-15:30', '15:30-16:30', '16:30-17:00', '17:00-18:00'];
            case "11_hours":
                return ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30', '12:30-13:30', '13:30-14:30', '14:30-15:30', '15:30-16:30', '17:00-18:00', '18:00-19:00', '19:00-20:00'];
            default:
                return ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30', '12:30-13:30', '13:30-14:30', '14:30-15:30', '15:30-16:30'];
        }
    };

    // Handle accordion state
    const handleAccordionChange = (value: string[]) => {
        setOpenItems(value);
    };

    // Handle working time change and update time slots for all entries
    const handleWorkingTimeChange = (value: string) => {
        form.setValue('workingTime', value);

        // Update time slots for all entries
        const entries = form.getValues().entries;
        const timeSlots = getTimeSlots(value);

        entries.forEach((entry, index) => {
            const production: Record<string, number> = {};

            // Preserve existing values and add new slots
            if (entry.production) {
                timeSlots.forEach(slot => {
                    production[slot] = entry.production[slot] || 0;
                });
            } else {
                timeSlots.forEach(slot => {
                    production[slot] = 0;
                });
            }

            form.setValue(`entries.${index}.production`, production);
        });
    };

    // Add a new work entry
    const addWorkEntry = () => {
        const entries = form.getValues().entries;
        const workingTime = form.watch('workingTime');
        const timeSlots = getTimeSlots(workingTime);

        const production: Record<string, number> = {};
        timeSlots.forEach(slot => {
            production[slot] = 0;
        });

        const newEntry: WorkEntryFormValues = {
            id: uuidv4(),
            bagCode: '',
            operationCode: '',
            operationName: '',
            hourlyTarget: 0,
            production,
            totalProduction: 0,
            performanceReason: {
                material: '',
                technology: '',
                quality: '',
                machinery: '',
            },
        };

        form.setValue('entries', [...entries, newEntry]);

        // Open the new accordion item
        setOpenItems([...openItems, newEntry.id]);
    };

    // Remove a work entry
    const removeWorkEntry = (id: string) => {
        const entries = form.getValues().entries;
        if (entries.length <= 1) {
            return; // Don't remove the last entry
        }

        const filteredEntries = entries.filter(entry => entry.id !== id);
        form.setValue('entries', filteredEntries);

        // Update open items
        setOpenItems(openItems.filter(item => item !== id));
        setEntryToDelete(null);
    };

    // Handle operation selection
    const handleOperationChange = (value: string, index: number) => {
        const operation = operationOptions.find(op => op.code === value);
        if (operation) {
            form.setValue(`entries.${index}.operationCode`, operation.code);
            form.setValue(`entries.${index}.operationName`, operation.name);
            form.setValue(`entries.${index}.hourlyTarget`, operation.hourlyTarget);
        }
    };

    // Calculate total production for an entry
    const calculateTotalProduction = (index: number) => {
        const entry = form.getValues().entries[index];
        if (!entry || !entry.production) return;

        const total = Object.values(entry.production).reduce(
            (sum, value) => sum + (typeof value === 'number' ? value : 0),
            0
        );

        form.setValue(`entries.${index}.totalProduction`, total);
    };

    // Handle form submission
    const handleFormSubmit = async (data: EnhancedWorkLogFormValues) => {
        if (isReadOnly || !onSubmit) return;

        try {
            // Recalculate totals before submission
            data.entries.forEach((_, index) => {
                calculateTotalProduction(index);
            });

            // Submit the form data
            const result = await onSubmit(data);
            return result;
        } catch (error) {
            console.error('Error submitting form:', error);
            return false;
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div>
                        <h4 className="font-medium mb-3">1. Thông tin cơ bản</h4>
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày làm việc</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                disabled={isReadOnly}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="workingTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thời gian làm việc</FormLabel>
                                        <Select
                                            onValueChange={(value) => handleWorkingTimeChange(value)}
                                            value={field.value}
                                            disabled={isReadOnly}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn thời gian làm việc" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {workingTimeOptions.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {isEdit && (
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Trạng thái</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={isReadOnly}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn trạng thái" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                                                    <SelectItem value="approved">Đã duyệt</SelectItem>
                                                    <SelectItem value="rejected">Từ chối</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    </div>

                    {/* Employee Information */}
                    <div>
                        <h4 className="font-medium mb-3">2. Thông tin công nhân</h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                            <FormField
                                control={form.control}
                                name="employeeName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Họ tên</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={true} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="employeeCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mã nhân viên</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={true} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cardNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mã thẻ</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isReadOnly} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Đơn vị</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={true} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Work Entries */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">3. Chi tiết công việc</h4>
                        {!isReadOnly && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addWorkEntry}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm công việc
                            </Button>
                        )}
                    </div>

                    <Accordion
                        type="multiple"
                        value={openItems}
                        onValueChange={handleAccordionChange}
                        className="border rounded-lg overflow-hidden"
                    >
                        {form.watch('entries').map((entry, index) => (
                            <AccordionItem key={entry.id} value={entry.id || `entry-${index}`}>
                                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">
                                    <div className="flex items-center space-x-2">
                                        <span>Công việc #{index + 1}</span>
                                        {entry.bagCode && (
                                            <Badge variant="outline" className="ml-2">
                                                {entry.bagCode}
                                            </Badge>
                                        )}
                                        {entry.operationName && (
                                            <Badge variant="outline" className="bg-blue-50">
                                                {entry.operationName}
                                            </Badge>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 border-t">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Bag Code */}
                                            <FormField
                                                control={form.control}
                                                name={`entries.${index}.bagCode`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Mã túi</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={isReadOnly}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Chọn mã túi" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {bagCodeOptions.map(option => (
                                                                    <SelectItem key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Operation */}
                                            <FormField
                                                control={form.control}
                                                name={`entries.${index}.operationCode`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Công đoạn</FormLabel>
                                                        <Select
                                                            onValueChange={(value) => handleOperationChange(value, index)}
                                                            value={field.value}
                                                            disabled={isReadOnly}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Chọn công đoạn" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {operationOptions.map(option => (
                                                                    <SelectItem key={option.code} value={option.code}>
                                                                        {option.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Hourly Target */}
                                            <FormField
                                                control={form.control}
                                                name={`entries.${index}.hourlyTarget`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Chỉ tiêu giờ</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                value={field.value || ''}
                                                                disabled={isReadOnly}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Hourly Production */}
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Chi tiết sản lượng theo giờ:</h5>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {getTimeSlots(form.watch('workingTime')).map(timeSlot => (
                                                    <FormField
                                                        key={`${entry.id}-${timeSlot}`}
                                                        control={form.control}
                                                        name={`entries.${index}.production.${timeSlot}`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs text-gray-500">{timeSlot}</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        placeholder="0"
                                                                        {...field}
                                                                        onChange={(e) => {
                                                                            field.onChange(parseInt(e.target.value) || 0);
                                                                            calculateTotalProduction(index);
                                                                        }}
                                                                        value={field.value || ''}
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Total Production */}
                                        <div className="flex justify-end">
                                            <FormField
                                                control={form.control}
                                                name={`entries.${index}.totalProduction`}
                                                render={({ field }) => (
                                                    <FormItem className="w-1/3">
                                                        <FormLabel>Tổng sản lượng</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                className="font-bold"
                                                                disabled={true}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Performance Reasons */}
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Nguyên nhân (nếu có):</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`entries.${index}.performanceReason.material`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs text-gray-500">Nguyên nhân vật tư</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    rows={2}
                                                                    placeholder="Nhập nguyên nhân..."
                                                                    {...field}
                                                                    disabled={isReadOnly}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`entries.${index}.performanceReason.technology`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs text-gray-500">Nguyên nhân công nghệ</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    rows={2}
                                                                    placeholder="Nhập nguyên nhân..."
                                                                    {...field}
                                                                    disabled={isReadOnly}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`entries.${index}.performanceReason.quality`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs text-gray-500">Nguyên nhân chất lượng</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    rows={2}
                                                                    placeholder="Nhập nguyên nhân..."
                                                                    {...field}
                                                                    disabled={isReadOnly}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`entries.${index}.performanceReason.machinery`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs text-gray-500">Nguyên nhân máy móc</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    rows={2}
                                                                    placeholder="Nhập nguyên nhân..."
                                                                    {...field}
                                                                    disabled={isReadOnly}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Delete entry button */}
                                        {!isReadOnly && form.watch('entries').length > 1 && (
                                            <div className="flex justify-end mt-4">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => setEntryToDelete(entry.id || `entry-${index}`)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Xóa công việc
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Xác nhận xóa công việc</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>Hủy</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-red-600 hover:bg-red-700"
                                                                onClick={() => entryToDelete && removeWorkEntry(entryToDelete)}
                                                            >
                                                                Xóa
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                {!isReadOnly && (
                    <div className="flex justify-end space-x-3">
                        <Button
                            type="button"
                            variant="outline"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                        >
                            {isEdit ? 'Cập nhật báo cáo' : 'Lưu báo cáo'}
                        </Button>
                    </div>
                )}

            </form>
        </Form>
    );
}
export default EnhancedWorkLogForm;