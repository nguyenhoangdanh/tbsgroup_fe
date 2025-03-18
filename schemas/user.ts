import { UserStatusEnum } from '@/common/enum';
import { flatMap } from 'lodash';
import {z} from 'zod';

export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(9, {
    message: 'Tên đăng nhập phải có ít nhất 9 ký tự',
  }),
  employeeId: z.string(),
  role: z.string().uuid(),
  password: z.string().min(6, {
    message: 'Mật khẩu phải có ít  nhất 6 ký tự',
  }),
  status: z.enum([
    UserStatusEnum.PENDING_ACTIVATION,
    UserStatusEnum.ACTIVE,
    UserStatusEnum.INACTIVE,
    UserStatusEnum.BANNED,
    UserStatusEnum.DELETED,
  ]).optional(),
  fullName: z.string().min(2, {
    message: 'Ten phai co it nhat 2 ky tu',
  }),
  cardId: z.string(),
});

export type TUserSchema = z.infer<typeof userSchema>;

export const defaultUserValues: TUserSchema = {
  id: '',
  username: '',
  employeeId: '',
  role: '',
  password: 'Abc@123',
  status: UserStatusEnum.PENDING_ACTIVATION,
  fullName: '',
  cardId: '',
};
