'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toast-kit';
import { z } from 'zod';

import { FactoryManager } from '@/common/interface/factory';
import { UserType } from '@/common/interface/user';
import FormController from '@/components/common/fields/FormController';
import { FieldCombobox } from '@/components/common/fields/FieldCombobox';
import { FieldDatePicker } from '@/components/common/fields/FieldDatePicker';
import { FieldCheckbox } from '@/components/common/fields/FieldCheckbox';
import { useDialog } from '@/contexts/DialogProvider';
import { useFactoryMutations } from '@/hooks/factory/useFactoryMutations';

enum ManagerFormMode {
  CREATE = 'create',
  UPDATE = 'update',
}

const managerSchema = z.object({
  userId: z.string().min(1, { message: 'Người dùng không được để trống' }),
  isPrimary: z.boolean().default(false),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
});

type ManagerSchema = z.infer<typeof managerSchema>;

interface ManagerFormProps {
  factoryId?: string;
  users?: UserType[];
  isLoadingUsers?: boolean;
  onSuccess?: () => void;
  mode?: ManagerFormMode;
  existingManager?: FactoryManager;
}

const ManagerForm: React.FC<ManagerFormProps> = ({
  factoryId,
  users = [],
  onSuccess,
  mode = ManagerFormMode.CREATE,
  existingManager,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hideDialog, dialog } = useDialog();
  const queryClient = useQueryClient();

  //Get the mutations with optimistic updates
  const { addManagerMutation, updateManagerMutation } = useFactoryMutations();

  // Factory data from dialog
  const factoryData = dialog.data as { factoryId: string; factoryName: string };

  // Initialize form with default or existing values
  const form = useForm<ManagerSchema>({
    resolver: zodResolver(managerSchema),
    defaultValues:
      mode === ManagerFormMode.CREATE
        ? {
            userId: '',
            isPrimary: false,
            startDate: new Date(),
            endDate: null,
          }
        : existingManager
          ? {
              userId: existingManager.userId,
              isPrimary: existingManager.isPrimary,
              startDate: new Date(existingManager.startDate),
              endDate: existingManager.endDate ? new Date(existingManager.endDate) : null,
            }
          : {
              userId: '',
              isPrimary: false,
              startDate: new Date(),
              endDate: null,
            },
  });

  // Handle form submission with optimized caching
  const handleSubmit = useCallback(
    async (values: ManagerSchema) => {
      if (isSubmitting) return;

      try {
        setIsSubmitting(true);

        //  Use the factory ID from props or from the dialog
        const targetFactoryId = factoryId || factoryData?.factoryId;

        if (!targetFactoryId) {
          throw new Error('Factory ID is required');
        }

        if (mode === ManagerFormMode.CREATE) {
          // Add new manager with optimistic update
          await addManagerMutation.mutateAsync({
            factoryId: targetFactoryId,
            managerDTO: {
              userId: values.userId,
              isPrimary: values.isPrimary,
              startDate: values.startDate,
              endDate: values.endDate || null,
            },
          });

          toast({
            title: 'Thêm quản lý thành công',
            description: 'Quản lý đã được thêm vào nhà máy',
            duration: 3000,
          });
        } else {
          // Update existing manager with optimistic update
          if (!existingManager) {
            throw new Error('Không tìm thấy thông tin quản lý để cập nhật');
          }

          await updateManagerMutation.mutateAsync({
            factoryId: targetFactoryId,
            userId: existingManager.userId,
            data: {
              isPrimary: values.isPrimary,
              endDate: values.endDate || null,
            },
          });

          toast({
            title: 'Cập nhật quản lý thành công',
            description: 'Thông tin quản lý đã được cập nhật',
            duration: 3000,
          });
        }

        // Optimized cache invalidation - we use a more targeted approach
        // Only invalidate the specific factory managers and details
        const factoryCacheKeys = [
          ['factory', targetFactoryId, 'managers'],
          ['factory', targetFactoryId, 'details'],
        ];

        // Use a batch update to reduce React rendering cycles
        await queryClient.invalidateQueries({
          predicate: query => {
            return factoryCacheKeys.some(
              key =>
                query.queryKey.length >= key.length && key.every((k, i) => query.queryKey[i] === k),
            );
          },
        });

        //  Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }

        //  Close dialog
        hideDialog();
      } catch (error) {
        console.error('Error saving manager:', error);
        toast({
          title: mode === ManagerFormMode.CREATE ? 'Lỗi thêm quản lý' : 'Lỗi cập nhật quản lý',
          description:
            error instanceof Error ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại sau',
          variant: 'error',
          duration: 3000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      factoryId,
      factoryData,
      mode,
      existingManager,
      addManagerMutation,
      updateManagerMutation,
      queryClient,
      onSuccess,
      hideDialog,
    ],
  );

  // Create user options for the dropdown
  const userOptions = users.map(user => ({
    value: user.id,
    label: `${user.fullName} (${user.username})`,
  }));

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-medium">
          {mode === ManagerFormMode.CREATE ? 'Thêm quản lý cho nhà máy' : 'Cập nhật quản lý'}
        </h2>
        <p className="text-sm text-muted-foreground">{factoryData?.factoryName || ''}</p>
      </div>
      
      <FormController methods={form} onSubmit={handleSubmit}>
        {mode === ManagerFormMode.CREATE && (
          <FieldCombobox
            control={form.control}
            name="userId"
            label="Người quản lý"
            placeholder="Chọn người quản lý"
            options={userOptions}
            required
            disabled={isSubmitting}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldDatePicker
            control={form.control}
            name="startDate"
            label="Ngày bắt đầu"
            placeholder="Chọn ngày bắt đầu"
            disabled={isSubmitting || mode === ManagerFormMode.UPDATE}
            required
          />

          <FieldDatePicker
            control={form.control}
            name="endDate"
            label="Ngày kết thúc (tùy chọn)"
            placeholder="Chọn ngày kết thúc"
            disabled={isSubmitting}
          />
        </div>

        <FieldCheckbox
          control={form.control}
          name="isPrimary"
          label="Quản lý chính"
          description="Đây là người quản lý chính của nhà máy"
          disabled={isSubmitting}
        />
      </FormController>
    </div>
  );
};

export default Object.assign(ManagerForm, { Mode: ManagerFormMode });
