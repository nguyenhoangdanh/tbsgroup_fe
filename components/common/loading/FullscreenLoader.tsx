"use client";

import React from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTheme } from "next-themes";
import { ShoppingBag } from "lucide-react";
import { LoadingConfig } from "./LoadingProvider";

interface FullscreenLoaderProps {
    config: LoadingConfig;
    onExitComplete: () => void;
}

const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({ config, onExitComplete }) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const size = isMobile ? 36 : isTablet ? 44 : 52;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed inset-0 z-[9999] flex items-center justify-center ${isDark ? "bg-gray-900/80" : "bg-black/50"
                } backdrop-blur-sm ${config.customClass || ""}`}
            onAnimationComplete={(definition) => {
                if (definition === "exit") onExitComplete();
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh'
            }}
        >
            <div
                className={`flex flex-col items-center p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800/90" : "bg-white/90"
                    }`}
            >
                <div className={`relative w-${size} h-${size} mb-4`}>
                    <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 border-4 border-transparent border-b-primary-foreground border-l-primary-foreground rounded-full animate-spin-reverse" />
                    <div className={`absolute inset-1 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
                    <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                        <ShoppingBag className={`w-${size / 2} h-${size / 2} text-primary`} />
                    </div>
                </div>
                <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"} animate-pulse`}>
                    {config.message || "Đang tải..."}
                </h3>
            </div>
        </motion.div>
    );
};

export default FullscreenLoader;