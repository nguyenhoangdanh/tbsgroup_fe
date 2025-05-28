'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useCallback } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  //Only show the UI after component has mounted to avoid hydration errors
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  //  Render nothing until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            <Avatar
              className={`cursor-pointer w-full h-full transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-200 hover:text-yellow-400 hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-800 hover:text-violet-700 hover:bg-gray-300'
              }`}
            >
              <AvatarFallback>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default React.memo(ThemeSwitcher);
