import {z} from 'zod';

export const loginSchema = z.object({
  username: z.string().nonempty({
    message: 'Tên đăng nhập không được để trống',
  }),
  password: z.string().nonempty({
    message: 'Mật khẩu không được để trống',
  }),
});

export const defaultLoginValues = {
  username: '',
  password: '',
};

export type TLoginSchema = z.infer<typeof loginSchema>;


export const resetPasswordSchema = z.object({
  password: z.string().nonempty({
    message: 'Mật khẩu không được để trống',
  }),
  confirmPassword: z.string({
    message: 'Xác nhận mật khẩu không được để trống',
  }).optional(),
  username: z.string({
    message: 'Tên đăng nhập không được để trống',
  }).optional(),
  employeeId: z.string({
    message: 'Mã nhân viên không được để trống',
  }).optional(),
  cardId: z.string({
    message: 'Mã thẻ không được để trống',
  }).optional(),
})
  .refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

export const defaultResetPasswordValues = {
  password: '',
  confirmPassword: '',
  employeeId: '',
  cardId: '',
  username: '',
};

export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
