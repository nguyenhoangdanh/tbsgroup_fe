// services/security/security.service.ts
export const SecurityService = {
    SESSION_TIMEOUTS: {
      high: 15 * 60 * 1000, // 15 phút
      medium: 30 * 60 * 1000, // 30 phút
      low: 60 * 60 * 1000 // 60 phút
    },
    
    monitorUserActivity: (callback: () => void) => {
      const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
      
      events.forEach(event => {
        window.addEventListener(event, callback);
      });
      
      return () => {
        events.forEach(event => {
          window.removeEventListener(event, callback);
        });
      };
    },
    
    checkSessionTimeout: (lastActivity: number, securityLevel: 'high' | 'medium' | 'low') => {
      const timeout = SecurityService.SESSION_TIMEOUTS[securityLevel];
      return Date.now() - lastActivity > timeout;
    }
  };
  