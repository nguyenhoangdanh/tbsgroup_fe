// "use client"

// import { FormProvider } from "@/contexts/form-context";
// import DigitalFormContainer from "@/screens/digital-form/Container";

// import { DigitalFormProvider } from "@/hooks/digital-form/DigitalFormContext"
// import { LineProvider } from "@/hooks/line/LineContext"
// import DigitalFormList from "@/screens/digital-forms/DigitalFormList"
// import DigitalFormAppContainer from "@/screens/digital-forms/test/DigitalFormAppContainer"

// export default function DigitalFormsPage() {
//     return (
//         <LineProvider>
//             {/* <DigitalFormProvider syncUrlFilters={true}>
//                 <DigitalFormList />
//             </DigitalFormProvider> */}
//             <DigitalFormAppContainer />
//         </LineProvider>
//     )
// }
// app/digital-forms/page.tsx
// app/digital-forms/page.tsx
"use client"

import { FormProvider } from "@/contexts/form-context";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DigitalFormTable } from "@/screens/digital-form/DigitalFormTable";

export default function DigitalFormsPage() {
    return (
        <FormProvider initialFormId={undefined}>
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-screen p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Đang tải dữ liệu...</p>
                </div>
            }>
                <DigitalFormTable />
            </Suspense>
        </FormProvider>
    )
}