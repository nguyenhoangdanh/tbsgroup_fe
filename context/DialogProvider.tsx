
'use client';
import React, { createContext, useState } from 'react';

type DialogContextType = {
    dialog: {
        openDelete?: boolean;
        openEdit?: boolean;
        openCreate?: boolean;
    };
    setDialog: React.Dispatch<React.SetStateAction<{
        openDelete?: boolean;
        openEdit?: boolean;
        openCreate?: boolean;
    }>>;
}

export const DialogContext = createContext<DialogContextType | null>(null);


export default function DialogProvider({ children }: { children: React.ReactNode }) {
    const [dialog, setDialog] = useState<{
        openDelete?: boolean;
        openEdit?: boolean;
        openCreate?: boolean;
    }>({
        openDelete: false,
        openEdit: false,
        openCreate: false,
    });

    return (
        <DialogContext.Provider value={{ dialog, setDialog }}>
            {children}
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const context = React.useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within DialogProvider');
    }
    return context;
}