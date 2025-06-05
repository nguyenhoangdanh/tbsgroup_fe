import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toast-kit';
import { z } from 'zod';

import { TeamLeader, TeamLeaderDTO } from '@/common/interface/team';
import { UserType } from '@/common/interface/user';
import FormController from '@/components/common/fields/FormController';
import { FieldCombobox } from '@/components/common/fields/FieldCombobox';
import { FieldDatePicker } from '@/components/common/fields/FieldDatePicker';
import { FieldSelect } from '@/components/common/fields/FieldSelect';
import { useDialog } from '@/contexts/DialogProvider';
import { useTeam } from '@/hooks/teams/TeamContext';

const managerSchema = z.object({
  userId: z.string().min(1, { message: 'ID người dùng là bắt buộc' }),
  isPrimary: z.boolean().default(false),
  startDate: z.date({ required_error: 'Ngày bắt đầu là bắt buộc' }),
  endDate: z.date().nullable().optional(),
});

type ManagerFormData = z.infer<typeof managerSchema>;

interface TeamManagerFormProps {
  teamId: string;
  users: UserType[];
  manager?: TeamLeader;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TeamManagerForm: React.FC<TeamManagerFormProps> = ({
  teamId,
  manager,
  onSuccess,
  onCancel,
  users,
}) => {
  const { addTeamLeader, updateTeamLeader, invalidateTeamCache } = useTeam();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hideDialog } = useDialog();

  // Initialize form with defaults or existing data
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

  //  Form submission handler
  const handleSubmit = useCallback(
    async (data: ManagerFormData) => {
      if (isSubmitting) return false;

      setIsSubmitting(true);

      try {
        //  Determine if this is create or update
        if (manager) {
          //  Update existing manager
          const updateData: {
            isPrimary?: boolean;
            endDate?: Date | null;
          } = {
            isPrimary: data.isPrimary,
            endDate: data.endDate,
          };

          await updateTeamLeader(teamId, manager.userId, updateData);

          hideDialog();

          toast({
            title: 'Cập nhật quản lý thành công',
            description: 'Thông tin quản lý đã được cập nhật',
            duration: 3000,
          });
        } else {
          // Create new manager
          const createData: TeamLeaderDTO = {
            userId: data.userId,
            isPrimary: data.isPrimary,
            startDate: data.startDate,
            endDate: data.endDate,
          };

          await addTeamLeader(teamId, createData);

          hideDialog();

          toast({
            title: 'Thêm quản lý thành công',
            description: 'Quản lý mới đã được thêm vào nhóm',
            duration: 3000,
          });
        }

        //  Invalidate team cache
        try {
          await invalidateTeamCache(teamId, true);
        } catch (cacheError) {
          console.error('Cache invalidation error:', cacheError);
          //   Handle cache error silently
        }

        // Call success callback if provided
        onSuccess?.();

        return true;
      } catch (error) {
        //  Handle submission errors
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
    [
      isSubmitting,
      teamId,
      manager,
      addTeamLeader,
      updateTeamLeader,
      invalidateTeamCache,
      hideDialog,
      onSuccess,
    ],
  );

  const userOptions = users.map(user => ({
    value: user.id,
    label: user.fullName || user.email || user.id
  }));

  return (
    <FormController methods={form} onSubmit={handleSubmit}>
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
          placeholder="Chọn ngày"
          disabled={isSubmitting}
          required
        />
        
        <FieldDatePicker
          control={form.control}
          name="endDate"
          label="Ngày kết thúc"
          placeholder="Chọn ngày"
          disabled={isSubmitting}
        />
      </div>

      <FieldSelect
        control={form.control}
        name="isPrimary"
        label="Trưởng nhóm"
        disabled={isSubmitting}
        options={[
          { value: true, label: 'Có' },
          { value: false, label: 'Không' },
        ]}
      />
    </FormController>
  );
};

export default TeamManagerForm;
