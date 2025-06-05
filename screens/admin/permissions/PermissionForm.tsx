'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { PermissionType } from '@/common/enum';
import { PermissionDTO } from '@/common/types/permission';
import FormController from '@/components/common/fields/FormController';
import { FieldInput } from '@/components/common/fields/FieldInput';
import { FieldSelect } from '@/components/common/fields/FieldSelect';
import { FieldTextarea } from '@/components/common/fields/FieldTextarea';
import { FieldCheckbox } from '@/components/common/fields/FieldCheckbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useDialog, DialogChildrenProps, DialogType } from '@/contexts/DialogProvider';
import { usePermissionContext } from '@/hooks/permission/PermissionContext';
import {
  CreatePermissionFormData,
  createPermissionSchema,
  UpdatePermissionFormData,
  updatePermissionSchema,
} from '@/schemas/permissionSchema';

interface PermissionFormProps {
  isOpen: boolean;
  initialData?: PermissionDTO;
  isEditing: boolean;
}

// Form content component without Dialog wrapper
export function PermissionFormContent({ 
  data, 
  isSubmitting, 
  onSubmit, 
  onClose, 
  type 
}: DialogChildrenProps<PermissionDTO>) {
  const { createPermission, updatePermission } = usePermissionContext();
  const isEditing = type === DialogType.EDIT || !!data?.id;
  
  const form = useForm<CreatePermissionFormData | UpdatePermissionFormData>({
    resolver: zodResolver(isEditing ? updatePermissionSchema : createPermissionSchema),
    defaultValues: data
      ? {
          code: data.code || '',
          name: data.name || '',
          description: data.description || '',
          type: data.type || PermissionType.PAGE_ACCESS,
          module: data.module || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
        }
      : {
          code: '',
          name: '',
          description: '',
          type: PermissionType.PAGE_ACCESS,
          module: '',
          isActive: true,
        },
  });

  useEffect(() => {
    if (data && isEditing) {
      form.reset({
        code: data.code || '',
        name: data.name || '',
        description: data.description || '',
        type: data.type || PermissionType.PAGE_ACCESS,
        module: data.module || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
      });
    }
  }, [data, isEditing, form]);

  const handleFormSubmit = useCallback(
    async (formData: CreatePermissionFormData | UpdatePermissionFormData) => {
      try {
        if (isEditing && data?.id) {
          await updatePermission(data.id, formData as UpdatePermissionFormData);
        } else {
          await createPermission(formData as CreatePermissionFormData);
        }
        
        // Use the onSubmit from dialog props to properly handle dialog closing
        if (onSubmit) {
          await onSubmit(formData);
        }
        return true;
      } catch (error) {
        console.error('Error submitting permission form:', error);
        throw error;
      }
    },
    [isEditing, data, updatePermission, createPermission, onSubmit],
  );

  const permissionTypeOptions = useMemo(
    () => [
      { value: PermissionType.PAGE_ACCESS, label: 'Quyền trang' },
      { value: PermissionType.FEATURE_ACCESS, label: 'Quyền tính năng' },
      { value: PermissionType.DATA_ACCESS, label: 'Quyền dữ liệu' },
    ],
    [],
  );

  return (
    <div className="space-y-4 p-2">
      <FormController methods={form} onSubmit={handleFormSubmit}>
        <FieldInput
          control={form.control}
          name="code"
          label="Mã quyền"
          placeholder="Nhập mã quyền"
          disabled={isEditing || isSubmitting}
          required
        />
        
        <FieldInput
          control={form.control}
          name="name"
          label="Tên quyền"
          placeholder="Nhập tên quyền"
          disabled={isSubmitting}
          required
        />
        
        <FieldTextarea
          control={form.control}
          name="description"
          label="Mô tả"
          placeholder="Nhập mô tả (tùy chọn)"
          disabled={isSubmitting}
          rows={3}
        />
        
        <FieldSelect
          control={form.control}
          name="type"
          label="Loại quyền"
          placeholder="Chọn loại quyền"
          options={permissionTypeOptions}
          disabled={isSubmitting}
        />
        
        <FieldInput
          control={form.control}
          name="module"
          label="Module"
          placeholder="Nhập module (tùy chọn)"
          disabled={isSubmitting}
        />
        
        <FieldCheckbox
          control={form.control}
          name="isActive"
          label="Trạng thái"
          description="Kích hoạt hoặc vô hiệu hóa quyền"
          disabled={isSubmitting}
        />
      </FormController>
    </div>
  );
}

