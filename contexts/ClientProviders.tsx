// src/components/ClientProviders.tsx
'use client';

import { PermissionProvider } from '@/hooks/permission/PermissionContext';
import { RoleProvider } from '@/hooks/roles/roleContext';
import { ReactNode } from 'react';

interface ClientProvidersProps {
    children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
    return (
        <RoleProvider>
            <PermissionProvider>
                {children}
            </PermissionProvider>
        </RoleProvider>
    );
}