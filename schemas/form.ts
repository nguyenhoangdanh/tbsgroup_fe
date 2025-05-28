import * as zod from 'zod';

export const formSchema = zod.object({
  name: zod.string().min(2, { message: 'Name must be at least 2 characters long' }),
  description: zod.string(),
});

export type TForm = zod.infer<typeof formSchema>;

export const defautFormValues: TForm = {
  name: '',
  description: '',
};
