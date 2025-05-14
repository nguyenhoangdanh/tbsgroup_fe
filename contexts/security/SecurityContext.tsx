'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

import { SecurityService } from '@/services/common/security.service';

type SecurityLevel = 'high' | 'medium' | 'low';

type SecurityContextType = {
  lastActivity: number;
  updateActivity: () => void;
  securityLevel: SecurityLevel;
  setSecurityLevel: (level: SecurityLevel) => void;
};

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('medium');

  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  useEffect(() => {
    // Monitor user activity
    return SecurityService.monitorUserActivity(updateActivity);
  }, []);

  const contextValue = useMemo(
    () => ({
      lastActivity,
      updateActivity,
      securityLevel,
      setSecurityLevel,
    }),
    [lastActivity, securityLevel],
  );

  return <SecurityContext.Provider value={contextValue}>{children}</SecurityContext.Provider>;
};

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};
