'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { PermissionType } from '@/common/enum';
import { PermissionDTO } from '@/common/types/permission';
import UnifiedFormField from '@/components/common/Form/custom/UnifiedFormField';
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
  console.log("PermissionFormContent rendering with data:", data);
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
    form.handleSubmit(async formData => {
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
    }),
    [form, isEditing, data, updatePermission, createPermission, onSubmit],
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
      <form onSubmit={handleFormSubmit} className="grid gap-4 py-2">
        <UnifiedFormField
          name="code"
          label="Mã quyền"
          control={form.control}
          type="text"
          placeholder="Nhập mã quyền"
          disabled={isEditing}
          required
        />
        <UnifiedFormField
          name="name"
          label="Tên quyền"
          control={form.control}
          type="text"
          placeholder="Nhập tên quyền"
          required
        />
        <UnifiedFormField
          name="description"
          label="Mô tả"
          control={form.control}
          type="textarea"
          placeholder="Nhập mô tả (tùy chọn)"
        />
        <UnifiedFormField
          name="type"
          label="Loại quyền"
          control={form.control}
          type="select"
          options={permissionTypeOptions}
          placeholder="Chọn loại quyền"
        />
        <UnifiedFormField
          name="module"
          label="Module"
          control={form.control}
          type="text"
          placeholder="Nhập module (tùy chọn)"
        />
        <UnifiedFormField
          name="isActive"
          label="Trạng thái"
          control={form.control}
          type="switch"
          description="Kích hoạt hoặc vô hiệu hóa quyền"
        />
        
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : isEditing ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
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
    form.handleSubmit(async data => {
      if (isEditing && initialData?.id) {
        await updatePermission(initialData.id, data as UpdatePermissionFormData);
      } else {
        await createPermission(data as CreatePermissionFormData);
      }
      hideDialog();
    }),
    [form, isEditing, initialData, updatePermission, createPermission, hideDialog],
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
        <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
          <UnifiedFormField
            name="code"
            label="Mã quyền"
            control={form.control}
            type="text"
            placeholder="Nhập mã quyền"
            disabled={isEditing}
            required
          />
          <UnifiedFormField
            name="name"
            label="Tên quyền"
            control={form.control}
            type="text"
            placeholder="Nhập tên quyền"
            required
          />
          <UnifiedFormField
            name="description"
            label="Mô tả"
            control={form.control}
            type="textarea"
            placeholder="Nhập mô tả (tùy chọn)"
          />
          <UnifiedFormField
            name="type"
            label="Loại quyền"
            control={form.control}
            type="select"
            options={permissionTypeOptions}
            placeholder="Chọn loại quyền"
          />
          <UnifiedFormField
            name="module"
            label="Module"
            control={form.control}
            type="text"
            placeholder="Nhập module (tùy chọn)"
          />
          <UnifiedFormField
            name="isActive"
            label="Trạng thái"
            control={form.control}
            type="switch"
            description="Kích hoạt hoặc vô hiệu hóa quyền"
          />
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={hideDialog}>
            Hủy
          </Button>
          <Button type="submit" onClick={handleFormSubmit} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Đang xử lý...' : isEditing ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
