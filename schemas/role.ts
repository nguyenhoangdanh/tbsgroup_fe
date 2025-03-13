import { z } from 'zod';

export const roleSchema = z.object({
    id: z.string(),
    code: z.string().min(1, 'Mã vai trò không được để trống'),
    name: z.string().min(1, 'Tên vai trò không được để trống'),
    description: z.string().nullable().optional(),
    level: z.number().int().optional().default(0),
    isSystem: z.boolean().optional().default(false),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
  
export type TRoleSchema = z.infer<typeof roleSchema>;
  
export const defaultRoleValues: TRoleSchema = {
    id: '',
    code: '',
    name: '',
    description: '',
    level: 0,
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };