'use client';

import { ReactNode } from 'react';

import { RoleProvider } from '@/contexts/RoleProvider';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <RoleProvider>
      {children}
    </RoleProvider>
  );
}
