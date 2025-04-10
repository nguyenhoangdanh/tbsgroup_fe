"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import FullscreenLoader from "./FullscreenLoader";
import TableSkeletonLoader from "./TableSkeletonLoader";

export type LoadingVariant = "fullscreen" | "table" | "custom";

export interface LoadingConfig {
    variant: LoadingVariant;
    message?: string;
    customClass?: string;
    skeletonConfig?: {
        rows?: number;
        columns?: number;
    };
    delay?: number; // Delay before showing the loader
}

interface LoadingState {
    isLoading: boolean;
    configs: Record<string, LoadingConfig>;
}

interface LoadingContextType {
    startLoading: (key: string, config: LoadingConfig) => void;
    stopLoading: (key: string) => void;
    isLoading: (key?: string) => boolean;
    configs: Record<string, LoadingConfig>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loadingState, setLoadingState] = useState<LoadingState>({
        isLoading: false,
        configs: {},
    });

    const startLoading = useCallback((key: string, config: LoadingConfig) => {
        const delay = config.delay || 300;
        setTimeout(() => {
            setLoadingState((prev) => ({
                isLoading: true,
                configs: { ...prev.configs, [key]: config },
            }));
        }, delay);
    }, []);

    const stopLoading = useCallback((key: string) => {
        setLoadingState((prev) => {
            const newConfigs = { ...prev.configs };
            delete newConfigs[key];
            return {
                isLoading: Object.keys(newConfigs).length > 0,
                configs: newConfigs,
            };
        });
    }, []);


    const isLoading = useCallback(
        (key?: string) => (key ? !!loadingState.configs[key] : loadingState.isLoading),
        [loadingState]
    );

    useEffect(() => {
        return () => {
            setLoadingState({ isLoading: false, configs: {} });
        };
    }, []);

    return (
        <LoadingContext.Provider value={{
            startLoading,
            stopLoading,
            isLoading,
            configs: loadingState.configs,
        }}>
            {children}
            <LoadingRenderer />
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) throw new Error("useLoading must be used within a LoadingProvider");
    return context;
};

const LoadingRenderer: React.FC = () => {
    const { configs, isLoading, stopLoading } = useLoading();
    return (
        <AnimatePresence>
            {Object.entries(configs).map(([key, config]) => (
                <LoadingComponent key={key} id={key} config={config} onExitComplete={() => stopLoading(key)} />
            ))}
        </AnimatePresence>
    );
};

interface LoadingComponentProps {
    id: string;
    config: LoadingConfig;
    onExitComplete: () => void;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({ id, config, onExitComplete }) => {
    switch (config.variant) {
        case "fullscreen":
            return <FullscreenLoader config={config} onExitComplete={onExitComplete} />;
        case "table":
            return <TableSkeletonLoader config={config} onExitComplete={onExitComplete} />;
        default:
            return null;
    }
};