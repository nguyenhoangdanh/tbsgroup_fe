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
  confirmPassword: z.string().nonempty({
    message: 'Xác nhận mật khẩu không được để trống',
  }),
});

export const defaultResetPasswordValues = {
  password: '',
  confirmPassword: '',
};

export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
