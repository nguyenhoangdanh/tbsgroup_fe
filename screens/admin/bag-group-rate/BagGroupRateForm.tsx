'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { BagGroupRateContextBridge } from './BagGroupRateContextBridge';
import UnifiedFormField from '../../../components/common/Form/custom/UnifiedFormField';

import { FieldCombobox } from '@/components/common/Form/FieldCombobox';
import { FieldInput } from '@/components/common/Form/FieldInput';
import { FieldTextarea } from '@/components/common/Form/FieldTextarea';
import FormActions from '@/components/common/Form/FormAction';
import { Form } from '@/components/ui/form';
import { useDialog } from '@/contexts/DialogProvider';
import { useBagGroupRateContext } from '@/hooks/group/bag-group-rate/BagGroupRateContext';

const bagGroupRateSchema = z.object({
  id: z.string().optional(),
  handBagId: z.string({ required_error: 'Vui lòng chọn mã túi' }),
  groupId: z.string({ required_error: 'Vui lòng chọn nhóm' }),
  outputRate: z.preprocess(
    val => (val === '' ? undefined : Number(val)),
    z
      .number({ required_error: 'Vui lòng nhập năng suất' })
      .min(0, { message: 'Năng suất không thể là số âm' }),
  ),
  notes: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BagGroupRateSchema = z.infer<typeof bagGroupRateSchema>;

const defaultValues: BagGroupRateSchema = {
  handBagId: '',
  groupId: '',
  outputRate: 0,
  notes: '',
  active: true,
};

interface BagGroupRateFormProps {
  onSubmit?: (data?: BagGroupRateSchema) => Promise<void | boolean>;
  refetchData?: () => void;
  data?: any;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  onClose?: () => void;
}

const BagGroupRateForm: React.FC<BagGroupRateFormProps> = memo(props => {
  return (
    <BagGroupRateContextBridge>
      <BagGroupRateFormContent {...props} />
    </BagGroupRateContextBridge>
  );
});

const BagGroupRateFormContent = memo(
  ({
    onSubmit,
    refetchData,
    data: dialogData,
    isSubmitting: dialogIsSubmitting = false,
    isReadOnly: dialogIsReadOnly = false,
    onClose,
  }: BagGroupRateFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog, dialog } = useDialog();
    const { handBags, groups } = useBagGroupRateContext();

    const isReadOnly = dialogIsReadOnly || dialog?.isReadOnly || false;
    const currentData = dialogData || dialog?.data || null;
    const isDialogSubmitting = dialogIsSubmitting || isSubmitting;

    const handBagOptions =
      handBags?.map(bag => ({
        value: bag.id,
        label: `${bag.code} - ${bag.name}`,
      })) || [];

    const groupOptions =
      groups?.map(group => ({
        value: group.id,
        label: `${group.code} - ${group.name}`,
      })) || [];

    const form = useForm<BagGroupRateSchema>({
      resolver: zodResolver(bagGroupRateSchema),
      defaultValues: currentData
        ? {
            id: currentData.id,
            handBagId: currentData.handBagId,
            groupId: currentData.groupId,
            outputRate: currentData.outputRate,
            notes: currentData.notes || '',
            active: currentData.active !== undefined ? currentData.active : true,
          }
        : {
            ...defaultValues,
          },
    });

    const handleSubmit = useCallback(
      async (values: BagGroupRateSchema) => {
        if (isReadOnly || isDialogSubmitting) return;

        try {
          setIsSubmitting(true);
          console.log('Đang lưu dữ liệu năng suất:', values);

          if (onSubmit) {
            const result = await onSubmit(values);

            if (result === true) {
              if (onClose) {
                onClose();
              }
              hideDialog();
            }
          }

          if (refetchData) {
            refetchData();
          }
        } catch (error) {
          console.error('Lỗi khi lưu dữ liệu năng suất:', error);
        } finally {
          setIsSubmitting(false);
        }
      },
      [isReadOnly, isDialogSubmitting, onSubmit, hideDialog, refetchData, onClose],
    );

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldCombobox
              control={form.control}
              name="handBagId"
              label="Mã túi xách"
              placeholder="Chọn mã túi xách"
              options={handBagOptions}
              disabled={isDialogSubmitting || isReadOnly || !!currentData?.id}
              required
            />

            <FieldCombobox
              control={form.control}
              name="groupId"
              label="Nhóm"
              placeholder="Chọn nhóm"
              options={groupOptions}
              disabled={isDialogSubmitting || isReadOnly || !!currentData?.id}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              control={form.control}
              name="outputRate"
              label="Năng suất (sản phẩm/giờ)"
              placeholder="Nhập năng suất"
              type="number"
              min={0}
              step={0.1}
              disabled={isDialogSubmitting || isReadOnly}
              required
            />

            <UnifiedFormField
              type="switch"
              control={form.control}
              name="active"
              label="Trạng thái"
              description="Kích hoạt / Vô hiệu hóa năng suất này"
              disabled={isDialogSubmitting || isReadOnly}
            />
          </div>

          <FieldTextarea
            control={form.control}
            name="notes"
            label="Ghi chú"
            placeholder="Nhập ghi chú về năng suất này"
            disabled={isDialogSubmitting || isReadOnly}
            rows={4}
          />

          <FormActions
            isSubmitting={isDialogSubmitting}
            isReadOnly={isReadOnly}
            isEdit={!!currentData?.id}
          />
        </form>
      </Form>
    );
  },
);

BagGroupRateForm.displayName = 'BagGroupRateForm';
BagGroupRateFormContent.displayName = 'BagGroupRateFormContent';

export default BagGroupRateForm;
