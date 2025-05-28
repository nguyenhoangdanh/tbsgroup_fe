interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: {
    api: boolean;
    auth: boolean;
    localStorage: boolean;
    network: boolean;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    memoryUsage?: number;
  };
}

class HealthChecker {
  private static instance: HealthChecker;
  private lastCheck: HealthStatus | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance() {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  private constructor() {
    this.startHealthChecks();
  }

  private startHealthChecks() {
    // Check health every 5 minutes
    this.checkInterval = setInterval(
      () => {
        this.performHealthCheck();
      },
      5 * 60 * 1000,
    );

    // Initial check
    this.performHealthCheck();
  }

  async performHealthCheck(): Promise<HealthStatus> {
    const startTime = performance.now();

    const checks = {
      api: await this.checkAPI(),
      auth: await this.checkAuth(),
      localStorage: this.checkLocalStorage(),
      network: navigator.onLine,
    };

    const responseTime = performance.now() - startTime;
    const errorRate = this.calculateErrorRate();

    const status: HealthStatus = {
      status: this.determineOverallStatus(checks),
      timestamp: Date.now(),
      checks,
      metrics: {
        responseTime,
        errorRate,
        memoryUsage: this.getMemoryUsage(),
      },
    };

    this.lastCheck = status;

    // Log health issues
    if (status.status !== 'healthy') {
      logger.warn('Health check failed', status);
    }

    return status;
  }

  private async checkAPI(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkAuth(): Promise<boolean> {
    try {
      return await tokenManager.ensureValidToken();
    } catch {
      return false;
    }
  }

  private checkLocalStorage(): boolean {
    try {
      const testKey = '__health_check__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private calculateErrorRate(): number {
    // Calculate error rate from recent logs
    const recentLogs = logger.getRecentLogs ? logger.getRecentLogs(100) : [];
    const errorLogs = recentLogs.filter(log => log.level === 'ERROR');
    return recentLogs.length > 0 ? errorLogs.length / recentLogs.length : 0;
  }

  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  private determineOverallStatus(checks: HealthStatus['checks']): HealthStatus['status'] {
    const failedChecks = Object.values(checks).filter(check => !check).length;

    if (failedChecks === 0) return 'healthy';
    if (failedChecks <= 1) return 'degraded';
    return 'unhealthy';
  }

  getLastHealthStatus(): HealthStatus | null {
    return this.lastCheck;
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const healthChecker = HealthChecker.getInstance();
