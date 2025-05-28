import { SecurityLevel } from '@/contexts/security/SecurityContext';

export class SecurityService {
  static checkSessionTimeout(lastActivity: number, securityLevel: SecurityLevel): boolean {
    const timeoutMap = {
      [SecurityLevel.LOW]: 2 * 60 * 60 * 1000,      // 2 hours
      [SecurityLevel.MEDIUM]: 60 * 60 * 1000,       // 1 hour
      [SecurityLevel.HIGH]: 30 * 60 * 1000,         // 30 minutes
      [SecurityLevel.STRICT]: 15 * 60 * 1000,       // 15 minutes
    };

    const timeout = timeoutMap[securityLevel];
    const inactiveTime = Date.now() - lastActivity;
    
    return inactiveTime > timeout;
  }

  static getCSRFToken(): string | null {
    if (typeof window === 'undefined') return null;
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
  }

  static refreshCSRFToken(): string | null {
    if (typeof window !== 'undefined' && (window as any).__security) {
      return (window as any).__security.refreshCSRFToken();
    }
    return null;
  }
}
