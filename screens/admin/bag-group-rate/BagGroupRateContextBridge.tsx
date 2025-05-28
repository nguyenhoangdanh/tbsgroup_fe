'use client';

import React, { useEffect, useState } from 'react';

import {
  BagGroupRateProvider,
  useBagGroupRateContext,
} from '@/hooks/group/bag-group-rate/BagGroupRateContext';

interface ContextBridgeProps {
  children: React.ReactNode;
}

/**
 * Enhanced Context Bridge for BagGroupRate components
 * Safely detects if the context is available and wraps with a provider if needed
 */
export const BagGroupRateContextBridge: React.FC<ContextBridgeProps> = ({ children }) => {
  const [needsProvider, setNeedsProvider] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const ctx = useBagGroupRateContext();
      if (ctx) {
        setNeedsProvider(false);
      }
    } catch (error) {
      console.log('BagGroupRateContextBridge: Context not found, providing context', error);
      setNeedsProvider(true);
    }
  }, []);

  if (needsProvider === null) {
    return null; // Or a loading indicator if preferred
  }

  if (needsProvider) {
    return <BagGroupRateProvider>{children}</BagGroupRateProvider>;
  }

  return <>{children}</>;
};
