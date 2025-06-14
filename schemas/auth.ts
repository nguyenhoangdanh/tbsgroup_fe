import { z } from 'zod';

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
      .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
      .regex(/^\S*$/, { message: 'Mật khẩu không được chứa khoảng trắng' })
      .optional(),
    confirmPassword: z
      .string()
      .optional(),
    username: z
      .string()
      .optional(),
    employeeId: z
      .string()
      .optional(),
    cardId: z
      .string()
      .optional(),
    resetToken: z
      .string()
      .optional(),
  })
  .refine(
    data => {
      // Validate credentials: must have username OR (cardId + employeeId)
      const hasUsername = Boolean(data.username);
      const hasCardInfo = Boolean(data.cardId && data.employeeId);
      const hasResetToken = Boolean(data.resetToken);
      
      return hasUsername || hasCardInfo || hasResetToken;
    },
    {
      message: 'Vui lòng cung cấp username hoặc cả cardId và employeeId',
      path: ['username'],
    },
  )
  .refine(
    data => {
      // If password is provided, confirmPassword must match
      if (data.password && data.confirmPassword) {
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
  resetToken: '',
};

export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
