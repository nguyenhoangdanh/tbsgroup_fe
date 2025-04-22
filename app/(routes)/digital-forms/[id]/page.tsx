"use client"

import { useParams } from "next/navigation"
import { DigitalFormProvider } from "@/hooks/digital-form/DigitalFormContext"
import DigitalFormDetail from "@/screens/digital-forms/DigitalFormDetail"

export default function DigitalFormDetailPage() {
    const params = useParams()
    const id = params?.id as string

    return (
        <DigitalFormProvider>
            <DigitalFormDetail id={id} />
        </DigitalFormProvider>
    )
}
