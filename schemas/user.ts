import { z } from 'zod';

import { UserStatusEnum } from '@/common/enum';

export const userSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, {
    message: 'Tên đăng nhập phải có ít nhất 3 ký tự',
  }),
  password: z.string().min(6, {
    message: 'Mật khẩu phải có ít nhất 6 ký tự',
  }).optional(),
  fullName: z.string().min(2, {
    message: 'Họ tên phải có ít nhất 2 ký tự',
  }),
  email: z.string().email('Email không hợp lệ').optional(),
  phone: z.string().optional(),
  employeeId: z.string().min(1, {
    message: 'Mã nhân viên là bắt buộc',
  }),
  cardId: z.string().optional(),
  roleId: z.string({
    required_error: 'Vai trò là bắt buộc',
  }).min(1, {
    message: 'Vui lòng chọn vai trò',
  }),
  status: z.nativeEnum(UserStatusEnum).default(UserStatusEnum.PENDING_ACTIVATION),
  avatar: z.string().optional(),
  factoryId: z.string().optional(),
  lineId: z.string().optional(),
  teamId: z.string().optional(),
  groupId: z.string().optional(),
  positionId: z.string().optional(),
});

// Create a separate schema for edit mode with less strict validation
export const userEditSchema = userSchema.omit({ password: true }).extend({
  username: z.string().optional(),
  employeeId: z.string().optional(),
});

export type TUserSchema = z.infer<typeof userSchema>;

export const defaultUserValues: TUserSchema = {
  id: '',
  username: '',
  employeeId: '',
  roleId: '',
  password: 'Abcd@123',
  status: UserStatusEnum.PENDING_ACTIVATION,
  fullName: '',
  cardId: '',
  factoryId: '',
  lineId: '',
  teamId: '',
  groupId: '',
  positionId: '',
};
