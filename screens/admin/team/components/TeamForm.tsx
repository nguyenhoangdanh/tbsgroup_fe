'use client';

import React, { useState, useCallback, useMemo, useEffect, forwardRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FieldInput, FieldSelect, FieldTextarea, FormController } from '@/components/common/fields';
import { AutoForm } from 'react-table-power';
import { z } from 'zod';

// Define Team schema
const teamSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, 'Mã tổ phải có ít nhất 2 ký tự'),
  name: z.string().min(2, 'Tên tổ phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  lineId: z.string().min(1, 'Dây chuyền là bắt buộc'),
});

type TTeamSchema = z.infer<typeof teamSchema>;

const defaultTeamValues: TTeamSchema = {
  code: '',
  name: '',
  description: '',
  lineId: '',
};

// Interface definition
interface TeamFormProps {
    data?: any;
    dialogType?: 'create' | 'edit' | 'view' | 'delete' | 'custom';
    onSubmit?: (data: any) => Promise<boolean> | boolean;
    onClose?: () => void;
    isReadOnly?: boolean;
    loading?: boolean;
    error?: any;
    onFormDirty?: (isDirty: boolean) => void;
    lines: { value: string; label: string }[];
    leaders?: { value: string; label: string }[];
    delayValidation?: boolean;
    skipInitialValidation?: boolean;
}

const TeamForm = forwardRef<any, TeamFormProps>((props, ref) => {
    const {
        onSubmit,
        isReadOnly = false,
        lines = [],
        leaders = [],
        data,
        dialogType = 'create',
        onClose,
        error,
        onFormDirty,
        loading,
        delayValidation = false,
        skipInitialValidation = false
    } = props;

    console.log('[TeamForm] Received data:', data);

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
        console.log('[TeamForm] Creating default values from:', data);

        // Default values for create mode
        if (!data) return defaultTeamValues;

        // Values for edit mode - ensure ID is preserved
        return {
            id: data.id,
            code: data.code || '',
            name: data.name || '',
            description: data.description || '',
            lineId: data.lineId || '',
        };
    };

    // Initialize form with react-hook-form
    const form = useForm<TTeamSchema>({
        resolver: zodResolver(teamSchema),
        mode: validationMode,
        defaultValues: createDefaultValues(),
    });

    console.log('[TeamForm] Initialized form with default values:', createDefaultValues());

    // Process form data before submission with additional validation
    const processFormData = React.useCallback((values: TTeamSchema): TTeamSchema => {
        console.log('[TeamForm] Processing form data:', values);
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

        console.log('[TeamForm] Processed data with ID:', processedData);
        return processedData;
    }, [isEditMode, data?.id]);

    // Form submission handler with improved validation handling
    const handleFormSubmit = async (values: TTeamSchema) => {
        if (!onSubmit) {
            console.error('[TeamForm] No onSubmit handler provided');
            return false;
        }

        try {
            console.log("[TeamForm] Data object:", data);

            // Explicitly trigger validation on all fields when submitting
            const isValid = await form.trigger();
            if (!isValid) {
                console.error("[TeamForm] Validation failed:", form.formState.errors);
                return false;
            }

            setIsSubmitting(true);

            // Process form data and ensure ID is properly handled
            const processed = processFormData(values);

            console.log("[TeamForm] Final processed data:", processed);

            // For edit mode, ensure all required fields are present
            const dataToSubmit = {
                code: processed.code || '',
                name: processed.name || '',
                description: processed.description || '',
                lineId: processed.lineId || '',
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

            console.log("[TeamForm] Data to submit after cleanup:", dataToSubmit);

            // Let the API submission happen and only reset on success
            const result = await onSubmit(dataToSubmit);
            console.log("[TeamForm] Submission result:", result);

            // Only reset form if submission was successful
            if (result === true) {
                form.reset();
                console.log("[TeamForm] Form reset after successful submission");
            } else {
                console.log("[TeamForm] Form not reset due to submission failure");
            }

            return result;
        } catch (err) {
            console.error("[TeamForm] API submission error:", err);

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

    // Clean up lines data to ensure no duplicate keys
    const safeLines = useMemo(() => {
        const valueMap = new Map();
        const uniqueCounter = { current: 0 };

        return (lines || []).map((line, index) => {
            const originalValue = line.value;

            if (originalValue === undefined || valueMap.has(originalValue)) {
                const newValue = `unique-line-${uniqueCounter.current++}-${index}`;
                valueMap.set(newValue, true);
                return {
                    ...line,
                    value: newValue,
                    label: line.label || `Line ${index + 1}`,
                };
            }

            valueMap.set(originalValue, true);
            return line;
        });
    }, [lines]);

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
                        label="Mã tổ"
                        placeholder="Nhập mã tổ"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />

                    <FieldInput
                        control={form.control}
                        name="name"
                        label="Tên tổ"
                        placeholder="Nhập tên tổ"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />
                </div>

                {/* Line */}
                <div className="grid grid-cols-1 gap-4">
                    <FieldSelect
                        control={form.control}
                        name="lineId"
                        label="Dây chuyền"
                        options={safeLines}
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
                        placeholder="Nhập mô tả tổ"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        rows={3}
                    />
                </div>
            </FormController>
        </AutoForm>
    );
});

TeamForm.displayName = 'TeamForm';

export default TeamForm;
