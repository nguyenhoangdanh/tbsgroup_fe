"use client";

import React from 'react';
import { DialogProvider } from '@/context/DialogProvider';
import GlobalDialog from '../../table/actions/GlobalDialog';

interface RootLayoutWrapperProps {
    children: React.ReactNode;
}

const RootLayoutWrapper: React.FC<RootLayoutWrapperProps> = ({ children }) => {
    return (
        <DialogProvider>
            {children}
            <GlobalDialog />
        </DialogProvider>
    );
};

export default RootLayoutWrapper;