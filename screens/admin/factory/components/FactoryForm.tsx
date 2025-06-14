'use client';

import React, { useState, useCallback, useMemo, useEffect, forwardRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FieldInput, FieldSelect, FormController } from '@/components/common/fields';
import { AutoForm } from 'react-table-power';
import { z } from 'zod';

// Define Factory schema
const factorySchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, 'Mã nhà máy phải có ít nhất 2 ký tự'),
  name: z.string().min(2, 'Tên nhà máy phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().min(1, 'Phòng ban là bắt buộc'),
  managingDepartmentId: z.string().optional(),
});

type TFactorySchema = z.infer<typeof factorySchema>;

const defaultFactoryValues: TFactorySchema = {
  code: '',
  name: '',
  description: '',
  address: '',
  phone: '',
  departmentId: '',
  managingDepartmentId: '',
};

// Interface definition
interface FactoryFormProps {
    data?: any;
    dialogType?: 'create' | 'edit' | 'view' | 'delete' | 'custom';
    onSubmit?: (data: any) => Promise<boolean> | boolean;
    onClose?: () => void;
    isReadOnly?: boolean;
    loading?: boolean;
    error?: any;
    onFormDirty?: (isDirty: boolean) => void;
    departments: { value: string; label: string }[];
    users?: { value: string; label: string }[];
    delayValidation?: boolean;
    skipInitialValidation?: boolean;
}

