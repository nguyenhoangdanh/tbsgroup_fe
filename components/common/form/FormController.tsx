'use client';
import React from 'react';
import { FormProvider, SubmitHandler, useForm, FieldValues } from 'react-hook-form';

import SubmitButton from '@/components/SubmitButton';

interface IProps<TForm extends FieldValues> {
  children: React.ReactNode;
  methods: ReturnType<typeof useForm<TForm>>;
  onSubmit: SubmitHandler<TForm>;
}

const FormController = <TForm extends FieldValues>({
  methods,
  onSubmit,
  children,
}: IProps<TForm>) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          {children}
          <SubmitButton name="Lưu" />
        </div>
      </form>
    </FormProvider>
  );
};

export default FormController;
