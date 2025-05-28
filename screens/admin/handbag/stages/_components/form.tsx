'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'react-toast-kit';

import { createProductionProcess } from '@/actions/admin/handbag';
import FormController from '@/components/common/form/FormController';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDispatchType } from '@/lib/dispatch.utils';
import {
  defautHandbagStageFormValues,
  handbagStageFormSchema,
  THandbagStageForm,
} from '@/schemas/handbag';

interface HandbagStageFormProps {
  action: 'create' | 'update';
}

const HandbagStageForm: React.FC<HandbagStageFormProps> = ({ action }) => {
  const dispatch = useDispatchType();
  const methods = useForm<THandbagStageForm>({
    defaultValues: defautHandbagStageFormValues,
    resolver: zodResolver(handbagStageFormSchema),
  });

  const onSubmit: SubmitHandler<THandbagStageForm> = async data => {
    const rs = await createProductionProcess({
      code: data.code,
      name: data.name,
    });

    if (rs.success) {
      dispatch('FETCH_PO_HANDBAG');
      toast.success({
        title: 'Thành công',
        description: 'Đã tạo quy trình sản xuất',
      });
    } else {
      toast.error({
        title: 'Lỗi',
        description: rs.message || 'Có lỗi xảy ra',
      });
    }
  };
  return (
    <FormController methods={methods} onSubmit={onSubmit}>
      <FormField
        control={methods.control}
        name="code"
        render={({ field }) => (
          <div className="col-span-4">
            <Label htmlFor="code" className="text-right">
              Mã
            </Label>
            <Input id="code" {...field} />
          </div>
        )}
      />
      <FormField
        control={methods.control}
        name="name"
        render={({ field }) => (
          <div className="col-span-4">
            <Label htmlFor="name" className="text-right">
              Tên
            </Label>
            <Input id="name" {...field} />
          </div>
        )}
      />
    </FormController>
  );
};

export default HandbagStageForm;
