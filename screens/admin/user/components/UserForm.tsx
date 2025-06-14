'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback, useMemo, useEffect, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { AutoForm } from 'react-table-power';

import { FieldInput, FieldSelect, FormController } from '@/components/common/fields';
import { TUserSchema, userSchema, defaultUserValues } from '@/schemas/user';

// Interface definition
interface UserFormProps {
    data?: any;
    dialogType?: 'create' | 'edit' | 'view' | 'delete' | 'custom';
    onSubmit?: (data: any) => Promise<boolean> | boolean;
    onClose?: () => void;
    isReadOnly?: boolean;
    loading?: boolean;
    error?: any;
    onFormDirty?: (isDirty: boolean) => void;
    roles: { value: string; label: string }[];
    factories?: { value: string; label: string }[];
    lines?: { value: string; label: string }[];
    teams?: { value: string; label: string }[];
    groups?: { value: string; label: string }[];
    delayValidation?: boolean;
    skipInitialValidation?: boolean;
}

// Use forwardRef to handle ref properly, but let AutoForm manage the imperative handle
const UserForm = forwardRef<any, UserFormProps>((props, ref) => {
    const {
        onSubmit,
        isReadOnly = false,
        roles = [],
        data,
        dialogType = 'create',
        onClose,
        error,
        onFormDirty,
        loading,
        delayValidation = false,
        skipInitialValidation = false
    } = props;

    // Debug data received
    console.log('[UserForm] Received data:', data);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Check if in edit mode
    const isEditMode = dialogType === 'edit' || !!data?.id;

    // Determine if form should be read-only
    const effectiveReadOnly = isReadOnly || dialogType === 'view';

    // Choose the appropriate schema based on edit mode
    const userTypeSchema = isEditMode ? userSchema.omit({ password: true }) : userSchema;

    // Configure validation mode
    const validationMode = 'onTouched';

    // Create default values from data with proper type handling
    const createDefaultValues = () => {
        console.log('[UserForm] Creating default values from:', data);

        // Default values for create mode
        if (!data) return defaultUserValues;

        // Values for edit mode - ensure ID is preserved
        return {
            id: data.id, // Preserve ID for edit mode
            username: data.username || '',
            fullName: data.fullName || '',
            password: isEditMode ? undefined : (data.password || 'Abcd@123'),
            employeeId: data.employeeId || '',
            cardId: data.cardId || '',
            roleId: data.roleId || '',
            status: data.status || 'PENDING_ACTIVATION',
            factoryId: data.factoryId || '',
            lineId: data.lineId || '',
            teamId: data.teamId || '',
            groupId: data.groupId || '',
            departmentId: data.departmentId || '',
        };
    };

    // Initialize form with react-hook-form
    const form = useForm<TUserSchema>({
        resolver: zodResolver(userTypeSchema),
        mode: validationMode,
        defaultValues: createDefaultValues(),
    });

    console.log('[UserForm] Initialized form with default values:', createDefaultValues());


    // Basic form state tracking for debugging
    useEffect(() => {
        // If form is dirty and has no errors, it's valid
        const hasErrors = Object.keys(form.formState.errors).length > 0;
        const isCurrentlyValid = form.formState.isDirty && !hasErrors;
    }, [form.formState.errors, form.formState.isDirty]);

    // Watch employeeId to auto-set username
    const employeeId = form.watch('employeeId');

    // Process form data before submission with additional validation
    const processFormData = React.useCallback((values: TUserSchema): TUserSchema => {
        console.log('[UserForm] Processing form data:', values);
        setHasInteracted(true);

        const processedData = {
            ...values,
            // Preserve ID for edit mode
            ...(isEditMode && data?.id ? { id: data.id } : {}),
            // Set default password for new users
            ...(isEditMode ? {} : { password: values.password || 'Abcd@123' }),
            // Auto-set username from employee ID for new users
            ...(!isEditMode && values.employeeId ? { username: values.employeeId } : {}),
            // Trim string values
            fullName: values.fullName?.trim(),
            employeeId: values.employeeId?.trim(),
            cardId: values.cardId?.trim(),
        };

        console.log('[UserForm] Processed data with ID:', processedData);
        return processedData;
    }, [isEditMode, data?.id]);

    // Form submission handler with improved validation handling
    const handleFormSubmit = async (values: TUserSchema) => {
        if (!onSubmit) {
            console.error('[UserForm] No onSubmit handler provided');
            return false;
        }

        try {
            console.log("[UserForm] Data object:", data);

            // Explicitly trigger validation on all fields when submitting
            const isValid = await form.trigger();
            if (!isValid) {
                console.error("[UserForm] Validation failed:", form.formState.errors);
                return false;
            }

            setIsSubmitting(true);

            // Process form data and ensure ID is properly handled
            const processed = processFormData(values);

            console.log("[UserForm] Final processed data:", processed);

            // For edit mode, ensure all required fields are present
            const dataToSubmit = {
                // Explicitly ensure these fields are included and not empty
                username: processed.username || processed.employeeId || '',
                fullName: processed.fullName || '',
                employeeId: processed.employeeId || '',
                cardId: processed.cardId || '',
                roleId: processed.roleId || '',
                status: processed.status || 'PENDING_ACTIVATION',
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

            console.log("[UserForm] Data to submit after cleanup:", dataToSubmit);

            // Let the API submission happen and only reset on success
            const result = await onSubmit(dataToSubmit);
            console.log("[UserForm] Submission result:", result);

            // Only reset form if submission was successful
            if (result === true) {
                form.reset();
                console.log("[UserForm] Form reset after successful submission");
            } else {
                console.log("[UserForm] Form not reset due to submission failure");
            }

            return result;
        } catch (err) {
            console.error("[UserForm] API submission error:", err);

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

    // Status options
    const statusOptions = [
        { value: 'ACTIVE', label: 'Hoạt động' },
        { value: 'INACTIVE', label: 'Không hoạt động' },
        { value: 'PENDING_ACTIVATION', label: 'Chờ duyệt' },
    ];

    // Memoize this callback to avoid recreating it on every render
    const handleFormDirtyChange = useCallback((isDirty: boolean) => {
        if (onFormDirty) {
            onFormDirty(isDirty);
        }
    }, [onFormDirty]);

    // Update username when employeeId changes
    React.useEffect(() => {
        if (employeeId && !isEditMode) {
            form.setValue('username', employeeId);
        }
    }, [employeeId, form, isEditMode]);

    // Clean up roles data to ensure no duplicate keys
    const safeRoles = useMemo(() => {
        // Create a map to detect and fix duplicate values
        const valueMap = new Map();
        const uniqueCounter = { current: 0 };

        return (roles || []).map((role, index) => {
            const originalValue = role.value;

            // If value is undefined or already in the map, generate a new unique value
            if (originalValue === undefined || valueMap.has(originalValue)) {
                const newValue = `unique-role-${uniqueCounter.current++}-${index}`;
                valueMap.set(newValue, true);
                return {
                    ...role,
                    value: newValue,
                    label: role.label || `Role ${index + 1}`,
                };
            }

            // Otherwise use the original value
            valueMap.set(originalValue, true);
            return role;
        });
    }, [roles]);

    // Reset form if data changes - but only when dialog opens with new data
    useEffect(() => {
        if (data && dialogType) {
            form.reset(createDefaultValues());
        }
    }, [data, dialogType]); // Add dialogType to dependency to ensure reset happens when dialog opens

    // Report validation state changes to parent
    useEffect(() => {
        const subscription = form.watch(() => {
            // Check form state
            const isDirty = form.formState.isDirty;
            // Notify parent about dirty state
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
                {/* Username field */}
                <div className="hidden">
                    <FieldInput
                        control={form.control}
                        name="username"
                        label="Tên đăng nhập"
                        placeholder="Nhập tên đăng nhập"
                        disabled={isSubmitting || effectiveReadOnly || isEditMode || loading}
                        required
                    />
                </div>

                {/* User name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="fullName"
                        label="Họ và tên"
                        placeholder="Nhập họ và tên"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />
                </div>

                {/* Employee ID and ID card number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="employeeId"
                        label="Mã nhân viên"
                        placeholder="Nhập mã nhân viên"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                    />

                    <FieldInput
                        control={form.control}
                        name="cardId"
                        label="Số CCCD"
                        placeholder="Nhập số CCCD"
                        disabled={isSubmitting || effectiveReadOnly || loading}
                    />
                </div>

                {/* Role and status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldSelect
                        control={form.control}
                        name="roleId"
                        label="Vai trò"
                        options={safeRoles} // Use the sanitized roles array
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />

                    <FieldSelect
                        control={form.control}
                        name="factoryId"
                        label="Nhà máy"
                        options={props.factories || []}
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />

                    <FieldSelect
                        control={form.control}
                        name="lineId"
                        label="Dây chuyền"
                        options={props.lines || []}
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />

                    <FieldSelect
                        control={form.control}
                        name="teamId"
                        label="Tổ"
                        options={props.teams || []}
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />

                    <FieldSelect
                        control={form.control}
                        name="groupId"
                        label="Nhóm"
                        options={props.groups || []}
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />

                    <FieldSelect
                        control={form.control}
                        name="status"
                        label="Trạng thái"
                        options={statusOptions}
                        disabled={isSubmitting || effectiveReadOnly || loading}
                        required
                    />
                </div>
            </FormController>
        </AutoForm>
    );
});

UserForm.displayName = 'UserForm';

export default UserForm;

