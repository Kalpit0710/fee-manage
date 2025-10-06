interface ErrorContext {
  user?: string;
  action?: string;
  component?: string;
  [key: string]: any;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class MonitoringService {
  private static instance: MonitoringService;
  private isProduction: boolean;
  private sentryEnabled: boolean;
  private analyticsEnabled: boolean;

  private constructor() {
    this.isProduction = import.meta.env.VITE_APP_ENV === 'production';
    this.sentryEnabled = !!import.meta.env.VITE_SENTRY_DSN;
    this.analyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

    this.initialize();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initialize() {
    if (this.sentryEnabled) {
      console.log('Sentry monitoring initialized');
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureError(event.error, {
          type: 'window.error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(event.reason, {
          type: 'unhandledrejection',
          promise: 'Promise rejection',
        });
      });

      this.setupPerformanceMonitoring();
    }
  }

  captureError(error: Error | string, context?: ErrorContext) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    const errorData = {
      message: errorMessage,
      stack: errorStack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true') {
      console.error('Error captured:', errorData);
    }

    if (this.sentryEnabled) {
      console.log('Would send to Sentry:', errorData);
    }

    this.logToSupabase(errorData);
  }

  captureException(error: Error, context?: ErrorContext) {
    this.captureError(error, context);
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    const logData = {
      message,
      level,
      context,
      timestamp: new Date().toISOString(),
    };

    if (import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true') {
      console.log(`[${level.toUpperCase()}]`, message, context);
    }
  }

  trackPageView(path: string) {
    if (this.analyticsEnabled) {
      console.log('Page view:', path);
    }
  }

  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (this.analyticsEnabled) {
      console.log('Event tracked:', eventName, properties);
    }
  }

  measurePerformance(name: string, duration: number) {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
    };

    if (import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true') {
      console.log('Performance metric:', metric);
    }

    if (duration > 3000) {
      this.captureMessage(
        `Slow operation detected: ${name}`,
        'warning',
        { duration, metric: name }
      );
    }
  }

  private setupPerformanceMonitoring() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.measurePerformance('page-load', navEntry.loadEventEnd - navEntry.fetchStart);
            }
          }
        });

        observer.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.error('Failed to setup performance monitoring:', error);
      }
    }
  }

  private async logToSupabase(errorData: any) {
    if (!this.isProduction) return;

    try {
      console.log('Error logged locally:', errorData);
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  setUser(userId: string, email: string, role: string) {
    if (this.sentryEnabled) {
      console.log('User context set:', { userId, email, role });
    }
  }

  clearUser() {
    if (this.sentryEnabled) {
      console.log('User context cleared');
    }
  }
}

export const monitoring = MonitoringService.getInstance();

export function withErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  context?: ErrorContext
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);

      if (result instanceof Promise) {
        return result.catch((error) => {
          monitoring.captureError(error, context);
          throw error;
        });
      }

      return result;
    } catch (error) {
      monitoring.captureError(error as Error, context);
      throw error;
    }
  }) as T;
}

export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  return fn().finally(() => {
    const duration = performance.now() - startTime;
    monitoring.measurePerformance(name, duration);
  });
}
