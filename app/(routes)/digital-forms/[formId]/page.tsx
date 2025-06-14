'use client';

import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';

import DigitalFormContainer from '@/screens/digital-form/DigitalFormContainer';

import { FormProvider } from '@/contexts/form-context';

export default function DigitalFormPage() {
  const params = useParams();
  const formId = typeof params?.formId === 'string' ? params.formId : undefined;

  return (
    <FormProvider initialFormId={formId}>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Đang tải dữ liệu...</p>
          </div>
        }
      >
        <DigitalFormContainer formId={formId} />
      </Suspense>
    </FormProvider>
  );
}
