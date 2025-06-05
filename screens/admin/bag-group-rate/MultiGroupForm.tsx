'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X } from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toast-kit';
import { z } from 'zod';

import { BatchCreateBagGroupRateDTO } from '@/apis/group/bagGroupRate/bag-group-rate.api';
import { FieldCombobox } from '@/components/common/fields/FieldCombobox';
import { FieldInput } from '@/components/common/fields/FieldInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBagGroupRateContext } from '@/hooks/group/bag-group-rate/BagGroupRateContext';

// Schema cho form
const multiGroupFormSchema = z.object({
  handBagId: z.string({ required_error: 'Vui lòng chọn mã túi' }),
  selectedGroups: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất một nhóm'),
  groupRates: z.record(
    z.string(),
    z.object({
      outputRate: z.preprocess(
        val => (val === '' ? undefined : Number(val)),
        z
          .number({ required_error: 'Vui lòng nhập năng suất' })
          .min(0, { message: 'Năng suất không thể là số âm' }),
      ),
      notes: z.string().optional(),
      active: z.boolean().optional().default(true),
    }),
  ),
});

export type MultiGroupFormValues = z.infer<typeof multiGroupFormSchema>;

interface MultiGroupFormProps {
  onSubmit?: (data: BatchCreateBagGroupRateDTO) => Promise<boolean | void | string[]>;
  data?: any;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  onClose?: () => void;
  isEdit?: boolean;
}

