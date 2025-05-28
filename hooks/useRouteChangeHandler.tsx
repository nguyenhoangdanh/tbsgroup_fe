'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import {
  useSidebarSetCollapsed,
  useSidebarIsMobileView,
} from '@/components/common/layouts/admin/SidebarStateProvider';

export const useRouteChangeHandler = () => {
  const pathname = usePathname();
  const setCollapsed = useSidebarSetCollapsed();
  const isMobileView = useSidebarIsMobileView();

  useEffect(() => {
    if (isMobileView) {
      setCollapsed(true);
    }
  }, [pathname, setCollapsed, isMobileView]);

  return null;
};
