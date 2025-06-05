'use client';
import React from 'react';
import { FormProvider, SubmitHandler, useForm, FieldValues } from 'react-hook-form';

import SubmitButton from '@/components/SubmitButton';

interface IProps<TForm extends FieldValues> {
  children: React.ReactNode;
  methods: ReturnType<typeof useForm<TForm>>;
  onSubmit: SubmitHandler<TForm>;
  className?: string;
  showSubmitButton?: boolean;
  submitLabel?: string;
  spacing?: 'default' | 'compact' | 'relaxed' | number;
}

export const FormController = <TForm extends FieldValues>({
  methods,
  onSubmit,
  children,
  className = '',
  showSubmitButton = true,
  submitLabel = 'Lưu',
  spacing = 'default',
}: IProps<TForm>) => {
  // Calculate spacing class based on the spacing prop
  const getSpacingClass = () => {
    if (typeof spacing === 'number') {
      return `gap-[${spacing}px]`;
    }
    
    switch (spacing) {
      case 'compact':
        return 'gap-2';
      case 'relaxed':
        return 'gap-6';
      case 'default':
      default:
        return 'gap-4';
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className={`flex flex-col ${getSpacingClass()} ${className}`}>
          {children}
          {showSubmitButton && <SubmitButton name={submitLabel} />}
        </div>
      </form>
    </FormProvider>
  );
};
