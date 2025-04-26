"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { initializeDigitalFormContext } from "./useDigitalForm";

// Create digital form context with type definitions
type DigitalFormContextType = ReturnType<typeof initializeDigitalFormContext>;

const DigitalFormContext = createContext<DigitalFormContextType | null>(null);

// Props for the provider component
interface DigitalFormProviderProps {
    children: ReactNode;
}

/**
 * Provider component for global digital form state management
 * Optimized for 5000+ users
 */
export const DigitalFormProvider: React.FC<DigitalFormProviderProps> = ({ children }) => {
    // Initialize the digital form context state
    const digitalFormState = initializeDigitalFormContext();

    return (
        <DigitalFormContext.Provider value={digitalFormState}>
            {children}
        </DigitalFormContext.Provider>
    );
};

/**
 * Hook to access the digital form context
 * Will throw an error if used outside of a DigitalFormProvider
 */
export const useDigitalFormContext = (): DigitalFormContextType => {
    const context = useContext(DigitalFormContext);

    if (!context) {
        throw new Error('useDigitalFormContext must be used within a DigitalFormProvider');
    }

    return context;
};