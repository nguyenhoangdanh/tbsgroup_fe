import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toast-kit';
import { z } from 'zod';

import { LineManager, LineManagerDTO } from '@/common/interface/line';
import { UserType } from '@/common/interface/user';
import FormController from '@/components/common/fields/FormController';
import { FieldCombobox } from '@/components/common/fields/FieldCombobox';
import { FieldDatePicker } from '@/components/common/fields/FieldDatePicker';
import { FieldSelect } from '@/components/common/fields/FieldSelect';
import { useDialog } from '@/contexts/DialogProvider';
import { useLine } from '@/hooks/line/LineContext';

const managerSchema = z.object({
  userId: z.string().min(1, { message: 'ID người dùng là bắt buộc' }),
  isPrimary: z.boolean().default(false),
  startDate: z.date({ required_error: 'Ngày bắt đầu là bắt buộc' }),
  endDate: z.date().nullable().optional(),
});

type ManagerFormData = z.infer<typeof managerSchema>;

interface LineManagerFormProps {
  lineId: string;
  factoryId: string;
  users: UserType[];
  manager?: LineManager;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LineManagerForm: React.FC<LineManagerFormProps> = ({
  lineId,
  manager,
  onSuccess,
  onCancel,
  users,
}) => {
  const { mutations, cache } = useLine();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hideDialog } = useDialog();

  const form = useForm<ManagerFormData>({
    resolver: zodResolver(managerSchema),
    defaultValues: manager
      ? {
          userId: manager.userId,
          isPrimary: manager.isPrimary || false,
          startDate: new Date(manager.startDate),
          endDate: manager.endDate ? new Date(manager.endDate) : null,
        }
      : {
          userId: '',
          isPrimary: false,
          startDate: new Date(),
          endDate: null,
        },
  });

  const handleSubmit = useCallback(
    async (data: ManagerFormData) => {
      if (isSubmitting) return false;

      setIsSubmitting(true);

      try {
        //Prepare submission data
        const submitData: LineManagerDTO = {
          ...data,
        };

        // Determine if this is create or update
        if (manager) {
          //Update existing manager
          await mutations.updateManager(lineId, manager.userId, {
            isPrimary: data.isPrimary,
            endDate: data.endDate,
          });

          hideDialog();

          toast({
            title: 'Cập nhật quản lý thành công',
            description: 'Thông tin quản lý đã được cập nhật',
            duration: 3000,
          });
        } else {
          //Create new manager
          await mutations.addManager(lineId, submitData);

          hideDialog();

          toast({
            title: 'Thêm quản lý thành công',
            description: 'Quản lý mới đã được thêm vào dây chuyền',
            duration: 3000,
          });
        }

        // Invalidate managers cache
        try {
          await cache.invalidateManagers(lineId, true);
        } catch (cacheError) {
          console.error('Cache invalidation error:', cacheError);
          //  Handle cache error silently
        }

        //  Call success callback if provided
        onSuccess?.();

        return true;
      } catch (error) {
        // Handle submission errors
        toast({
          title: 'Lỗi',
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định',
          variant: 'error',
          duration: 3000,
        });

        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, lineId, manager, mutations, cache, onSuccess],
  );

  const userOptions = users.map(user => ({
    value: user.id,
    label: `${user.fullName} (${user.username})`,
  }));

  return (
    <FormController methods={form} onSubmit={handleSubmit}>
      {/* Form fields */}
      <FieldCombobox
        control={form.control}
        name="userId"
        label="Người quản lý"
        placeholder="Chọn người quản lý"
        options={userOptions}
        disabled={!!manager || isSubmitting}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldDatePicker
          control={form.control}
          name="startDate"
          label="Ngày bắt đầu"
          placeholder="Chọn ngày bắt đầu"
          disabled={isSubmitting}
          required
        />
        
        <FieldDatePicker
          control={form.control}
          name="endDate"
          label="Ngày kết thúc"
          placeholder="Chọn ngày kết thúc"
          disabled={isSubmitting}
        />
      </div>

      <FieldSelect
        control={form.control}
        name="isPrimary"
        label="Quản lý chính"
        disabled={isSubmitting}
        options={[
          { value: true, label: 'Có' },
          { value: false, label: 'Không' },
        ]}
      />
    </FormController>
  );
};

export default LineManagerForm;
