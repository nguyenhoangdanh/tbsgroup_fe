import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toast-kit';
import { z } from 'zod';

import FormController from '@/components/common/fields/FormController';
import { FieldInput } from '@/components/common/fields/FieldInput';
import { FieldTextarea } from '@/components/common/fields/FieldTextarea';
import { useDialog } from '@/contexts/DialogProvider';
import { useTeam } from '@/hooks/teams/TeamContext';

const createTeamSchema = z.object({
  code: z.string().min(2, { message: 'Mã tổ phải có ít nhất 2 ký tự' }),
  name: z.string().min(3, { message: 'Tên tổ phải có ít nhất 3 ký tự' }),
  lineId: z.string().min(1, { message: 'Dây chuyền không được để trống' }),
  description: z.string().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(3, { message: 'Tên tổ phải có ít nhất 3 ký tự' }),
  description: z.string().optional(),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;
type UpdateTeamFormData = z.infer<typeof updateTeamSchema>;

interface TeamFormProps {
  teamId?: string;
  lineId: string;
  onSuccess?: (teamId: string) => void;
  onCancel?: () => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({ teamId, lineId, onSuccess, onCancel }) => {
  const { createTeam, updateTeam, getTeam, isCreating, isUpdating } = useTeam();
  const [isLoading, setIsLoading] = useState(false);
  const { hideDialog } = useDialog();

  //Determine if this is a create or update form
  const isEditForm = !!teamId;

  // Setup form with appropriate schema based on create/edit mode
  const form = useForm<CreateTeamFormData | UpdateTeamFormData>({
    resolver: zodResolver(isEditForm ? updateTeamSchema : createTeamSchema),
    defaultValues: isEditForm
      ? {
          name: '',
          description: '',
        }
      : {
          code: '',
          name: '',
          lineId,
          description: '',
        },
  });

  // Load team data if in edit mode
  React.useEffect(() => {
    const loadTeamData = async () => {
      if (!teamId) return;

      setIsLoading(true);
      try {
        const teamData = await getTeam(teamId);
        if (teamData) {
          form.reset({
            name: teamData.name,
            description: teamData.description || '',
          });
        }
      } catch (error) {
        console.error('Error loading team data:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải thông tin tổ',
          variant: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isEditForm) {
      loadTeamData();
    }
  }, [teamId, getTeam, form, isEditForm]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: CreateTeamFormData | UpdateTeamFormData) => {
      try {
        if (isEditForm && teamId) {
          // Update existing team
          const updateData = data as UpdateTeamFormData;
          const success = await updateTeam(teamId, updateData);

          if (success) {
            hideDialog();
            toast({
              title: 'Cập nhật tổ thành công',
              description: 'Thông tin tổ đã được cập nhật',
              duration: 2000,
            });
            if (onSuccess) onSuccess(teamId);
          }
        } else {
          // Create new team
          const createData = data as CreateTeamFormData;
          const newTeamId = await createTeam(createData);

          if (newTeamId) {
            hideDialog();
            toast({
              title: 'Tạo tổ thành công',
              description: 'Tổ mới đã được tạo',
              duration: 2000,
            });
            if (onSuccess) onSuccess(newTeamId);
          }
        }
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
          variant: 'error',
        });
      }
    },
    [isEditForm, teamId, createTeam, updateTeam, onSuccess],
  );

  // Determine if form is processing
  const isProcessing = isLoading || isCreating || isUpdating;

  return (
    <FormController methods={form} onSubmit={handleSubmit}>
      {/* Only show code field in create mode */}
      {!isEditForm && (
        <FieldInput
          control={form.control}
          name="code"
          label="Mã tổ"
          placeholder="Nhập mã tổ"
          disabled={isProcessing}
          required
        />
      )}

      {/* Name field - required in both modes */}
      <FieldInput
        control={form.control}
        name="name"
        label="Tên tổ"
        placeholder="Nhập tên tổ"
        disabled={isProcessing}
        required
      />

      {/* Line ID field - hidden in edit mode */}
      {!isEditForm && (
        <FieldInput
          control={form.control}
          name="lineId"
          label="Dây chuyền"
          placeholder="Chọn dây chuyền"
          disabled={true}
          required
          // description="ID dây chuyền được tự động thiết lập"
        />
      )}

      {/* Description field - optional in both modes */}
      <FieldTextarea
        control={form.control}
        name="description"
        label="Mô tả"
        placeholder="Nhập mô tả tổ"
        disabled={isProcessing}
        rows={3}
      />
    </FormController>
  );
};

export default TeamForm;
