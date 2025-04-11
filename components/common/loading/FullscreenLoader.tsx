"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTheme } from "next-themes";
import { LoadingConfig } from "./LoadingProvider";
import Image from "next/image";

interface FullscreenLoaderProps {
    config: LoadingConfig;
    onExitComplete: () => void;
}

const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({ config, onExitComplete }) => {
    const prefersReducedMotion = useReducedMotion();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const isMobile = useMediaQuery("(max-width: 640px)");

    // Tính toán kích thước phù hợp với thiết bị
    const { size, logoSize, particleCount } = useMemo(() => ({
        size: isMobile ? 120 : 160,
        logoSize: isMobile ? 64 : 80,
        particleCount: isMobile ? 6 : 12
    }), [isMobile]);

    // Tạo các hạt ngẫu nhiên xung quanh logo
    const particles = useMemo(() => {
        return Array.from({ length: particleCount }).map((_, i) => {
            const angle = (i / particleCount) * 2 * Math.PI;
            const distance = size * 0.8;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const delay = i * (1 / particleCount) * 0.8;
            const duration = 1.5 + Math.random() * 1;

            return { x, y, delay, duration, id: i };
        });
    }, [particleCount, size]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[9999] flex items-center justify-center ${isDark ? "bg-gray-900/95" : "bg-white/98"
                } backdrop-blur-xl`}
            onAnimationComplete={(definition) => {
                if (definition === "exit") onExitComplete();
            }}
            style={{
                willChange: 'opacity',
                transform: 'translateZ(0)'
            }}
        >
            {/* Backdrop glow effect */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className={`absolute rounded-full ${isDark ? "bg-primary/30" : "bg-primary/20"
                        } blur-3xl`}
                    initial={{ scale: 0.8, opacity: 0.4 }}
                    animate={{
                        scale: [0.8, 1.2, 0.8],
                        opacity: [0.4, 0.6, 0.4]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        width: size * 3,
                        height: size * 3,
                        top: '50%',
                        left: '50%',
                        x: '-50%',
                        y: '-50%'
                    }}
                />
            </div>

            {/* Logo container with modern effects */}
            <div className="relative z-10" style={{ width: size, height: size }}>
                {/* Logo container with subtle animations */}
                <motion.div
                    className={`relative flex items-center justify-center w-full h-full rounded-full ${isDark ? "bg-gray-800/50" : "bg-white/50"
                        } backdrop-blur-md shadow-lg`}
                    animate={prefersReducedMotion ? {} : {
                        scale: [1, 1.05, 1],
                        rotate: [-1, 1, -1]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {/* Ring effect */}
                    <motion.div
                        className="absolute inset-0 rounded-full border border-primary/30"
                        animate={{ scale: [0.85, 1.15, 0.85] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Logo */}
                    <div className="relative" style={{ width: logoSize, height: logoSize }}>
                        <Image
                            src="/images/logo-light.png"
                            alt="Loading"
                            width={logoSize}
                            height={logoSize}
                            priority
                            loading="eager"
                            decoding="async"
                            className="object-contain"
                            style={{
                                transform: 'translateZ(0)',
                                imageRendering: 'crisp-edges'
                            }}
                        />
                    </div>


                </motion.div>

                {/* Animated particles */}
                {!prefersReducedMotion && particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        className={`absolute rounded-full ${isDark ? "bg-primary/80" : "bg-primary/70"
                            }`}
                        style={{
                            width: 4 + Math.random() * 4,
                            height: 4 + Math.random() * 4,
                            top: '50%',
                            left: '50%',
                            x: -2,
                            y: -2
                        }}
                        animate={{
                            x: [0, particle.x, 0],
                            y: [0, particle.y, 0],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: particle.duration,
                            delay: particle.delay,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            {/* Text message with animated dots */}
            <motion.div
                className="absolute bottom-[35%] text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                    delay: 0.4,
                    duration: 0.6
                }}
            >
                <span className={`text-xl font-semibold tracking-wide ${isDark
                    ? "text-gray-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                    : "text-gray-800 drop-shadow-[0_2px_4px_rgba(255,255,255,0.6)]"
                    }`}>
                    {config.message || "Đang tải dữ liệu"}
                    <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            times: [0, 0.5, 1]
                        }}
                    >...</motion.span>
                </span>
            </motion.div>
        </motion.div>
    );
};

export default FullscreenLoader;





























// "use client";

// import React from "react";
// import { motion } from "framer-motion";
// import { useMediaQuery } from "@/hooks/useMediaQuery";
// import { useTheme } from "next-themes";
// import { LoadingConfig } from "./LoadingProvider";
// import Image from "next/image";

// interface FullscreenLoaderProps {
//     config: LoadingConfig;
//     onExitComplete: () => void;
// }

// const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({ config, onExitComplete }) => {
//     const isMobile = useMediaQuery("(max-width: 640px)");
//     const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
//     const { theme } = useTheme();
//     const isDark = theme === "dark";

//     // Increased loading circle sizes
//     const size = isMobile ? 64 : isTablet ? 80 : 96;
//     const borderWidth = isMobile ? 5 : 6;
//     const logoSize = Math.floor(size * 0.6);  // 60% of circle size for logo

//     return (
//         <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.3 }}
//             className={`fixed inset-0 z-[9999] flex items-center justify-center ${isDark ? "bg-gray-900/80" : "bg-black/50"
//                 } backdrop-blur-sm ${config.customClass || ""}`}
//             onAnimationComplete={(definition) => {
//                 if (definition === "exit") onExitComplete();
//             }}
//             style={{
//                 position: 'fixed',
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 bottom: 0,
//                 width: '100vw',
//                 height: '100vh'
//             }}
//         >
//             <div
//                 className={`flex flex-col items-center p-8 rounded-2xl shadow-xl ${isDark ? "bg-gray-800/90" : "bg-white/90"
//                     }`}
//             >
//                 <div
//                     className="relative mb-6"
//                     style={{
//                         width: `${size}px`,
//                         height: `${size}px`
//                     }}
//                 >
//                     {/* Outer spinning border */}
//                     <div
//                         className="absolute inset-0 rounded-full animate-spin"
//                         style={{
//                             borderWidth: `${borderWidth}px`,
//                             borderColor: 'transparent',
//                             borderTopColor: 'var(--primary)',
//                             borderRightColor: 'var(--primary)'
//                         }}
//                     />

//                     {/* Inner spinning border */}
//                     <div
//                         className="absolute inset-0 rounded-full animate-spin-reverse"
//                         style={{
//                             borderWidth: `${borderWidth}px`,
//                             borderColor: 'transparent',
//                             borderBottomColor: 'var(--primary-foreground)',
//                             borderLeftColor: 'var(--primary-foreground)'
//                         }}
//                     />

//                     {/* Inner circle background */}
//                     <div
//                         className={`absolute rounded-full ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
//                         style={{
//                             top: `${borderWidth}px`,
//                             left: `${borderWidth}px`,
//                             right: `${borderWidth}px`,
//                             bottom: `${borderWidth}px`
//                         }}
//                     />

//                     {/* Logo container */}
//                     <div className="absolute inset-0 flex items-center justify-center animate-pulse">
//                         <div style={{ width: `${logoSize}px`, height: `${logoSize}px`, position: 'relative' }}>
//                             <Image
//                                 src="/images/logo.png"
//                                 alt="Company Logo"
//                                 fill
//                                 className="object-contain"
//                                 priority
//                             />
//                         </div>
//                     </div>
//                 </div>
//                 <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"} animate-pulse`}>
//                     {config.message || "Đang tải..."}
//                 </h3>
//             </div>
//         </motion.div>
//     );
// };

// export default FullscreenLoader;