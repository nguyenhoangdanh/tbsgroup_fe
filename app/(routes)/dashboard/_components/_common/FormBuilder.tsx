
"use client";
import { SidebarProvider } from '@/components/ui/sidebar';
import React from 'react'
import Builder from './Builder';
import { useBuilder } from '@/context/builder-provider';
import { Loader } from 'lucide-react';

const FormBuilder = () => {

    const { formData, loading } = useBuilder();
    const isPublished = formData?.published;
    if (loading) {
        return (
            <div className="w-full flex h-56 items-center justify-center">
                <Loader size="3rem" className="animate-spin" />
            </div>
        )
    }
    const [isOpen, setIsOpen] = React.useState<boolean>(isPublished ? false : true);
    return (
        <div>
            <SidebarProvider
                open={isOpen}
                onOpenChange={setIsOpen}
                className="h-[calc(100vh_-_64px)]"
                style={{
                    "--sidebar-width": "300px",
                    "--sidebar-height": "40px",
                } as React.CSSProperties}
            >
                <Builder {...{ isOpen }} />
            </SidebarProvider>
        </div>
    )
}

export default FormBuilder