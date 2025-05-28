import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toast-kit';
import { z } from 'zod';

import UnifiedFormField from '@/components/common/Form/custom/UnifiedFormField';
import FormActions from '@/components/common/Form/FormAction';
import { Form } from '@/components/ui/form';
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

  // const isInDialog = !!dialog.open;

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Only show code field in create mode */}
        {!isEditForm && (
          <UnifiedFormField
            control={form.control}
            name="code"
            label="Mã tổ"
            placeholder="Nhập mã tổ"
            disabled={isProcessing}
            required
            type="text"
          />
        )}

        {/* Name field - required in both modes */}
        <UnifiedFormField
          control={form.control}
          name="name"
          label="Tên tổ"
          placeholder="Nhập tên tổ"
          disabled={isProcessing}
          required
          type="text"
        />

        {/* Line ID field - hidden in edit mode */}
        {!isEditForm && (
          <UnifiedFormField
            control={form.control}
            name="lineId"
            label="Dây chuyền"
            placeholder="Chọn dây chuyền"
            disabled={true} // Usually this would be a select, but we're forcing the lineId from props
            required
            type="text"
            description="ID dây chuyền được tự động thiết lập"
          />
        )}

        {/* Description field - optional in both modes */}
        <UnifiedFormField
          control={form.control}
          name="description"
          label="Mô tả"
          placeholder="Nhập mô tả tổ"
          disabled={isProcessing}
          type="textarea"
          rows={3}
        />

        {/* Form actions */}
        <FormActions isSubmitting={isProcessing} isEdit={isEditForm} onCancel={onCancel} />
      </form>
    </Form>
  );
};

export default TeamForm;