const MultiGroupForm: React.FC<MultiGroupFormProps> = ({
  onSubmit: propOnSubmit,
  data,
  isSubmitting: externalIsSubmitting,
  isReadOnly = false,
  onClose,
  isEdit = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    handBags,
    groups,
    bagGroupRates,
    filterByHandBag,
    handleBatchCreateBagGroupRates,
    handleBatchUpdateBagGroupRates,
    safeRefetch,
  } = useBagGroupRateContext();

  // Combine isSubmitting from props and state
  const combinedIsSubmitting = externalIsSubmitting || isSubmitting;

  // Determine selectedHandBagId from data
  const selectedHandBagId = data?.handBagId || (data?.id ? data.handBagId : null);

  // Prepare options for comboboxes
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

  // State to store mapping between groupId and group info
  const [groupInfoMap, setGroupInfoMap] = useState<Record<string, { code: string; name: string }>>(
    {},
  );

  // Initialize form with default values
  const form = useForm<MultiGroupFormValues>({
    resolver: zodResolver(multiGroupFormSchema),
    defaultValues: {
      handBagId: selectedHandBagId || '',
      selectedGroups: [],
      groupRates: {},
    },
  });

  // Get watched values from form
  const handBagId = form.watch('handBagId');
  const selectedGroups = form.watch('selectedGroups');

  // Update group info mapping
  useEffect(() => {
    if (groups && groups.length > 0) {
      const newGroupInfoMap: Record<string, { code: string; name: string }> = {};
      groups.forEach(group => {
        newGroupInfoMap[group.id] = {
          code: group.code,
          name: group.name,
        };
      });
      setGroupInfoMap(newGroupInfoMap);
    }
  }, [groups]);

  // Apply filter for handBagId when editing or viewing
  useEffect(() => {
    if (selectedHandBagId && (isEdit || isReadOnly)) {
      filterByHandBag(String(selectedHandBagId));
    }
  }, [selectedHandBagId, isEdit, isReadOnly, filterByHandBag]);

  // Use filtered bagGroupRates data to populate form
  useEffect(() => {
    if (bagGroupRates && bagGroupRates.length > 0 && (isEdit || isReadOnly)) {
      try {
        // Check if these rates match our selected handBagId
        const relevantRates = bagGroupRates.filter(
          rate => rate.handBagId === selectedHandBagId || rate.handBag?.id === selectedHandBagId,
        );

        if (relevantRates.length > 0) {
          // Transform existing rates to form data
          const selectedGroupIds = relevantRates.map(rate => rate.groupId);
          const groupRatesData: Record<
            string,
            { outputRate: number; notes: string; active: boolean }
          > = {};

          relevantRates.forEach(rate => {
            groupRatesData[rate.groupId] = {
              outputRate: rate.outputRate,
              notes: rate.notes || '',
              active: rate.active,
            };
          });

          form.setValue('selectedGroups', selectedGroupIds);
          form.setValue('groupRates', groupRatesData);
        }
      } catch (error) {
        console.error('Lỗi khi xử lý dữ liệu năng suất:', error);
      }
    }
  }, [bagGroupRates, isEdit, isReadOnly, selectedHandBagId, form]);

  // Update handBagId when selectedHandBagId changes
  useEffect(() => {
    if (selectedHandBagId && form.getValues().handBagId !== selectedHandBagId) {
      form.setValue('handBagId', String(selectedHandBagId));
    }
  }, [selectedHandBagId, form]);

  // Handle group toggle (select/unselect)
  const handleGroupToggle = useCallback(
    (groupId: string, checked: boolean) => {
      if (isReadOnly) return;

      const currentSelectedGroups = form.getValues().selectedGroups;
      const currentGroupRates = form.getValues().groupRates;

      if (checked) {
        // Add group to selected list
        form.setValue('selectedGroups', [...currentSelectedGroups, groupId]);

        // Add default rate data for the new group
        form.setValue('groupRates', {
          ...currentGroupRates,
          [groupId]: {
            outputRate: 0,
            notes: '',
            active: true,
          },
        });
      } else {
        // Remove group from selected list
        form.setValue(
          'selectedGroups',
          currentSelectedGroups.filter(id => id !== groupId),
        );

        // Remove rate data for the group
        const newGroupRates = { ...currentGroupRates };
        delete newGroupRates[groupId];
        form.setValue('groupRates', newGroupRates);
      }
    },
    [form, isReadOnly],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (values: MultiGroupFormValues) => {
      if (combinedIsSubmitting || isReadOnly) return;

      try {
        setIsSubmitting(true);

        // Convert data to API format
        const groupRates = values.selectedGroups.map(groupId => ({
          groupId,
          outputRate: values.groupRates[groupId].outputRate,
          notes: values.groupRates[groupId].notes || '',
          active:
            values.groupRates[groupId].active !== undefined
              ? values.groupRates[groupId].active
              : true,
        }));

        const batchData: BatchCreateBagGroupRateDTO = {
          handBagId: values.handBagId,
          groupRates,
        };

        // Call appropriate function based on edit mode
        if (propOnSubmit) {
          const result = await propOnSubmit(batchData);
          if (result === true) {
            if (onClose) onClose();
            safeRefetch();
          }
          return;
        }

        let result;
        if (isEdit) {
          result = await handleBatchUpdateBagGroupRates(batchData);
          if (result) {
            toast.success({
              title: 'Thành công',
              description: `Đã cập nhật năng suất cho ${result.length} nhóm thành công`,
            });
          }
        } else {
          result = await handleBatchCreateBagGroupRates(batchData);
          if (result) {
            toast.success({
              title: 'Thành công',
              description: `Đã lưu năng suất cho ${result.length} nhóm thành công`,
            });
          }
        }

        if (result) {
          safeRefetch();
          if (onClose) onClose();
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
      handleBatchUpdateBagGroupRates,
      safeRefetch,
      onClose,
      isEdit,
    ],
  );

  // Show loading state
  // if (isLoading) {
  //     return (
  //         <div className="flex items-center justify-center p-8">
  //             <Loader2 className="h-8 w-8 animate-spin mr-2" />
  //             <span>Đang tải dữ liệu...</span>
  //         </div>
  //     );
  // }

  return (
    <div className="max-w-4xl mx-auto max-h-[70vh] overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Bag selection */}
          <div className="space-y-4">
            <FieldCombobox
              control={form.control}
              name="handBagId"
              label="Mã túi xách"
              placeholder="Chọn mã túi xách"
              options={handBagOptions}
              disabled={combinedIsSubmitting || !!selectedHandBagId || isReadOnly || isEdit}
              required
            />
          </div>

          {handBagId && (
            <>
              {/* Group selection section */}
              <Card>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <Label className="text-base font-medium">Chọn nhóm</Label>
                    <p className="text-sm text-gray-500 mb-2">
                      {isReadOnly
                        ? 'Danh sách các nhóm đã thiết lập năng suất'
                        : 'Chọn các nhóm bạn muốn thiết lập năng suất'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {groupOptions.map(group => (
                      <div key={group.value} className="flex items-center space-x-2">
                        <Controller
                          control={form.control}
                          name="selectedGroups"
                          render={({ field }) => (
                            <Checkbox
                              id={`group-${group.value}`}
                              checked={field.value.includes(String(group.value))}
                              onCheckedChange={checked =>
                                handleGroupToggle(String(group.value), checked as boolean)
                              }
                              disabled={combinedIsSubmitting || isReadOnly}
                            />
                          )}
                        />
                        <Label
                          htmlFor={`group-${group.value}`}
                          className={`cursor-pointer text-sm ${isReadOnly ? 'pointer-events-none' : ''}`}
                        >
                          {group.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Display inputs for selected groups */}
              {selectedGroups.length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="mb-4">
                      <Label className="text-base font-medium">
                        {isReadOnly ? 'Thông tin năng suất' : 'Cài đặt năng suất'}
                      </Label>
                      <p className="text-sm text-gray-500 mb-2">
                        {isReadOnly
                          ? 'Xem thông tin năng suất đã thiết lập cho từng nhóm'
                          : 'Thiết lập năng suất cho từng nhóm đã chọn'}
                      </p>
                    </div>

                    <ScrollArea className="max-h-[50vh]">
                      <div className="space-y-4">
                        {selectedGroups.map(groupId => (
                          <Card key={groupId} className="border border-gray-200">
                            <CardContent className="pt-4">
                              <div className="font-medium mb-3">
                                {groupInfoMap[groupId]?.code} - {groupInfoMap[groupId]?.name}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FieldInput
                                  control={form.control}
                                  name={`groupRates.${groupId}.outputRate`}
                                  label="Năng suất (sản phẩm/giờ)"
                                  placeholder="Nhập năng suất"
                                  type="number"
                                  min={0}
                                  step={0.1}
                                  disabled={combinedIsSubmitting || isReadOnly}
                                  required
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Submit buttons - only show if not in read-only mode */}
          {!isReadOnly && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={combinedIsSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>

              <Button
                type="submit"
                disabled={combinedIsSubmitting || !handBagId || selectedGroups.length === 0}
              >
                {combinedIsSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEdit ? 'Cập nhật năng suất' : 'Lưu năng suất'}
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

export default MultiGroupForm;
