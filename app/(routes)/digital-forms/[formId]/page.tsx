// app/digital-forms/[formId]/page.tsx
"use client"

import { FormProvider } from "@/contexts/form-context";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import DigitalFormContainer from "@/screens/digital-form/Container";

export default function DigitalFormDetailsPage() {
    const params = useParams();
    const formId = typeof params?.formId === 'string' ? params.formId : undefined;

    return (
        <FormProvider initialFormId={formId}>
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-screen p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Đang tải dữ liệu...</p>
                </div>
            }>
                <DigitalFormContainer formId={formId} />
            </Suspense>
        </FormProvider>
    )
}