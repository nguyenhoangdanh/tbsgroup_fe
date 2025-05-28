const developmentConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
    timeout: 30000,
    retryAttempts: 3,
  },
  auth: {
    tokenStorageMethod: 'localStorage', // For debugging
    sessionTimeout: 60 * 60 * 1000, // 1 hour
    refreshTokenThreshold: 5 * 60 * 1000, // 5 minutes
    csrfEnabled: false,
  },
  security: {
    enableCSP: false,
    enableHSTS: false,
    cookieDomain: 'localhost',
    cookieSecure: false,
    cookieSameSite: 'lax',
  },
  monitoring: {
    enableAnalytics: false,
    enableErrorReporting: true,
    performanceTracking: true,
  },
  features: {
    enablePWA: false,
    enableOfflineMode: false,
    enableBiometrics: false,
  },
};

const productionConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.yourdomain.com/api/v1',
    timeout: 15000,
    retryAttempts: 2,
  },
  auth: {
    tokenStorageMethod: 'cookie', // HttpOnly cookies only
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    refreshTokenThreshold: 3 * 60 * 1000, // 3 minutes
    csrfEnabled: true,
  },
  security: {
    enableCSP: true,
    enableHSTS: true,
    cookieDomain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.yourdomain.com',
    cookieSecure: true,
    cookieSameSite: 'strict',
  },
  monitoring: {
    enableAnalytics: true,
    enableErrorReporting: true,
    performanceTracking: true,
  },
  features: {
    enablePWA: true,
    enableOfflineMode: true,
    enableBiometrics: true,
  },
};

const config = process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig;

module.exports = { config };