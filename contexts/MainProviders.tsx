'use client';

import { ReactNode } from 'react';

import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { AuthSecurityProvider } from './auth/AuthProvider';
import ClientProviders from './ClientProviders';
import { DialogProvider } from './DialogProvider';
import QueryProvider from './QueryProvider';
import SagaProviders from './SagaProvider';
import { ThemeProvider } from './ThemeProvider';
import { PermissionProvider } from '@/hooks/permission/PermissionContext';

interface MainProvidersProps {
    children: ReactNode;
}

export function MainProviders({ children }: MainProvidersProps) {
    return (
        <AuthErrorBoundary>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem={false}
                disableTransitionOnChange
            >
                <SagaProviders>
                    <QueryProvider>
                        <AuthSecurityProvider>
                            <PermissionProvider>
                                <DialogProvider>
                                    <ClientProviders>
                                        {children}
                                    </ClientProviders>
                                </DialogProvider>
                            </PermissionProvider>
                        </AuthSecurityProvider>
                    </QueryProvider>
                </SagaProviders>
            </ThemeProvider>
        </AuthErrorBoundary>
    );
}
