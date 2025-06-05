'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toast-kit';
import { z } from 'zod';

import { BatchCreateBagGroupRateDTO } from '@/apis/group/bagGroupRate/bag-group-rate.api';
import { FieldCombobox } from '@/components/common/fields/FieldCombobox';
import { FieldInput } from '@/components/common/fields/FieldInput';
import { FieldTextarea } from '@/components/common/fields/FieldTextarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDialog } from '@/contexts/DialogProvider';
import { useBagGroupRateContext } from '@/hooks/group/bag-group-rate/BagGroupRateContext';

const groupRateItemSchema = z.object({
  groupId: z.string({ required_error: 'Vui lòng chọn nhóm' }),
  outputRate: z
    .number({ required_error: 'Vui lòng nhập năng suất' })
    .min(0, { message: 'Năng suất không thể là số âm' }),
  notes: z.string().optional(),
});

const batchRateSchema = z.object({
  handBagId: z.string({ required_error: 'Vui lòng chọn mã túi' }),
  groupRates: z.array(groupRateItemSchema).min(1, { message: 'Cần có ít nhất một nhóm' }),
});

export type BatchRateFormValues = z.infer<typeof batchRateSchema>;

const defaultValues: BatchRateFormValues = {
  handBagId: '',
  groupRates: [{ groupId: '', outputRate: 0, notes: '' }],
};

interface BatchRateFormProps {
  onSubmit?: (data: BatchRateFormValues) => Promise<boolean | void>;
  data?: any;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  onClose?: () => void;
}

const BatchRateForm: React.FC<BatchRateFormProps> = ({
  onSubmit: propOnSubmit,
  data,
  isSubmitting: externalIsSubmitting,
  isReadOnly,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hideDialog } = useDialog();
  const { handBags, groups, handleBatchCreateBagGroupRates, safeRefetch } =
    useBagGroupRateContext();

  const combinedIsSubmitting = externalIsSubmitting || isSubmitting;

  const selectedHandBagId = data?.handBagId || null;

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

  const form = useForm<BatchRateFormValues>({
    resolver: zodResolver(batchRateSchema),
    defaultValues: {
      ...defaultValues,
      handBagId: selectedHandBagId || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'groupRates',
  });

  useEffect(() => {
    if (selectedHandBagId && form.getValues().handBagId !== selectedHandBagId) {
      form.setValue('handBagId', String(selectedHandBagId));
    }
  }, [selectedHandBagId, form]);

  const addGroupRate = useCallback(() => {
    append({ groupId: '', outputRate: 0, notes: '' });
  }, [append]);

  const selectedHandBagId2 = form.watch('handBagId');
  const watchedGroupRates = form.watch('groupRates');

  const isGroupSelected = useCallback(
    (groupId: string, currentIndex: number) => {
      return watchedGroupRates.some(
        (rate, idx) => rate.groupId === groupId && idx !== currentIndex,
      );
    },
    [watchedGroupRates],
  );

  const handleSubmit = useCallback(
    async (values: BatchRateFormValues) => {
      if (combinedIsSubmitting || isReadOnly) return;

      try {
        setIsSubmitting(true);

        const validGroupRates = values.groupRates.filter(rate => rate.groupId);

        if (validGroupRates.length === 0) {
          toast({
            title: 'Lỗi',
            description: 'Vui lòng chọn ít nhất một nhóm',
            variant: 'error',
          });
          return;
        }

        const batchData: BatchCreateBagGroupRateDTO = {
          handBagId: values.handBagId,
          groupRates: validGroupRates,
        };

        if (propOnSubmit) {
          const result = await propOnSubmit(values);

          if (result === true) {
            if (onClose) {
              onClose();
            }
            hideDialog();
            safeRefetch();
          }

          return;
        }

        if (handleBatchCreateBagGroupRates) {
          const result = await handleBatchCreateBagGroupRates(batchData);

          if (result) {
            toast.success({
              title: 'Thành công',
              description: 'Đã lưu năng suất cho các nhóm thành công',
            });

            safeRefetch();

            hideDialog();
          }
        }
      } catch (error) {
        console.error('Lỗi khi lưu năng suất túi theo nhóm:', error);
        toast.error({
          title: 'Lỗi',
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lưu dữ liệu',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      combinedIsSubmitting,
      isReadOnly,
      propOnSubmit,
      handleBatchCreateBagGroupRates,
      safeRefetch,
      hideDialog,
      onClose,
    ],
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Túi xách selection */}
          <div className="space-y-4">
            <FieldCombobox
              control={form.control}
              name="handBagId"
              label="Mã túi xách"
              placeholder="Chọn mã túi xách"
              options={handBagOptions}
              disabled={combinedIsSubmitting || !!selectedHandBagId || isReadOnly}
              required
            />

            {selectedHandBagId2 && (
              <div className="flex justify-between items-center mt-6">
                <h3 className="text-lg font-medium">Năng suất theo nhóm</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={addGroupRate}
                  disabled={combinedIsSubmitting || isReadOnly}
                >
                  <Plus className="h-4 w-4 mr-1" /> Thêm nhóm
                </Button>
              </div>
            )}
          </div>

          {/* Scrollable area for group rates when there are many */}
          {selectedHandBagId2 && (
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-4 p-1">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border rounded-md">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Nhóm {index + 1}</h4>
                        {fields.length > 1 && !isReadOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={combinedIsSubmitting}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Group Selection */}
                        <FieldCombobox
                          control={form.control}
                          name={`groupRates.${index}.groupId`}
                          label="Chọn nhóm"
                          placeholder="Chọn nhóm"
                          options={groupOptions.map(option => ({
                            ...option,
                            disabled: isGroupSelected(String(option.value), index),
                          }))}
                          disabled={combinedIsSubmitting || isReadOnly}
                          required
                        />

                        {/* Output Rate */}
                        <FieldInput
                          control={form.control}
                          name={`groupRates.${index}.outputRate`}
                          label="Năng suất (sản phẩm/giờ)"
                          placeholder="Nhập năng suất"
                          type="number"
                          min={0}
                          step={0.1}
                          disabled={
                            combinedIsSubmitting || !watchedGroupRates[index]?.groupId || isReadOnly
                          }
                          required
                        />

                        {/* Notes */}
                        <FieldTextarea
                          control={form.control}
                          name={`groupRates.${index}.notes`}
                          label="Ghi chú"
                          placeholder="Ghi chú về năng suất"
                          disabled={
                            combinedIsSubmitting || !watchedGroupRates[index]?.groupId || isReadOnly
                          }
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Submit button - only show if not readonly */}
          {!isReadOnly && (
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={combinedIsSubmitting || !selectedHandBagId2}>
                {combinedIsSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu năng suất
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default BatchRateForm;
