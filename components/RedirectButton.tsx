"use client"; // ✅ Chỉ cần client-side logic ở đây

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

interface RedirectButtonProps {
    name: string;
    redirect?: string;
    icon?: React.ReactNode,
    positionIcon?: "left" | "right";
    className?: string;
    size?: "sm" | "lg" | "icon" | "default";
    variant?: "default" | "outline" | "link" | "ghost" | "destructive" | "secondary";
    onClick?: () => void; // ✅ Hỗ trợ hành động không cần điều hướng
}

export default function RedirectButton({
    className = "",
    size = "default",
    variant = "default",
    name,
    redirect = "/",
    icon,
    positionIcon = "right",
    onClick,
}: RedirectButtonProps) {
    const router = useRouter(); // ✅ Dùng useRouter để điều hướng

    const handleClick = () => {
        if (onClick) {
            onClick(); // ✅ Nếu có sự kiện `onClick`, chạy trước
        } else if (redirect) {
            router.push(redirect); // ✅ Nếu có `redirect`, điều hướng
        }
    };

    return (
        <Button
            size={size}
            className={`${className} flex items-center gap-2`} // ✅ Đảm bảo class không bị ghi đè
            variant={variant}
            onClick={handleClick}
        >
            {positionIcon === "left" && icon}
            {name}
            {positionIcon === "right" && icon}
        </ Button >
    );
}
