'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DigitalFormTable } from '@/screens/digital-form/DigitalFormTable';
import FormProviderWrapper from '@/screens/digital-form/FormProviderWrapper';

export default function DigitalFormsPage() {
    return (
        <FormProviderWrapper>
            <Suspense
                fallback={
                    <div className="flex flex-col items-center justify-center min-h-screen p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p>Đang tải dữ liệu...</p>
                    </div>
                }
            >
                <DigitalFormTable />
            </Suspense>
        </FormProviderWrapper>
    );
}
