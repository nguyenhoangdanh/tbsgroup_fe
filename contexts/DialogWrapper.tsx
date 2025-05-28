'use client';

import { ReactNode } from 'react';
import GlobalDialog from '@/components/common/table/actions/GlobalDialog';

interface DialogWrapperProps {
  children: ReactNode;
}

export function DialogWrapper({ children }: DialogWrapperProps) {
  return (
    <>
      {children}
      <GlobalDialog />
    </>
  );
}