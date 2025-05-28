import { logger } from '@/utils/monitoring/logger';

export const deploymentConfig = {
  // Environment detection
  isProduction: process.env.NODE_ENV === 'production',
  isStaging: process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging',
  isDevelopment: process.env.NODE_ENV === 'development',

  // API Configuration
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  apiTimeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '15000'),

  // Authentication Configuration
  authCookieDomain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || 'localhost',
  authCookieSecure: process.env.NODE_ENV === 'production',
  sessionTimeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '1800000'), // 30 minutes

  // Security Configuration
  csrfEnabled: process.env.NODE_ENV === 'production',
  httpsOnly: process.env.NODE_ENV === 'production',

  // Feature Flags
  features: {
    enablePWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
    enableOffline: process.env.NEXT_PUBLIC_ENABLE_OFFLINE === 'true',
    enableBiometrics: process.env.NEXT_PUBLIC_ENABLE_BIOMETRICS === 'true',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },

  // Monitoring Configuration
  monitoring: {
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
  },

  // Performance Configuration
  performance: {
    enableServiceWorker: process.env.NODE_ENV === 'production',
    cacheStrategy: process.env.NEXT_PUBLIC_CACHE_STRATEGY || 'stale-while-revalidate',
    maxCacheAge: parseInt(process.env.NEXT_PUBLIC_MAX_CACHE_AGE || '3600'), // 1 hour
  },
};

// Validation function for environment variables
export const validateEnvironment = () => {
  const requiredEnvVars = ['NEXT_PUBLIC_API_BASE_URL'];

  // Add production-specific required vars
  if (deploymentConfig.isProduction) {
    requiredEnvVars.push('NEXT_PUBLIC_AUTH_COOKIE_DOMAIN');
  }

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    const error = `Missing required environment variables: ${missingVars.join(', ')}`;

    if (typeof logger !== 'undefined') {
      logger.error('Environment validation failed', { missingVars });
    } else {
      console.error('Environment validation failed:', { missingVars });
    }

    throw new Error(error);
  }

  if (typeof logger !== 'undefined') {
    logger.info('Environment validation passed', {
      environment: process.env.NODE_ENV,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      features: deploymentConfig.features,
    });
  }
};
