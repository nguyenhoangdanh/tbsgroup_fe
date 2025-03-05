import {z} from 'zod';

export const userSchema = z.object({
  username: z.string(),
  employeeId: z.string(),
  position: z.string(),
  department: z.string(),
  role: z.string(),
  cardId: z.string(),
  fullName: z.string(),
});


export const defaultUserValues = {
  username: '',
  employeeId: '',
  position: '',
  department: '',
  role: '',
  cardId: '',
  fullName: '',
};

export type TUserSchema = z.infer<typeof userSchema>;
