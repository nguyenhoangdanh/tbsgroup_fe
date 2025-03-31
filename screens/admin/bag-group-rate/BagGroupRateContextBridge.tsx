// BagGroupRateContextBridge.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { BagGroupRateProvider, useBagGroupRateContext } from '@/hooks/group/bag-group-rate/BagGroupRateContext';

interface ContextBridgeProps {
    children: React.ReactNode;
}

/**
 * Enhanced Context Bridge for BagGroupRate components
 * Safely detects if the context is available and wraps with a provider if needed
 */
export const BagGroupRateContextBridge: React.FC<ContextBridgeProps> = ({ children }) => {
    // State to track if we need a provider
    const [needsProvider, setNeedsProvider] = useState<boolean | null>(null);

    // Effect to check if context is available
    useEffect(() => {
        try {
            // Test if we can access the context
            // We immediately wrap this in try/catch to prevent rendering errors
            const ctx = useBagGroupRateContext();
            if (ctx) {
                setNeedsProvider(false);
            }
        } catch (error) {
            // If any error happens, default to providing context
            setNeedsProvider(true);
        }
    }, []);

    // If we haven't determined if we need a provider yet, render nothing
    // This prevents the "flash" of error before we can provide context
    if (needsProvider === null) {
        return null; // Or a loading indicator if preferred
    }

    // If we need a provider, wrap children with one
    if (needsProvider) {
        return <BagGroupRateProvider>{children}</BagGroupRateProvider>;
    }

    // Otherwise, just render children directly
    return <>{children}</>;
};