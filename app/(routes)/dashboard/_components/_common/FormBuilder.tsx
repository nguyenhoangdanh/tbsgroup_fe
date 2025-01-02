
"use client";
import { SidebarProvider } from '@/components/ui/sidebar';
import React from 'react'
import Builder from './Builder';

const FormBuilder = () => {
    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    return (
        <div>
            <SidebarProvider
                open={isOpen}
                onOpenChange={setIsOpen}
                className="h-[calc(100vh_-_65px)]"
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