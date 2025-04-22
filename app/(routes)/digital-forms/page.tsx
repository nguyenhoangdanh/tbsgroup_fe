"use client"

import { DigitalFormProvider } from "@/hooks/digital-form/DigitalFormContext"
import { LineProvider } from "@/hooks/line/LineContext"
import DigitalFormList from "@/screens/digital-forms/DigitalFormList"

export default function DigitalFormsPage() {
    return (
        <LineProvider>
            <DigitalFormProvider syncUrlFilters={true}>
                <DigitalFormList />
            </DigitalFormProvider>
        </LineProvider>
    )
}
