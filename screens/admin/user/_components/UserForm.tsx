'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback, memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Form } from '@/components/ui/form';
import { useDialog } from '@/contexts/DialogProvider';
import { TUserSchema, userSchema, defaultUserValues } from '@/schemas/user';
import { FieldInput, FieldSelect, FormActions } from '@/components/common/fields';

interface UserFormProps {
  onSubmit?: (data: TUserSchema) => Promise<void | boolean>; // Function to handle form submission
  refetchData?: () => void; // Function to refetch data after submission
  isReadOnly?: boolean; // Flag to make the form read-only
  roles: { value: string; label: string }[]; // List of roles for the dropdown
}

/**
 * User form component for creating and editing users
 * Optimized with memoization to prevent unnecessary renders
 */
const UserForm = memo(({ onSubmit, refetchData, isReadOnly = false, roles }: UserFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hideDialog, dialog } = useDialog();

  // Check if in edit mode
  const isEditMode = !!dialog.data?.id;

  // Determine if form should be read-only
  const effectiveReadOnly = isReadOnly || dialog.type === 'view';

  // Choose the appropriate schema based on edit mode
  const userTypeSchema = dialog.data?.id ? userSchema.omit({ password: true }) : userSchema;

  // Initialize form with values from dialog if available
  const form = useForm<TUserSchema>({
    resolver: zodResolver(userTypeSchema),
    defaultValues: dialog.data
      ? {
          id: dialog.data.id,
          username: dialog.data.username,
          fullName: dialog.data.fullName || '',
          employeeId: dialog.data.employeeId || '',
          cardId: dialog.data.cardId || '',
          roleId: dialog.data.roleId || '',
          status: dialog.data.status || 'PENDING_ACTIVATION',
        }
      : defaultUserValues,
  });

  // // Watch employeeId to auto-set username
  const employeeId = form.watch('employeeId');

  //    Update username when employeeId changes (only in create mode)
  useEffect(() => {
    if ((!isEditMode || !isReadOnly) && employeeId) {
      form.setValue('username', employeeId);
    }
  }, [employeeId, form, isEditMode, isReadOnly]);

  // Handle form submission with loading state
  const handleSubmit = useCallback(
    async (values: TUserSchema) => {
      if (effectiveReadOnly || isSubmitting) return;

      try {
        setIsSubmitting(true);

        if (onSubmit) {
          const result = await onSubmit(values);

          // Close dialog on success
          if (result === true) {
            hideDialog();
          }
        }

        // Refetch data if needed
        if (refetchData) {
          refetchData();
        }
      } catch (error) {
        console.error('Lỗi khi lưu dữ liệu người dùng:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [effectiveReadOnly, isSubmitting, onSubmit, hideDialog, refetchData],
  );

  // Status options
  const statusOptions = [
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'INACTIVE', label: 'Không hoạt động' },
    { value: 'PENDING_ACTIVATION', label: 'Chờ duyệt' },
  ];

  console.log('UserForm rendered errors', roles);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Username field - hidden because it's auto-filled from employeeId */}
        <div className="hidden">
          <FieldInput
            control={form.control}
            name="username"
            label="Tên đăng nhập"
            placeholder="Nhập tên đăng nhập"
            disabled={isSubmitting || effectiveReadOnly || isEditMode}
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
            disabled={isSubmitting || effectiveReadOnly}
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
            disabled={isSubmitting || effectiveReadOnly}
          />

          <FieldInput
            control={form.control}
            name="cardId"
            label="Số CCCD"
            placeholder="Nhập số CCCD"
            disabled={isSubmitting || effectiveReadOnly}
          />
        </div>

        {/* Role and status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldSelect
            control={form.control}
            name="roleId"
            label="Vai trò"
            options={roles}
            disabled={isSubmitting || effectiveReadOnly}
            required
          />

          <FieldSelect
            control={form.control}
            name="status"
            label="Trạng thái"
            options={statusOptions}
            disabled={isSubmitting || effectiveReadOnly}
            required
          />
        </div>

        {/* Form action buttons */}
        <FormActions
          isSubmitting={isSubmitting}
          isReadOnly={effectiveReadOnly}
          isEdit={isEditMode}
        />
      </form>
    </Form>
  );
});

//Add displayName for debugging
UserForm.displayName = 'UserForm';

export default UserForm;
