'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePermissionFormData, createPermissionSchema, UpdatePermissionFormData, updatePermissionSchema } from '@/schemas/permissionSchema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import UnifiedFormField from '@/components/common/Form/custom/UnifiedFormField';
import { PermissionType } from '@/common/enum';
import { PermissionDTO } from '@/common/types/permission';
import { useDialog } from '@/contexts/DialogProvider';
import { usePermissionContext } from '@/hooks/permission/PermissionContext';

interface PermissionFormProps {
    isOpen: boolean;
    initialData?: PermissionDTO;
    isEditing: boolean;
}

export function PermissionForm({
    isOpen,
    initialData,
    isEditing,
}: PermissionFormProps) {
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

    const handleFormSubmit = useCallback(form.handleSubmit(async (data) => {
        if (isEditing && initialData?.id) {
            await updatePermission(initialData.id, data as UpdatePermissionFormData);
        } else {
            await createPermission(data as CreatePermissionFormData);
        }
        hideDialog();
    }), [form, isEditing, initialData, updatePermission, createPermission, hideDialog]);

    const permissionTypeOptions = useMemo(() => [
        { value: PermissionType.PAGE_ACCESS, label: 'Quyền trang' },
        { value: PermissionType.FEATURE_ACCESS, label: 'Quyền tính năng' },
        { value: PermissionType.DATA_ACCESS, label: 'Quyền dữ liệu' },
    ], []);

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