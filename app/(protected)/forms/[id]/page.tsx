'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { DigitalFormManager } from '@/components/digital-form/digital-form-manager';
import { DigitalFormProvider } from '@/hooks/digital-form';

export default function FormPage() {
  const { id } = useParams<{ id: string }>();

  // Analytics tracking
  useEffect(() => {
    // Track page view
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: 'Form Detail',
          page_path: `/forms/${id}`,
        });
      }
    } catch (e) {
      console.error('Analytics error:', e);
    }
  }, [id]);

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">Không tìm thấy biểu mẫu</h2>
          <p className="text-muted-foreground">ID biểu mẫu không hợp lệ</p>
        </div>
      </div>
    );
  }

  return (
    <DigitalFormProvider initialFormId={id}>
      {/* Loading indicator will be handled by the DigitalFormManager */}
      <DigitalFormManager formId={id} />
    </DigitalFormProvider>
  );
}
