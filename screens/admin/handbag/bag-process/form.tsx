'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import DialogFormWrapper from './DialogFormWrapper';

import { FieldInput } from '@/components/common/Form/FieldInput';
import { FieldTextarea } from '@/components/common/Form/FieldTextarea';
import FormActions from '@/components/common/Form/FormAction';
import { Form } from '@/components/ui/form';
import { useDialog } from '@/contexts/DialogProvider';

const bagProcessSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, { message: 'Mã công đoạn phải có ít nhất 2 ký tự' }),
  name: z.string().min(2, { message: 'Tên công đoạn phải có ít nhất 2 ký tự' }),
  description: z.string().optional(),
  processType: z.string().optional(),
  orderIndex: z.coerce.number().int().optional(), // Integer only
  standardOutput: z.coerce
    .number()
    .nonnegative({ message: 'Sản lượng tiêu chuẩn phải là số dương' })
    .refine(n => String(n).split('.')[1]?.length <= 2, {
      message: 'Sản lượng tiêu chuẩn chỉ được phép có tối đa 2 chữ số thập phân',
    })
    .optional(),
  cycleDuration: z.coerce.number().int().optional(), // Integer only
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  teamId: z.string().optional(),
});

type BagProcessSchema = z.infer<typeof bagProcessSchema>;

const defaultBagProcessValues: BagProcessSchema = {
  code: '',
  name: '',
  description: '',
  processType: '',
};

interface BagProcessFormProps {
  onSubmit?: (data: BagProcessSchema) => Promise<void | boolean>;
  refetchData?: () => void;
}

const BagProcessForm = memo(({ onSubmit, refetchData }: BagProcessFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hideDialog, dialog, isReadOnly } = useDialog();

  // Initialize form with default values or data from dialog
  const form = useForm<BagProcessSchema>({
    resolver: zodResolver(bagProcessSchema),
    defaultValues: dialog.data
      ? {
          id: dialog.data.id,
          code: dialog.data.code,
          name: dialog.data.name,
          description: dialog.data.description,
          processType: dialog.data.processType,
          orderIndex: dialog.data.orderIndex,
          standardOutput: dialog.data.standardOutput,
          cycleDuration: dialog.data.cycleDuration,
        }
      : defaultBagProcessValues,
  });

  // Handle form submission
  const handleSubmit = useCallback(
    async (values: BagProcessSchema) => {
      if (isReadOnly || isSubmitting) return;

      try {
        setIsSubmitting(true);
        console.log('Saving process data:', values);

        if (onSubmit) {
          const result = await onSubmit(values);

          //  If result is true, close the dialog
          if (result === true) {
            hideDialog();
          }
        }

        // If refetch data function is provided
        if (refetchData) {
          refetchData();
        }
      } catch (error) {
        console.error('Error saving process data:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isReadOnly, isSubmitting, onSubmit, hideDialog, refetchData],
  );

  return (
    <DialogFormWrapper>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              control={form.control}
              name="code"
              label="Mã công đoạn"
              placeholder="Nhập mã công đoạn"
              disabled={isSubmitting || isReadOnly}
              required
            />

            <FieldInput
              control={form.control}
              name="name"
              label="Tên công đoạn"
              placeholder="Nhập tên công đoạn"
              disabled={isSubmitting || isReadOnly}
              required
            />
          </div>

          <FieldTextarea
            control={form.control}
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả về công đoạn"
            disabled={isSubmitting || isReadOnly}
            rows={4}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              control={form.control}
              name="processType"
              label="Loại công đoạn"
              placeholder="Nhập loại công đoạn"
              disabled={isSubmitting || isReadOnly}
            />

            <FieldInput
              control={form.control}
              name="orderIndex"
              label="Thứ tự"
              placeholder="Nhập thứ tự công đoạn"
              type="number"
              disabled={isSubmitting || isReadOnly}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              control={form.control}
              name="standardOutput"
              label="Sản lượng tiêu chuẩn"
              placeholder="Nhập sản lượng tiêu chuẩn"
              type="number"
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
    </DialogFormWrapper>
  );
});

BagProcessForm.displayName = 'BagProcessForm';
export default memo(BagProcessForm);