// Keep the original component for backward compatibility
export function PermissionForm({ isOpen, initialData, isEditing }: PermissionFormProps) {
  const { createPermission, updatePermission } = usePermissionContext();
  const { hideDialog } = useDialog();

  const form = useForm<CreatePermissionFormData | UpdatePermissionFormData>({
    resolver: zodResolver(isEditing ? updatePermissionSchema : createPermissionSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          description: initialData.description || '',
          type: initialData.type,
          module: initialData.module || '',
          isActive: initialData.isActive,
        }
      : {
          code: '',
          name: '',
          description: '',
          type: PermissionType.PAGE_ACCESS,
          module: '',
          isActive: true,
        },
  });

  useEffect(() => {
    if (initialData && isEditing) {
      form.reset({
        code: initialData.code,
        name: initialData.name,
        description: initialData.description || '',
        type: initialData.type,
        module: initialData.module || '',
        isActive: initialData.isActive,
      });
    } else {
      form.reset({
        code: '',
        name: '',
        description: '',
        type: PermissionType.PAGE_ACCESS,
        module: '',
        isActive: true,
      });
    }
  }, [initialData, isEditing, form]);

  const handleFormSubmit = useCallback(
    async (data: CreatePermissionFormData | UpdatePermissionFormData) => {
      if (isEditing && initialData?.id) {
        await updatePermission(initialData.id, data as UpdatePermissionFormData);
      } else {
        await createPermission(data as CreatePermissionFormData);
      }
      hideDialog();
    },
    [isEditing, initialData, updatePermission, createPermission, hideDialog],
  );

  const permissionTypeOptions = useMemo(
    () => [
      { value: PermissionType.PAGE_ACCESS, label: 'Quyền trang' },
      { value: PermissionType.FEATURE_ACCESS, label: 'Quyền tính năng' },
      { value: PermissionType.DATA_ACCESS, label: 'Quyền dữ liệu' },
    ],
    [],
  );

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && hideDialog()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Cập nhật quyền' : 'Tạo quyền mới'}</DialogTitle>
        </DialogHeader>
        <FormController methods={form} onSubmit={handleFormSubmit}>
          <FieldInput
            control={form.control}
            name="code"
            label="Mã quyền"
            placeholder="Nhập mã quyền" 
            disabled={isEditing || form.formState.isSubmitting}
            required
          />
          
          <FieldInput
            control={form.control}
            name="name"
            label="Tên quyền"
            placeholder="Nhập tên quyền"
            disabled={form.formState.isSubmitting}
            required
          />
          
          <FieldTextarea
            control={form.control}
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả (tùy chọn)"
            rows={3}
            disabled={form.formState.isSubmitting}
          />
          
          <FieldSelect
            control={form.control}
            name="type"
            label="Loại quyền"
            placeholder="Chọn loại quyền"
            options={permissionTypeOptions}
            disabled={form.formState.isSubmitting}
          />
          
          <FieldInput
            control={form.control}
            name="module"
            label="Module"
            placeholder="Nhập module (tùy chọn)"
            disabled={form.formState.isSubmitting}
          />
          
          <FieldCheckbox
            control={form.control}
            name="isActive"
            label="Trạng thái"
            description="Kích hoạt hoặc vô hiệu hóa quyền"
            disabled={form.formState.isSubmitting}
          />
        </FormController>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={hideDialog}>
            Hủy
          </Button>
          <Button type="submit" onClick={form.handleSubmit(handleFormSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Đang xử lý...' : isEditing ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
