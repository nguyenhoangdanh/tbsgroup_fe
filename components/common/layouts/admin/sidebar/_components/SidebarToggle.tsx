"use client";

import React from "react";

interface SidebarToggleProps {
    className?: string;
    isCollapsed: boolean;
    onToggle: () => void;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({
    className = "",
    isCollapsed,
    onToggle
}) => {
    return (
        <button
            onClick={onToggle}
            className={`flex items-center justify-center p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 transition-colors ${className}`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""
                    }`}
            >
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </button>
    );
};