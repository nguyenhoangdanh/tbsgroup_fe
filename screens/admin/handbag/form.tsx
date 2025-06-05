'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FieldCheckbox } from '@/components/common/fields/FieldCheckbox';
import { FieldInput } from '@/components/common/fields/FieldInput';
import { FieldTextarea } from '@/components/common/fields/FieldTextarea';
import FormActions from '@/components/common/fields/FormActions';
import { Form } from '@/components/ui/form';
import { useDialog } from '@/contexts/DialogProvider';

const handbagSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, { message: 'Mã túi xách phải có ít nhất 2 ký tự' }),
  name: z.string().min(2, { message: 'Tên túi xách phải có ít nhất 2 ký tự' }),
  category: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type HandBagSchema = z.infer<typeof handbagSchema>;

const defaultHandBagValues: HandBagSchema = {
  code: '',
  name: '',
  category: '',
  description: '',
  active: true,
};

interface HandBagFormProps {
  onSubmit?: (data: HandBagSchema) => Promise<void | boolean>;
  refetchData?: () => void;
}
const HandBagForm = memo(({ onSubmit, refetchData }: HandBagFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hideDialog, dialog, isReadOnly } = useDialog();

  const form = useForm<HandBagSchema>({
    resolver: zodResolver(handbagSchema),
    defaultValues: dialog.data
      ? {
          id: dialog.data.id,
          code: dialog.data.code,
          name: dialog.data.name,
          category: dialog.data.category || '',
          description: dialog.data.description || '',
          active: dialog.data.active ?? true,
        }
      : defaultHandBagValues,
  });

  const handleSubmit = useCallback(
    async (values: HandBagSchema) => {
      if (isReadOnly || isSubmitting) return;

      try {
        setIsSubmitting(true);
        console.log('Lưu dữ liệu túi xách:', values);

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
        console.error('Lỗi khi lưu dữ liệu túi xách:', error);
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
            label="Mã túi xách"
            placeholder="Nhập mã túi xách"
            disabled={isSubmitting || isReadOnly}
            required
          />

          <FieldInput
            control={form.control}
            name="name"
            label="Tên túi xách"
            placeholder="Nhập tên túi xách"
            disabled={isSubmitting || isReadOnly}
            required
          />
        </div>

        <FieldInput
          control={form.control}
          name="category"
          label="Danh mục"
          placeholder="Nhập danh mục túi xách (nếu có)"
          disabled={isSubmitting || isReadOnly}
        />

        <FieldTextarea
          control={form.control}
          name="description"
          label="Mô tả"
          placeholder="Nhập mô tả túi xách"
          disabled={isSubmitting || isReadOnly}
          rows={4}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldCheckbox
            control={form.control}
            name="active"
            label="Kích hoạt"
            description="Túi xách được kích hoạt sẽ hiển thị trong hệ thống"
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

HandBagForm.displayName = 'HandBagForm';

export default memo(HandBagForm);
