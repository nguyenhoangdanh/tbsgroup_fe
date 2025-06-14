'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback, useMemo, useEffect, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { AutoForm } from 'react-table-power';
import { z } from 'zod';

import { FieldInput, FieldSelect, FieldTextarea, FormController } from '@/components/common/fields';

// Define Line schema
const lineSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, 'Mã dây chuyền phải có ít nhất 2 ký tự'),
  name: z.string().min(2, 'Tên dây chuyền phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  factoryId: z.string().min(1, 'Nhà máy là bắt buộc'),
  capacity: z.number().min(0, 'Công suất phải là số dương').optional(),
});

type TLineSchema = z.infer<typeof lineSchema>;

const defaultLineValues: TLineSchema = {
  code: '',
  name: '',
  description: '',
  factoryId: '',
  capacity: 0,
};

// Interface definition
interface LineFormProps {
    data?: any;
    dialogType?: 'create' | 'edit' | 'view' | 'delete' | 'custom';
    onSubmit?: (data: any) => Promise<boolean> | boolean;
    onClose?: () => void;
    isReadOnly?: boolean;
    loading?: boolean;
    error?: any;
    onFormDirty?: (isDirty: boolean) => void;
    factories: { value: string; label: string }[];
    managers?: { value: string; label: string }[];
    delayValidation?: boolean;
    skipInitialValidation?: boolean;
}

const LineForm = forwardRef<any, LineFormProps>((props, ref) => {
    const {
        onSubmit,
        isReadOnly = false,
        factories = [],
        managers = [],
        data,
        dialogType = 'create',
        onClose,
        error,
        onFormDirty,
        loading,
        delayValidation = false,
        skipInitialValidation = false
    } = props;

    console.log('[LineForm] Received data:', data);

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
        console.log('[LineForm] Creating default values from:', data);

        // Default values for create mode
        if (!data) return defaultLineValues;

        // Values for edit mode - ensure ID is preserved
        return {
            id: data.id,
            code: data.code || '',
            name: data.name || '',
            description: data.description || '',
            factoryId: data.factoryId || '',
            capacity: data.capacity || 0,
        };
    };

    // Initialize form with react-hook-form
    const form = useForm<TLineSchema>({
        resolver: zodResolver(lineSchema),
        mode: validationMode,
        defaultValues: createDefaultValues(),
    });

    console.log('[LineForm] Initialized form with default values:', createDefaultValues());

    // Process form data before submission with additional validation
    const processFormData = React.useCallback((values: TLineSchema): TLineSchema => {
        console.log('[LineForm] Processing form data:', values);
        setHasInteracted(true);

        const processedData = {
            ...values,
            // Preserve ID for edit mode
            ...(isEditMode && data?.id ? { id: data.id } : {}),
            // Trim string values
            code: values.code?.trim(),
            name: values.name?.trim(),
            description: values.description?.trim(),
        };

        console.log('[LineForm] Processed data with ID:', processedData);
        return processedData;
    }, [isEditMode, data?.id]);

    // Form submission handler with improved validation handling
    const handleFormSubmit = async (values: TLineSchema) => {
        if (!onSubmit) {
            console.error('[LineForm] No onSubmit handler provided');
            return false;
        }

        try {
            console.log("[LineForm] Data object:", data);

            // Explicitly trigger validation on all fields when submitting
            const isValid = await form.trigger();
            if (!isValid) {
                console.error("[LineForm] Validation failed:", form.formState.errors);
                return false;
            }

            setIsSubmitting(true);

            // Process form data and ensure ID is properly handled
            const processed = processFormData(values);

            console.log("[LineForm] Final processed data:", processed);

            // For edit mode, ensure all required fields are present
            const dataToSubmit = {
                code: processed.code || '',
                name: processed.name || '',
                description: processed.description || '',
                factoryId: processed.factoryId || '',
                capacity: processed.capacity || 0,
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

            console.log("[LineForm] Data to submit after cleanup:", dataToSubmit);

            // Let the API submission happen and only reset on success
            const result = await onSubmit(dataToSubmit);
            console.log("[LineForm] Submission result:", result);

            // Only reset form if submission was successful
            if (result === true) {
                form.reset();
                console.log("[LineForm] Form reset after successful submission");
            } else {
                console.log("[LineForm] Form not reset due to submission failure");
            }

            return result;
        } catch (err) {
            console.error("[LineForm] API submission error:", err);

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

    // Clean up factories data to ensure no duplicate keys
    const safeFactories = useMemo(() => {
        const valueMap = new Map();
        const uniqueCounter = { current: 0 };

        return (factories || []).map((factory, index) => {
            const originalValue = factory.value;

            if (originalValue === undefined || valueMap.has(originalValue)) {
                const newValue = `unique-factory-${uniqueCounter.current++}-${index}`;
                valueMap.set(newValue, true);
                return {
                    ...factory,
                    value: newValue,
                    label: factory.label || `Factory ${index + 1}`,
                };
            }

            valueMap.set(originalValue, true);
            return factory;
        });
    }, [factories]);

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
                        label="Mã dây chuyền"
                        placeholder="Nhập mã dây chuyền"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />

                    <FieldInput
                        control={form.control}
                        name="name"
                        label="Tên dây chuyền"
                        placeholder="Nhập tên dây chuyền"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />
                </div>

                {/* Factory */}
                <div className="grid grid-cols-1 gap-4">
                    <FieldSelect
                        control={form.control}
                        name="factoryId"
                        label="Nhà máy"
                        options={safeFactories}
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />
                </div>

                {/* Description */}
                <div className="grid grid-cols-1 gap-4">
                    <FieldTextarea
                        control={form.control}
                        name="description"
                        label="Mô tả"
                        placeholder="Nhập mô tả dây chuyền"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        rows={3}
                    />
                </div>

                {/* Capacity */}
                <div className="grid grid-cols-1 gap-4">
                    <FieldInput
                        control={form.control}
                        name="capacity"
                        label="Công suất (sản phẩm/giờ)"
                        placeholder="Nhập công suất"
                        type="number"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                    />
                </div>
            </FormController>
        </AutoForm>
    );
});

LineForm.displayName = 'LineForm';

export default LineForm;
