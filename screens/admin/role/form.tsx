'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';

import { FieldCheckbox } from '@/components/common/fields/FieldCheckbox';
import { FieldInput } from '@/components/common/fields/FieldInput';
import { FieldTextarea } from '@/components/common/fields/FieldTextarea';
import FormActions from '@/components/common/fields/FormActions';
import { Form } from '@/components/ui/form';
import { useDialog } from '@/contexts/DialogProvider';
import { TRoleSchema, roleSchema, defaultRoleValues } from '@/schemas/role';
import { useAuthManager } from '@/hooks/auth/useAuthManager';

interface RoleFormProps {
  onSubmit?: (data: TRoleSchema) => Promise<void | boolean>;
  refetchData?: () => void;
}

const RoleForm = memo(({ onSubmit, refetchData }: RoleFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hideDialog, dialog, isReadOnly } = useDialog();
  const { user } = useAuthManager();

  const form = useForm<TRoleSchema>({
    resolver: zodResolver(roleSchema),
    defaultValues: dialog.data
      ? {
          id: dialog.data.id,
          code: dialog.data.code,
          name: dialog.data.name,
          description: dialog.data.description || '',
          isSystem: dialog.data.isSystem || false,
        }
      : defaultRoleValues,
  });

  const handleSubmit = useCallback(
    async (values: TRoleSchema) => {
      if (isReadOnly || isSubmitting) return;

      try {
        setIsSubmitting(true);
        console.log('Lưu dữ liệu vai trò:', values);

        if (onSubmit) {
          const result = await onSubmit(values);

          if (result === true) {
            hideDialog();
          }
        }

        if (refetchData) {
          refetchData();
        }
      } catch (error) {
        console.error('Lỗi khi lưu dữ liệu vai trò:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isReadOnly, isSubmitting, onSubmit, hideDialog, refetchData],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            control={form.control}
            name="code"
            label="Mã vai trò"
            placeholder="Nhập mã vai trò"
            disabled={
              isSubmitting ||
              isReadOnly ||
              dialog.data?.code === 'SUPER_ADMIN' ||
              (user?.role === 'ADMIN' && dialog.data?.code === 'ADMIN')
            }
            required
          />

          <FieldInput
            control={form.control}
            name="name"
            label="Tên vai trò"
            placeholder="Nhập tên vai trò"
            disabled={isSubmitting || isReadOnly}
            required
          />
        </div>

        <FieldTextarea
          control={form.control}
          name="description"
          label="Mô tả"
          placeholder="Nhập mô tả vai trò"
          disabled={isSubmitting || isReadOnly}
          rows={4}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldCheckbox
            control={form.control}
            name="isSystem"
            label="Vai trò hệ thống"
            description="Các vai trò hệ thống chỉ có thể được quản lý bởi quản trị viên"
            disabled={isSubmitting || isReadOnly}
          />
        </div>

        <FormActions
          isSubmitting={isSubmitting}
          isReadOnly={isReadOnly}
          isEdit={!!dialog.data?.id}
        />
      </form>
    </Form>
  );
});

RoleForm.displayName = 'RoleForm';

export default memo(RoleForm);
