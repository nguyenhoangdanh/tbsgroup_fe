interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

interface LogContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private sessionId: string;
  private logQueue: LogContext[] = [];
  private isProduction = process.env.NODE_ENV === 'production';

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();

    if (this.isProduction) {
      this.setupLogFlush();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', event => {
      this.error('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    // Handle resource loading errors
    window.addEventListener(
      'error',
      event => {
        if (event.target !== window) {
          this.warn('Resource Loading Error', {
            element: event.target,
            source: (event.target as any)?.src || (event.target as any)?.href,
          });
        }
      },
      true,
    );
  }

  private setupLogFlush() {
    // Flush logs every 30 seconds in production
    setInterval(() => {
      this.flushLogs();
    }, 30000);

    // Flush logs before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushLogs();
      });
    }
  }

  private createLogContext(level: keyof LogLevel, message: string, data?: any): LogContext {
    return {
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      stack: new Error().stack,
    };
  }

  private getCurrentUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;

    // Get user ID from auth state
    try {
      const authState = JSON.parse(localStorage.getItem('persist:root') || '{}');
      const auth = JSON.parse(authState.auth || '{}');
      return auth.user?.id;
    } catch {
      return undefined;
    }
  }

  error(message: string, data?: any) {
    const logContext = this.createLogContext('ERROR', message, data);

    if (!this.isProduction) {
      console.error(message, data);
    }

    this.queueLog(logContext);

    // Send critical errors immediately
    if (this.isProduction) {
      this.sendToMonitoring(logContext);
    }
  }

  warn(message: string, data?: any) {
    const logContext = this.createLogContext('WARN', message, data);

    if (!this.isProduction) {
      console.warn(message, data);
    }

    this.queueLog(logContext);
  }

  info(message: string, data?: any) {
    const logContext = this.createLogContext('INFO', message, data);

    if (!this.isProduction) {
      console.info(message, data);
    }

    this.queueLog(logContext);
  }

  debug(message: string, data?: any) {
    const logContext = this.createLogContext('DEBUG', message, data);

    if (!this.isProduction) {
      console.debug(message, data);
    }

    // Only queue debug logs in development
    if (!this.isProduction) {
      this.queueLog(logContext);
    }
  }

  private queueLog(logContext: LogContext) {
    this.logQueue.push(logContext);

    // Limit queue size
    if (this.logQueue.length > 100) {
      this.logQueue.shift();
    }
  }

  private async flushLogs() {
    if (this.logQueue.length === 0) return;

    const logsToFlush = [...this.logQueue];
    this.logQueue = [];

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToFlush }),
        keepalive: true,
      });
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Re-queue logs on failure
      this.logQueue.unshift(...logsToFlush);
    }
  }

  private async sendToMonitoring(logContext: LogContext) {
    try {
      // Send to external monitoring service (e.g., Sentry, LogRocket)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: logContext.message,
          fatal: logContext.level === 'ERROR',
          custom_map: {
            userId: logContext.userId,
            sessionId: logContext.sessionId,
          },
        });
      }
    } catch (error) {
      console.error('Failed to send to monitoring:', error);
    }
  }

  getRecentLogs(count = 50): LogContext[] {
    return this.logQueue.slice(-count);
  }
}

export const logger = Logger.getInstance();
