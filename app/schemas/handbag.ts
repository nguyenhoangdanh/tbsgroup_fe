import * as zod from 'zod';

export const handbagStageFormSchema = zod.object({
    code: zod.string().min(2, { message: 'Name must be at least 2 characters long' }),
    name: zod.string(),
});

export type THandbagStageForm = zod.infer<typeof handbagStageFormSchema>;

export const defautHandbagStageFormValues: THandbagStageForm = {
    name: '',
    code: '',
};