'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback, memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FieldCheckbox } from '@/components/common/Form/FieldCheckbox';
import { FieldInput } from '@/components/common/Form/FieldInput';
import { FieldSelect } from '@/components/common/Form/FieldSelect';
import { FieldTextarea } from '@/components/common/Form/FieldTextarea';
import FormActions from '@/components/common/Form/FormAction';
import { Form } from '@/components/ui/form';
import { useDialog } from '@/contexts/DialogProvider';

const bagColorSchema = z.object({
  id: z.string().optional(),
  colorCode: z.string().min(3, { message: 'Mã màu phải có ít nhất 3 ký tự' }),
  colorName: z.string().min(2, { message: 'Tên màu phải có ít nhất 2 ký tự' }),
  handBagId: z.string().min(1, { message: 'Vui lòng chọn túi xách' }),
  description: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type BagColorSchema = z.infer<typeof bagColorSchema>;

const defaultBagColorValues: BagColorSchema = {
  colorCode: '#000000',
  colorName: '',
  handBagId: '',
  description: '',
  active: true,
};

interface BagColorFormProps {
  onSubmit?: (data: BagColorSchema) => Promise<void | boolean>;
  refetchData?: () => void;
  handBagId?: string;
  handbags?: { label: string; value: string }[];
}

const BagColorForm = memo(
  ({ onSubmit, refetchData, handBagId, handbags = [] }: BagColorFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog, dialog, isReadOnly } = useDialog();

    // Initialize form with default values or data from dialog
    const form = useForm<BagColorSchema>({
      resolver: zodResolver(bagColorSchema),
      defaultValues: dialog.data
        ? {
            id: dialog.data.id,
            colorCode: dialog.data.colorCode,
            colorName: dialog.data.colorName,
            handBagId: dialog.data.handBagId || handBagId || '',
            description: dialog.data.description || '',
            active: dialog.data.active ?? true,
          }
        : {
            ...defaultBagColorValues,
            handBagId: handBagId || '',
          },
    });

    // Handle form submission
    const handleSubmit = useCallback(
      async (values: BagColorSchema) => {
        if (isReadOnly || isSubmitting) return;

        try {
          setIsSubmitting(true);
          console.log('Saving color data:', values);

          if (onSubmit) {
            const result = await onSubmit(values);

            //  If result is true, close the dialog
            if (result === true) {
              hideDialog();
            }
          }

          //  If refetch data function is provided
          if (refetchData) {
            refetchData();
          }
        } catch (error) {
          console.error('Error saving color data:', error);
        } finally {
          setIsSubmitting(false);
        }
      },
      [isReadOnly, isSubmitting, onSubmit, hideDialog, refetchData],
    );

    // Update form value when handBagId prop changes
    useEffect(() => {
      if (handBagId && !dialog.data) {
        form.setValue('handBagId', handBagId);
      }
    }, [handBagId, form, dialog.data]);

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldSelect
              control={form.control}
              name="handBagId"
              label="Túi xách"
              placeholder="Chọn túi xách"
              options={handbags}
              disabled={isSubmitting || isReadOnly || !!handBagId}
              required
            />

            <FieldInput
              control={form.control}
              name="colorName"
              label="Tên màu"
              placeholder="Nhập tên màu (VD: Đen, Trắng, Đỏ...)"
              disabled={isSubmitting || isReadOnly}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* <FieldColorPicker
                        control={form.control}
                        name="colorCode"
                        label="Mã màu"
                        placeholder="Chọn mã màu"
                        disabled={isSubmitting || isReadOnly}
                        required
                        description="Mã màu theo định dạng HEX"
                    /> */}

            <FieldCheckbox
              control={form.control}
              name="active"
              label="Kích hoạt"
              description="Màu được kích hoạt sẽ hiển thị trong hệ thống"
              disabled={isSubmitting || isReadOnly}
            />
          </div>

          <FieldTextarea
            control={form.control}
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả về màu túi xách"
            disabled={isSubmitting || isReadOnly}
            rows={4}
          />

          <FormActions
            isSubmitting={isSubmitting}
            isReadOnly={isReadOnly}
            isEdit={!!dialog.data?.id}
          />
        </form>
      </Form>
    );
  },
);

BagColorForm.displayName = 'BagColorForm';
export default memo(BagColorForm);
