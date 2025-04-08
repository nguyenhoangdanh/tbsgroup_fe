import {z} from 'zod';

export const loginSchema = z.object({
  username: z.string().nonempty({
    message: 'Tên đăng nhập không được để trống',
  }),
  password: z
    .string()
    .nonempty({
      message: 'Mật khẩu không được để trống',
    })
    .min(6, {
      message: 'Mật khẩu phải chứa ít nhất 6 ký tự',
    }),

  rememberMe: z.boolean().optional().default(false),
});

export const defaultLoginValues = {
  username: '',
  password: '',
  rememberMe: false,
};

export type TLoginSchema = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .regex(/^\S*$/, {message: 'Mật khẩu không được chứa khoảng trắng'}) // 🚀 Thêm điều kiện này
      .optional(),
    confirmPassword: z
      .string({
        message: 'Xác nhận mật khẩu không được để trống',
      })
      .optional(),
    username: z
      .string({
        message: 'Tên đăng nhập không được để trống',
      })
      .optional(),
    employeeId: z
      .string({
        message: 'Mã nhân viên không được để trống',
      })
      .optional(),
    cardId: z
      .string({
        message: 'Mã thẻ không được để trống',
      })
      .optional(),
  })
  .refine(
    data => {
      if (data.password) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Mật khẩu không khớp',
      path: ['confirmPassword'],
    },
  );

export const defaultResetPasswordValues = {
  password: '',
  confirmPassword: '',
  employeeId: '',
  cardId: '',
  username: '',
};

export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
