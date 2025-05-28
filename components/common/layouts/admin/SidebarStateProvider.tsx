'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SidebarStateContextType {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  isMobileView: boolean;
}

type SidebarSetCollapsedContextType = (value: boolean) => void;

const SidebarIsMobileViewContext = createContext<boolean>(false);
const SidebarCollapsedContext = createContext<boolean>(false);
const SidebarSetCollapsedContext = createContext<SidebarSetCollapsedContextType>(() => {});

export const useSidebarCollapsed = () => useContext(SidebarCollapsedContext);
export const useSidebarSetCollapsed = () => useContext(SidebarSetCollapsedContext);
export const useSidebarIsMobileView = () => useContext(SidebarIsMobileViewContext);

export const useSidebarState = () => {
  return {
    collapsed: useSidebarCollapsed(),
    setCollapsed: useSidebarSetCollapsed(),
    isMobileView: useSidebarIsMobileView(),
  };
};

export const SidebarStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobileScreen = useMediaQuery('(max-width: 768px)');
  const isTabletScreen = useMediaQuery('(min-width: 769px) and (max-width: 1023px)');
  const isSmallScreen = isMobileScreen || isTabletScreen;
  const [isClient, setIsClient] = useState(false);

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        return savedState === 'true';
      }
    }
    return isSmallScreen;
  });

  useEffect(() => {
    setIsClient(true);

    // Khôi phục trạng thái sidebar từ localStorage cho desktop
    if (!isSmallScreen) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setCollapsed(savedState === 'true');
      } else {
        // Mặc định mở trên desktop
        setCollapsed(false);
      }
    }
  }, [isSmallScreen]);

  // Lưu trạng thái khi thay đổi
  useEffect(() => {
    if (isClient && !isSmallScreen) {
      localStorage.setItem('sidebarCollapsed', String(collapsed));
    }
  }, [collapsed, isClient, isSmallScreen]);

  useEffect(() => {
    setIsClient(true);

    if (!isSmallScreen) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setCollapsed(savedState === 'true');
      } else {
        setCollapsed(false);
      }
    } else {
      setCollapsed(true);
    }
  }, [isSmallScreen]);

  useEffect(() => {
    if (isClient && !isSmallScreen) {
      localStorage.setItem('sidebarCollapsed', String(collapsed));
    }
  }, [collapsed, isClient, isSmallScreen]);

  const setCollapsedCallback = useMemo(() => {
    return (value: boolean) => {
      if (isSmallScreen && value === false) {
        setCollapsed(false);
      } else {
        setCollapsed(value);
      }
    };
  }, [isSmallScreen]);

  return (
    <SidebarIsMobileViewContext.Provider value={isSmallScreen}>
      <SidebarCollapsedContext.Provider value={collapsed}>
        <SidebarSetCollapsedContext.Provider value={setCollapsedCallback}>
          {children}
        </SidebarSetCollapsedContext.Provider>
      </SidebarCollapsedContext.Provider>
    </SidebarIsMobileViewContext.Provider>
  );
};
