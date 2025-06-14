'use client';

import { ReactNode } from 'react';

import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { SessionRecovery } from '@/components/auth/SessionRecovery';
import { SessionStatusIndicator } from '@/components/auth/SessionStatusIndicator';
import { PermissionProvider } from '@/hooks/permission/PermissionContext';
import { SharedDataProvider } from '@/hooks/shared/SharedDataContext';

import { AuthSecurityProvider } from './auth/AuthProvider';
import ClientProviders from './ClientProviders';
import QueryProvider from './QueryProvider';
import SagaProviders from './SagaProvider';

interface MainProvidersProps {
    children: ReactNode;
}

export function MainProviders({ children }: MainProvidersProps) {
    return (
        <AuthErrorBoundary>
                <SagaProviders>
                    <QueryProvider>
                        <AuthSecurityProvider>
                            <SessionRecovery
                                maxRetries={3}
                                onRecoveryAttempt={(attempt) => 
                                    console.log(`🔧 Session recovery attempt ${attempt}`)
                                }
                                onRecoverySuccess={() => 
                                    console.log('✅ Session recovered successfully')
                                }
                                onRecoveryFailed={() => 
                                    console.log('❌ Session recovery failed')
                                }
                            >
                                <PermissionProvider>
                                    <ClientProviders>
                                        <SharedDataProvider>
                                            {children}
                                        </SharedDataProvider>
                                            {/* Show session status indicator in development */}
                                            <SessionStatusIndicator 
                                                position="bottom-right"
                                                showInProduction={false}
                                            />
                                        </ClientProviders>
                                </PermissionProvider>
                            </SessionRecovery>
                        </AuthSecurityProvider>
                    </QueryProvider>
                </SagaProviders>
        </AuthErrorBoundary>
    );
}
