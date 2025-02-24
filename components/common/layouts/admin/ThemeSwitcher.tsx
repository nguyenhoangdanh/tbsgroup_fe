"use client";
import React from "react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Moon, Sun } from "lucide-react";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex pr-4">
      <Avatar
        className={`cursor-pointer ${
          theme === "dark"
            ? "bg-gray-800 hover:text-yellow-400"
            : "bg-gray-200 hover:text-violet-600"
        }`}
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        <AvatarFallback>{theme === "dark" ? <Sun /> : <Moon />}</AvatarFallback>
      </Avatar>
    </div>
  );
};

export default ThemeSwitcher;
