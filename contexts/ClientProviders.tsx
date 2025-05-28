'use client';

import { ReactNode } from 'react';

import { RoleProvider } from '@/contexts/RoleProvider';
import { DialogWrapper } from './DialogWrapper';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <RoleProvider>
      <DialogWrapper>
        {children}
      </DialogWrapper>
    </RoleProvider>
  );
}
