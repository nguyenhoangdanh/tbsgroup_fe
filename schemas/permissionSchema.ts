import { z } from 'zod';

import { PermissionType } from '@/common/enum';

export const createPermissionSchema = z.object({
  code: z.string().min(1, 'Mã quyền là bắt buộc').max(50, 'Mã quyền không được vượt quá 50 ký tự'),
  name: z
    .string()
    .min(1, 'Tên quyền là bắt buộc')
    .max(100, 'Tên quyền không được vượt quá 100 ký tự'),
  description: z.string().max(500, 'Mô tả không được vượt quá 500 ký tự').optional(),
  type: z
    .nativeEnum(PermissionType, {
      errorMap: () => ({ message: 'Loại quyền không hợp lệ' }),
    })
    .default(PermissionType.PAGE_ACCESS),
  module: z.string().max(50, 'Module không được vượt quá 50 ký tự').optional(),
  isActive: z.boolean().default(true),
});

export const updatePermissionSchema = createPermissionSchema.partial().omit({ code: true }); // code không thể thay đổi khi update

export type CreatePermissionFormData = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionFormData = z.infer<typeof updatePermissionSchema>;
