import {z} from 'zod';

export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(9, {
    message: 'Ten dang nhap phai co it nhat 9 ky tu',
  }),
  employeeId: z.string(),
  role: z.string(),
  // password: z.string().min(6, {
  //   message: 'Mat khau phai co it nhat 6 ky tu',
  // }),
  status: z.enum(['active', 'inactive', 'pending'], {
    required_error: 'Vui long chon trang thai',
  }),
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
  // password: '',
  status: 'active',
  fullName: '',
  cardId: '',
};
