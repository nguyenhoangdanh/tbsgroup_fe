interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV !== 'test';

  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    if (this.isEnabled) {
      this.setupPerformanceObserver();
      this.setupNavigationTiming();
    }
  }

  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: (entry as any).value || entry.duration,
            timestamp: Date.now(),
            tags: {
              type: entry.entryType,
              url: window.location.pathname,
            },
          });
        }
      });

      observer.observe({
        entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'],
      });
    }
  }

  private setupNavigationTiming() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation',
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          // Record key timing metrics
          this.recordMetric({
            name: 'page_load_time',
            value: navigation.loadEventEnd - navigation.loadEventStart,
            timestamp: Date.now(),
          });

          this.recordMetric({
            name: 'dom_content_loaded',
            value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            timestamp: Date.now(),
          });

          this.recordMetric({
            name: 'first_byte',
            value: navigation.responseStart - navigation.requestStart,
            timestamp: Date.now(),
          });
        }
      }, 0);
    });
  }

  recordMetric(metric: PerformanceMetric) {
    if (!this.isEnabled) return;

    this.metrics.push(metric);

    // Limit metrics array size
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Log performance issues
    if (metric.value > 3000) {
      console.warn(`Performance issue detected: ${metric.name}`, {
        value: metric.value,
        tags: metric.tags,
      });
    }
  }

  measureAuthOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    return operation().finally(() => {
      const duration = performance.now() - startTime;

      this.recordMetric({
        name: `auth_${operationName}`,
        value: duration,
        timestamp: Date.now(),
        tags: {
          category: 'authentication',
        },
      });
    });
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  async flushMetrics() {
    if (this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = [];

    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics: metricsToFlush }),
        keepalive: true,
      });
    } catch (error) {
      console.error('Failed to flush metrics', error);
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
