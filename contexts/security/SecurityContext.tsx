'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Security levels and their corresponding timeout values (in milliseconds)
export enum SecurityLevel {
  LOW = 'low',        // 2 hours
  MEDIUM = 'medium',  // 1 hour 
  HIGH = 'high',      // 30 minutes
  STRICT = 'strict',  // 15 minutes
}

// Map security levels to timeout durations in milliseconds
const timeoutMap: Record<SecurityLevel, number> = {
  [SecurityLevel.LOW]: 2 * 60 * 60 * 1000,      // 2 hours
  [SecurityLevel.MEDIUM]: 60 * 60 * 1000,       // 1 hour
  [SecurityLevel.HIGH]: 30 * 60 * 1000,         // 30 minutes
  [SecurityLevel.STRICT]: 15 * 60 * 1000,       // 15 minutes
};

interface SecurityContextType {
  securityLevel: SecurityLevel;
  lastActivity: number;
  recordActivity: () => void;
  setSecurityLevel: (level: SecurityLevel) => void;
  getInactiveTime: () => number;
  getTimeoutDuration: () => number;
  getRemainingTime: () => number;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  // Default to MEDIUM security level
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(() => {
    // Try to get saved security level from localStorage
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('securityLevel');
      if (savedLevel && Object.values(SecurityLevel).includes(savedLevel as SecurityLevel)) {
        return savedLevel as SecurityLevel;
      }
    }
    return SecurityLevel.MEDIUM;
  });

  // Initialize lastActivity with current time
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Function to update last activity timestamp
  const recordActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  }, []);

  // Function to change security level
  const changeSecurityLevel = useCallback((level: SecurityLevel) => {
    setSecurityLevel(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem('securityLevel', level);
    }
  }, []);

  // Calculate how long user has been inactive
  const getInactiveTime = useCallback((): number => {
    return Date.now() - lastActivity;
  }, [lastActivity]);

  // Get timeout duration based on current security level
  const getTimeoutDuration = useCallback((): number => {
    return timeoutMap[securityLevel];
  }, [securityLevel]);

  // Calculate remaining time before session timeout
  const getRemainingTime = useCallback((): number => {
    const timeout = getTimeoutDuration();
    const inactive = getInactiveTime();
    return Math.max(0, timeout - inactive);
  }, [getTimeoutDuration, getInactiveTime]);

  // When component mounts, load last activity from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastActivityStr = localStorage.getItem('lastActivity');
      if (lastActivityStr) {
        const lastActivityTime = parseInt(lastActivityStr, 10);
        if (!isNaN(lastActivityTime)) {
          setLastActivity(lastActivityTime);
        }
      }
    }
  }, []);

  const value = {
    securityLevel,
    lastActivity,
    recordActivity,
    setSecurityLevel: changeSecurityLevel,
    getInactiveTime,
    getTimeoutDuration,
    getRemainingTime,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};
