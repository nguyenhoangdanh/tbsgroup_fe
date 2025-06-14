'use client';

import { ReactNode } from 'react';

import { DigitalFormProvider } from '@/hooks/digital-form';

import { FormProvider } from '@/contexts/form-context';

interface FormProviderWrapperProps {
  children: ReactNode;
}

export default function FormProviderWrapper({ children }: FormProviderWrapperProps) {
  return (
    <DigitalFormProvider>
      <FormProvider>{children}</FormProvider>
    </DigitalFormProvider>
  );
}
