'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ThemeSwitchProps {
  collapsed?: boolean;
  className?: string;
  variant?: 'icon' | 'text' | 'both';
  showLabel?: boolean;
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ 
  collapsed = false, 
  className = '',
  variant = 'both',
  showLabel = !collapsed
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const getCurrentIcon = () => {
    switch (resolvedTheme) {
      case 'light':
        return <Sun size={16} />;
      case 'dark':
        return <Moon size={16} />;
      default:
        return <Monitor size={16} />;
    }
  };

  const getCurrentLabel = () => {
    switch (theme) {
      case 'light':
        return 'Sáng';
      case 'dark':
        return 'Tối';
      default:
        return 'Hệ thống';
    }
  };

  const ThemeButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`
            ${className}
            h-9 px-2 text-slate-600 dark:text-slate-400 
            hover:text-slate-900 dark:hover:text-slate-100
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition-colors duration-200
            ${collapsed || !showLabel ? 'w-9 px-0 justify-center' : 'justify-start'}
          `}
        >
          {getCurrentIcon()}
          {showLabel && !collapsed && (
            <span className="ml-2 text-sm">{getCurrentLabel()}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          Sáng
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          Tối
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          Hệ thống
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {ThemeButton}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Chuyển đổi giao diện: {getCurrentLabel()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return ThemeButton;
};
