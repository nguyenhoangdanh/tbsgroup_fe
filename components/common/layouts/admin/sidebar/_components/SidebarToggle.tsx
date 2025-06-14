'use client';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { PanelLeft } from 'lucide-react';
import React from 'react';

export function SidebarToggle() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleSidebar}
      className="shrink-0"
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}
