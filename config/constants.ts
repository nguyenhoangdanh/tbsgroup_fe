export const APP_CONFIG = {
  NAME: 'TBS Group Management',
  DESCRIPTION: 'Thoai Son Handbag Factory Management System',
  VERSION: process.env.npm_package_version || '1.0.0',
  AUTHOR: 'TBS Group',

  // URLs
  WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://tbsgroup.com',
  SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@tbsgroup.com',

  // Limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 5,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Timeouts
  REQUEST_TIMEOUT: 30000,
  LONG_REQUEST_TIMEOUT: 60000,

  // Cache TTL (seconds)
  CACHE_TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    SKIP_SUCCESSFUL_REQUESTS: false,
  },

  // Authentication
  AUTH: {
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  },

  // Features
  FEATURES: {
    ENABLE_PWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
    ENABLE_OFFLINE: process.env.NEXT_PUBLIC_ENABLE_OFFLINE === 'true',
    ENABLE_BIOMETRICS: process.env.NEXT_PUBLIC_ENABLE_BIOMETRICS === 'true',
    ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    ENABLE_PUSH_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_PUSH === 'true',
  },

  // Storage
  STORAGE: {
    LOCAL_STORAGE_PREFIX: 'tbsgroup_',
    SESSION_STORAGE_PREFIX: 'tbsgroup_session_',
  },
} as const;

export const PUBLICROUTES = [
  '/login',
  '/reset-password',
  '/forgot-password',
  '/register',
  '/verify-email',
  '/',
];

export const PROTECTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/users',
];

export const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/roles',
  '/admin/handbags',
  '/admin/factories',
  '/admin/lines',
  '/admin/teams',
  '/admin/groups',
  '/admin/departments',
  '/admin/permissions',
  '/admin/audit-logs',
  '/admin/system-settings',
  '/admin/health',
  '/admin/metrics',
  '/admin/logs',
  '/admin/notifications',
  '/admin/reports',
  '/admin/analytics',
  '/admin/integrations',
  '/admin/backup',
  '/admin/security',
  '/admin/maintenance',
  '/admin/support',
  '/admin/feedback',
  '/admin/updates',
  '/admin/notifications/settings',
  '/admin/notifications/logs',
  '/admin/notifications/alerts',
  '/admin/notifications/subscriptions',
  '/admin/notifications/templates',
  '/admin/notifications/queues',
  '/admin/notifications/senders',
  '/admin/notifications/receivers',
  '/admin/notifications/history',
]

const apiRoutes = ['/api/'];
const staticRoutes = ['/_next', '/favicon.ico', '/images', '/icons'];


export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  USERS: {
    PROFILE: '/users/profile',
    LIST: '/users',
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  ROLES: {
    LIST: '/roles',
    CREATE: '/roles',
    UPDATE: (id: string) => `/roles/${id}`,
    DELETE: (id: string) => `/roles/${id}`,
  },
  HANDBAGS: {
    LIST: '/handbags',
    STAGES: '/handbags/stages',
    PO: '/handbags/po',
  },
  HEALTH: '/health',
  METRICS: '/metrics',
  LOGS: '/logs',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: 'Access forbidden.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
} as const;
