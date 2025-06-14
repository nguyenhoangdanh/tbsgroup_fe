'use client';

import React, { useState, useCallback, useMemo, useEffect, forwardRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FieldInput, FieldSelect, FieldTextarea, FormController } from '@/components/common/fields';
import { AutoForm } from 'react-table-power';
import { z } from 'zod';

// Define Group schema
const groupSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, 'Mã nhóm phải có ít nhất 2 ký tự'),
  name: z.string().min(2, 'Tên nhóm phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  teamId: z.string().min(1, 'Tổ là bắt buộc'),
});

type TGroupSchema = z.infer<typeof groupSchema>;

const defaultGroupValues: TGroupSchema = {
  code: '',
  name: '',
  description: '',
  teamId: '',
};

// Interface definition
interface GroupFormProps {
    data?: any;
    dialogType?: 'create' | 'edit' | 'view' | 'delete' | 'custom';
    onSubmit?: (data: any) => Promise<boolean> | boolean;
    onClose?: () => void;
    isReadOnly?: boolean;
    loading?: boolean;
    error?: any;
    onFormDirty?: (isDirty: boolean) => void;
    teams?: { value: string; label: string }[];
    leaders?: { value: string; label: string }[];
    delayValidation?: boolean;
    skipInitialValidation?: boolean;
}

const GroupForm = forwardRef<any, GroupFormProps>((props, ref) => {
    const {
        onSubmit,
        isReadOnly = false,
        teams = [],
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

    console.log('[GroupForm] Received data:', data);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if in edit mode
    const isEditMode = dialogType === 'edit' || !!data?.id;

    // Determine if form should be read-only
    const effectiveReadOnly = isReadOnly || dialogType === 'view';

    // Configure validation mode
    const validationMode = 'onTouched';

    // Create default values from data with proper type handling
    const createDefaultValues = () => {
        console.log('[GroupForm] Creating default values from:', data);

        // Default values for create mode
        if (!data) return defaultGroupValues;

        // Values for edit mode - ensure ID is preserved
        return {
            id: data.id,
            code: data.code || '',
            name: data.name || '',
            description: data.description || '',
            teamId: data.teamId || '',
        };
    };

    // Initialize form with react-hook-form
    const form = useForm<TGroupSchema>({
        resolver: zodResolver(groupSchema),
        mode: validationMode,
        defaultValues: createDefaultValues(),
    });

    console.log('[GroupForm] Initialized form with default values:', createDefaultValues());

    // Process form data before submission with additional validation
    const processFormData = React.useCallback((values: TGroupSchema): TGroupSchema => {
        console.log('[GroupForm] Processing form data:', values);

        const processedData = {
            ...values,
            // Preserve ID for edit mode
            ...(isEditMode && data?.id ? { id: data.id } : {}),
            // Trim string values
            code: values.code?.trim(),
            name: values.name?.trim(),
            description: values.description?.trim(),
        };

        console.log('[GroupForm] Processed data with ID:', processedData);
        return processedData;
    }, [isEditMode, data?.id]);

    // Form submission handler
    const handleFormSubmit = async (values: TGroupSchema) => {
        if (!onSubmit) {
            console.error('[GroupForm] No onSubmit handler provided');
            return false;
        }

        try {
            console.log("[GroupForm] Data object:", data);

            // Explicitly trigger validation on all fields when submitting
            const isValid = await form.trigger();
            if (!isValid) {
                console.error("[GroupForm] Validation failed:", form.formState.errors);
                return false;
            }

            setIsSubmitting(true);

            // Process form data and ensure ID is properly handled
            const processed = processFormData(values);

            console.log("[GroupForm] Final processed data:", processed);

            // For edit mode, ensure all required fields are present
            const dataToSubmit = {
                code: processed.code || '',
                name: processed.name || '',
                description: processed.description || '',
                teamId: processed.teamId || '',
                // Include ID for edit mode
                ...(isEditMode && processed.id ? { id: processed.id } : {}),
            };

            console.log("[GroupForm] Data to submit after cleanup:", dataToSubmit);

            // Let the API submission happen and only reset on success
            const result = await onSubmit(dataToSubmit);
            console.log("[GroupForm] Submission result:", result);

            // Only reset form if submission was successful
            if (result === true) {
                form.reset();
                console.log("[GroupForm] Form reset after successful submission");
            } else {
                console.log("[GroupForm] Form not reset due to submission failure");
            }

            return result;
        } catch (err) {
            console.error("[GroupForm] API submission error:", err);

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

    // Clean up teams data to ensure no duplicate keys
    const safeTeams = useMemo(() => {
        const valueMap = new Map();
        const uniqueCounter = { current: 0 };

        return (teams || []).map((team, index) => {
            const originalValue = team.value;

            if (originalValue === undefined || valueMap.has(originalValue)) {
                const newValue = `unique-team-${uniqueCounter.current++}-${index}`;
                valueMap.set(newValue, true);
                return {
                    ...team,
                    value: newValue,
                    label: team.label || `Team ${index + 1}`,
                };
            }

            valueMap.set(originalValue, true);
            return team;
        });
    }, [teams]);

    // Reset form if data changes - but only when dialog opens with new data
    useEffect(() => {
        if (data && dialogType) {
            form.reset(createDefaultValues());
        }
    }, [data, dialogType]);

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
                        label="Mã nhóm"
                        placeholder="Nhập mã nhóm"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />

                    <FieldInput
                        control={form.control}
                        name="name"
                        label="Tên nhóm"
                        placeholder="Nhập tên nhóm"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />
                </div>

                {/* Team */}
                <div className="grid grid-cols-1 gap-4">
                    <FieldSelect
                        control={form.control}
                        name="teamId"
                        label="Tổ"
                        options={safeTeams}
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
                        placeholder="Nhập mô tả nhóm"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        rows={3}
                    />
                </div>
            </FormController>
        </AutoForm>
    );
});

GroupForm.displayName = 'GroupForm';

export default GroupForm;
