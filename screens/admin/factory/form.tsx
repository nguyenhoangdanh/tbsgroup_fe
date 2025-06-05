'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FactoryWithDetails } from '@/common/interface/factory';
import { FieldInput } from '@/components/common/fields/FieldInput';
import { FieldTextarea } from '@/components/common/fields/FieldTextarea';
import FormActions from '@/components/common/fields/FormActions';
import { Form } from '@/components/ui/form';
import { useDialog } from '@/contexts/DialogProvider';

const factorySchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, { message: 'Mã nhà máy phải có ít nhất 2 ký tự' }),
  name: z.string().min(3, { message: 'Tên nhà máy phải có ít nhất 3 ký tự' }),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  managingDepartmentId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type FactorySchema = z.infer<typeof factorySchema>;

const defaultFactoryValues: FactorySchema = {
  code: '',
  name: '',
  description: '',
  address: '',
  departmentId: null,
  managingDepartmentId: null,
};

interface FactoryFormProps {
  onSubmit?: (data: FactorySchema) => Promise<void | boolean>;
  refetchData?: () => void;
  departments?: { id: string; name: string; type: string }[];
}

const FactoryForm = memo(({ onSubmit, refetchData }: FactoryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hideDialog, dialog, isReadOnly } = useDialog();
  // const { user } = useAuthManager();

  // const headOffices = departments.filter(dept => dept.type === 'HEAD_OFFICE');
  // const factoryOffices = departments.filter(dept => dept.type === 'FACTORY_OFFICE');

  //Initialize form with default values or data from dialog
  const form = useForm<FactorySchema>({
    resolver: zodResolver(factorySchema),
    defaultValues: dialog.data
      ? {
          id: dialog.data.id,
          code: dialog.data.code,
          name: dialog.data.name,
          description: dialog.data.description || '',
          address: dialog.data.address || '',
          departmentId: dialog.data.departmentId || null,
          managingDepartmentId: dialog.data.managingDepartmentId || null,
        }
      : defaultFactoryValues,
  });

  // Handle form submission
  const handleSubmit = useCallback(
    async (values: FactorySchema) => {
      if (isReadOnly || isSubmitting) return;

      try {
        setIsSubmitting(true);
        console.log('Saving factory data:', values);

        if (onSubmit) {
          const result = await onSubmit(values);

          // If result is true, close dialog
          if (result === true) {
            hideDialog();
          }
        }

        //  Refetch data if needed
        if (refetchData) {
          refetchData();
        }
      } catch (error) {
        console.error('Error saving factory data:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isReadOnly, isSubmitting, onSubmit, hideDialog, refetchData],
  );

  // FactoryWithDetails for the details tab in view mode
  const factoryDetails = dialog.data as FactoryWithDetails;
  const hasDetailData = factoryDetails && factoryDetails.managers;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            control={form.control}
            name="code"
            label="Mã nhà máy"
            placeholder="Nhập mã nhà máy"
            disabled={isSubmitting || isReadOnly || !!dialog.data?.id}
            required
          />

          <FieldInput
            control={form.control}
            name="name"
            label="Tên nhà máy"
            placeholder="Nhập tên nhà máy"
            disabled={isSubmitting || isReadOnly}
            required
          />
        </div>

        <FieldInput
          control={form.control}
          name="address"
          label="Địa chỉ"
          placeholder="Nhập địa chỉ nhà máy"
          disabled={isSubmitting || isReadOnly}
        />

        <FieldTextarea
          control={form.control}
          name="description"
          label="Mô tả"
          placeholder="Nhập mô tả nhà máy"
          disabled={isSubmitting || isReadOnly}
          rows={4}
        />

        {/* Department selectors would go here - implement if you have department data */}
        {/* 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldSelect
                        control={form.control}
                        name="departmentId"
                        label="Phòng ban quản lý (HEAD_OFFICE)"
                        placeholder="Chọn phòng ban"
                        disabled={isSubmitting || isReadOnly}
                        options={headOffices.map(dept => ({
                            value: dept.id,
                            label: dept.name
                        }))}
                    />
                    
                    <FieldSelect
                        control={form.control}
                        name="managingDepartmentId"
                        label="Phòng ban tại nhà máy (FACTORY_OFFICE)"
                        placeholder="Chọn phòng ban"
                        disabled={isSubmitting || isReadOnly}
                        options={factoryOffices.map(dept => ({
                            value: dept.id,
                            label: dept.name
                        }))}
                    />
                </div>
                */}

        {/* Managers list in view mode */}
        {isReadOnly &&
          hasDetailData &&
          factoryDetails.managers &&
          factoryDetails.managers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Quản lý nhà máy</h3>
              <div className="bg-muted/50 rounded-md p-4">
                <ul className="space-y-2">
                  {factoryDetails.managers.map(manager => (
                    <li key={manager.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {manager.user?.avatar && (
                          <div className="h-8 w-8 rounded-full overflow-hidden">
                            <img
                              src={manager.user.avatar}
                              alt={manager.user.fullName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <span>{manager.user?.fullName || manager.userId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {manager.isPrimary && (
                          <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                            Quản lý chính
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          Từ: {new Date(manager.startDate).toLocaleDateString()}
                          {manager.endDate &&
                            ` đến: ${new Date(manager.endDate).toLocaleDateString()}`}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        <FormActions
          isSubmitting={isSubmitting}
          isReadOnly={isReadOnly}
          isEdit={!!dialog.data?.id}
        />
      </form>
    </Form>
  );
});

FactoryForm.displayName = 'FactoryForm';

export default memo(FactoryForm);