const FactoryForm = forwardRef<any, FactoryFormProps>((props, ref) => {
    const {
        onSubmit,
        isReadOnly = false,
        departments = [],
        users = [],
        data,
        dialogType = 'create',
        onClose,
        error,
        onFormDirty,
        loading,
        delayValidation = false,
        skipInitialValidation = false
    } = props;

    console.log('[FactoryForm] Received data:', data);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Check if in edit mode
    const isEditMode = dialogType === 'edit' || !!data?.id;

    // Determine if form should be read-only
    const effectiveReadOnly = isReadOnly || dialogType === 'view';

    // Configure validation mode
    const validationMode = 'onTouched';

    // Create default values from data with proper type handling
    const createDefaultValues = () => {
        console.log('[FactoryForm] Creating default values from:', data);

        // Default values for create mode
        if (!data) return defaultFactoryValues;

        // Values for edit mode - ensure ID is preserved
        return {
            id: data.id,
            code: data.code || '',
            name: data.name || '',
            description: data.description || '',
            address: data.address || '',
            phone: data.phone || '',
            departmentId: data.departmentId || '',
            managingDepartmentId: data.managingDepartmentId || '',
        };
    };

    // Initialize form with react-hook-form
    const form = useForm<TFactorySchema>({
        resolver: zodResolver(factorySchema),
        mode: validationMode,
        defaultValues: createDefaultValues(),
    });

    console.log('[FactoryForm] Initialized form with default values:', createDefaultValues());

    // Process form data before submission with additional validation
    const processFormData = React.useCallback((values: TFactorySchema): TFactorySchema => {
        console.log('[FactoryForm] Processing form data:', values);
        setHasInteracted(true);

        const processedData = {
            ...values,
            // Preserve ID for edit mode
            ...(isEditMode && data?.id ? { id: data.id } : {}),
            // Trim string values
            code: values.code?.trim(),
            name: values.name?.trim(),
            description: values.description?.trim(),
            address: values.address?.trim(),
            phone: values.phone?.trim(),
        };

        console.log('[FactoryForm] Processed data with ID:', processedData);
        return processedData;
    }, [isEditMode, data?.id]);

    // Form submission handler with improved validation handling
    const handleFormSubmit = async (values: TFactorySchema) => {
        if (!onSubmit) {
            console.error('[FactoryForm] No onSubmit handler provided');
            return false;
        }

        try {
            console.log("[FactoryForm] Data object:", data);

            // Explicitly trigger validation on all fields when submitting
            const isValid = await form.trigger();
            if (!isValid) {
                console.error("[FactoryForm] Validation failed:", form.formState.errors);
                return false;
            }

            setIsSubmitting(true);

            // Process form data and ensure ID is properly handled
            const processed = processFormData(values);

            console.log("[FactoryForm] Final processed data:", processed);

            // For edit mode, ensure all required fields are present
            const dataToSubmit = {
                code: processed.code || '',
                name: processed.name || '',
                description: processed.description || '',
                address: processed.address || '',
                phone: processed.phone || '',
                departmentId: processed.departmentId || '',
                managingDepartmentId: processed.managingDepartmentId || '',
                // Include ID for edit mode
                ...(isEditMode && processed.id ? { id: processed.id } : {}),
            };

            // Remove empty string values for update requests
            if (isEditMode) {
                Object.keys(dataToSubmit).forEach(key => {
                    if (dataToSubmit[key as keyof typeof dataToSubmit] === '') {
                        delete dataToSubmit[key as keyof typeof dataToSubmit];
                    }
                });
            }

            console.log("[FactoryForm] Data to submit after cleanup:", dataToSubmit);

            // Let the API submission happen and only reset on success
            const result = await onSubmit(dataToSubmit);
            console.log("[FactoryForm] Submission result:", result);

            // Only reset form if submission was successful
            if (result === true) {
                form.reset();
                console.log("[FactoryForm] Form reset after successful submission");
            } else {
                console.log("[FactoryForm] Form not reset due to submission failure");
            }

            return result;
        } catch (err) {
            console.error("[FactoryForm] API submission error:", err);

            // Handle API errors without resetting form
            if (err instanceof Error) {
                form.setError('root', {
                    type: 'manual',
                    message: err.message
                });
            } else {
                form.setError('root', {
                    type: 'manual',
                    message: 'Lỗi không xác định khi gửi form'
                });
            }

            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    // Memoize this callback to avoid recreating it on every render
    const handleFormDirtyChange = useCallback((isDirty: boolean) => {
        if (onFormDirty) {
            onFormDirty(isDirty);
        }
    }, [onFormDirty]);

    // Clean up departments data to ensure no duplicate keys
    const safeDepartments = useMemo(() => {
        const valueMap = new Map();
        const uniqueCounter = { current: 0 };

        return (departments || []).map((dept, index) => {
            const originalValue = dept.value;

            if (originalValue === undefined || valueMap.has(originalValue)) {
                const newValue = `unique-dept-${uniqueCounter.current++}-${index}`;
                valueMap.set(newValue, true);
                return {
                    ...dept,
                    value: newValue,
                    label: dept.label || `Department ${index + 1}`,
                };
            }

            valueMap.set(originalValue, true);
            return dept;
        });
    }, [departments]);

    // Reset form if data changes - but only when dialog opens with new data
    useEffect(() => {
        if (data && dialogType) {
            form.reset(createDefaultValues());
        }
    }, [data, dialogType]);

    // Report validation state changes to parent
    useEffect(() => {
        const subscription = form.watch(() => {
            const isDirty = form.formState.isDirty;
            if (onFormDirty) {
                onFormDirty(isDirty);
            }
        });

        return () => subscription.unsubscribe();
    }, [form, onFormDirty, dialogType]);

    // Calculate effective skipInitialValidation value
    const effectiveSkipInitialValidation = skipInitialValidation || delayValidation;

    return (
        <AutoForm
            form={form}
            dialogType={dialogType}
            onFormDirty={handleFormDirtyChange}
            skipInitialValidation={effectiveSkipInitialValidation}
            onSubmit={handleFormSubmit}
            ref={ref}
        >
            <FormController
                form={form}
                onSubmit={handleFormSubmit}
            >
                {/* Code and Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="code"
                        label="Mã nhà máy"
                        placeholder="Nhập mã nhà máy"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />

                    <FieldInput
                        control={form.control}
                        name="name"
                        label="Tên nhà máy"
                        placeholder="Nhập tên nhà máy"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />
                </div>

                {/* Description */}
                <div className="grid grid-cols-1 gap-4">
                    <FieldInput
                        control={form.control}
                        name="description"
                        label="Mô tả"
                        placeholder="Nhập mô tả nhà máy"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                    />
                </div>

                {/* Address and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="address"
                        label="Địa chỉ"
                        placeholder="Nhập địa chỉ"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                    />

                    <FieldInput
                        control={form.control}
                        name="phone"
                        label="Số điện thoại"
                        placeholder="Nhập số điện thoại"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                    />
                </div>

                {/* Department and Managing Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldSelect
                        control={form.control}
                        name="departmentId"
                        label="Phòng ban"
                        options={safeDepartments}
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />

                    <FieldSelect
                        control={form.control}
                        name="managingDepartmentId"
                        label="Phòng ban quản lý"
                        options={safeDepartments}
                        disabled={isSubmitting || effectiveReadOnly || loading}
                    />
                </div>
            </FormController>
        </AutoForm>
    );
});

FactoryForm.displayName = 'FactoryForm';

export default FactoryForm;
