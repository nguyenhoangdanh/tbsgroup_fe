// app/providers/FormProviderWrapper.tsx
"use client"

import { ReactNode } from 'react';
import { FormProvider } from '@/contexts/form-context';
import { DigitalFormProvider } from '@/hooks/digital-form';

interface FormProviderWrapperProps {
    children: ReactNode;
}

export default function FormProviderWrapper({ children }: FormProviderWrapperProps) {
    return (
        <DigitalFormProvider>
            <FormProvider>
                {children}
            </FormProvider>
        </DigitalFormProvider>
    );
}