const { config: environmentConfig } = require('./environment');

function getNextConfig() {
  return {
    api: {
      baseUrl: environmentConfig.api.baseUrl,
      timeout: environmentConfig.api.timeout,
      retryAttempts: environmentConfig.api.retryAttempts,
    },
    security: {
      enableCSP: environmentConfig.security.enableCSP,
      enableHSTS: environmentConfig.security.enableHSTS,
    },
    monitoring: {
      enableAnalytics: environmentConfig.monitoring.enableAnalytics,
      enableErrorReporting: environmentConfig.monitoring.enableErrorReporting,
    },
    features: {
      enablePWA: environmentConfig.features.enablePWA,
      enableOfflineMode: environmentConfig.features.enableOfflineMode,
    },
  };
}

module.exports = { getNextConfig };
