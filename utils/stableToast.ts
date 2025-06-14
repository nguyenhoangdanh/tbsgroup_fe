import { toast, ToastOptions } from 'react-toast-kit';

/**
 * Stable toast utility với proper debouncing để tránh duplicate notifications
 */
class StableToast {
  private activeToasts = new Map<string, number>(); // message -> timestamp
  private toastTimers = new Map<string, NodeJS.Timeout>(); // message -> timer
  private readonly MIN_INTERVAL = 1000; // 1 second minimum between same messages
  private readonly CLEANUP_DELAY = 5000; // Clean up tracking after 5 seconds

  private createToastKey(message: string, description?: string): string {
    return `${message}-${description || ''}`;
  }

  private canShowToast(key: string): boolean {
    const lastShown = this.activeToasts.get(key);
    if (!lastShown) return true;
    
    const now = Date.now();
    return (now - lastShown) >= this.MIN_INTERVAL;
  }

  private trackToast(key: string): void {
    const now = Date.now();
    this.activeToasts.set(key, now);
    
    // Clear existing timer for this key
    const existingTimer = this.toastTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set cleanup timer
    const timer = setTimeout(() => {
      this.activeToasts.delete(key);
      this.toastTimers.delete(key);
    }, this.CLEANUP_DELAY);
    
    this.toastTimers.set(key, timer);
  }


  private showToast(message: string, options: ToastOptions = {}): string {
    const key = this.createToastKey(message, options.description);
    
    if (!this.canShowToast(key)) {
      console.log(`[StableToast] Skipping duplicate toast: ${message}`);
      return '';
    }

    // Track this toast
    this.trackToast(key);

    // Create toast using react-toast-kit
    return toast({
      title: options.title || (options.variant === 'error' ? 'Lỗi' : undefined),
      description: options.description || message,
      variant: options.variant || 'default',
      duration: options.duration || 4000,
    });
  }

  success(message: string, options: Omit<ToastOptions, 'variant'> = {}): string {
    return this.showToast(message, { 
      ...options, 
      variant: 'success',
      title:  options.title,
      description: options.description || message
    });
  }

  error(message: string, options: Omit<ToastOptions, 'variant'> = {}): string {
    return this.showToast(message, { 
      ...options, 
      variant: 'error',
      title: options.title,
      description: options.description || message
    });
  }

  warning(message: string, options: Omit<ToastOptions, 'variant'> = {}): string {
    return this.showToast(message, { 
      ...options, 
      variant: 'warning',
      title: options.title,
      description: options.description || message
    });
  }

  info(message: string, options: Omit<ToastOptions, 'variant'> = {}): string {
    return this.showToast(message, { 
      ...options, 
      variant: 'info',
      title:  options.title,
      description: options.description || message
    });
  }

  // Generic toast method
  show(message: string, options: ToastOptions = {}): string {
    return this.showToast(message, options);
  }

  // Promise toast wrapper
  promise<T>(
    promise: Promise<T>,
    options: {
      loading: string | ToastOptions;
      success: ((data: T) => string | ToastOptions) | string | ToastOptions;
      error: ((error: unknown) => string | ToastOptions) | string | ToastOptions;
    }
  ): Promise<T> {
    return toast.promise(promise, {
      loading: typeof options.loading === 'string' 
        ? { description: options.loading }
        : options.loading,
      success: options.success,
      error: options.error,
    });
  }

  // Update existing toast
  update(id: string, options: Partial<ToastOptions>): void {
    if (id) {
      toast.update(id, options);
    }
  }

  // Dismiss specific or all toasts
  dismiss(id?: string): void {
    toast.dismiss(id);
  }

  // Clear all toasts and tracking
  clearAll(): void {
    toast.clearAll();
    
    // Clear all timers
    this.toastTimers.forEach(timer => clearTimeout(timer));
    
    // Clear tracking
    this.activeToasts.clear();
    this.toastTimers.clear();
  }

  // Force show toast (bypass debouncing)
  force = {
    success: (message: string, options: Omit<ToastOptions, 'variant'> = {}): string => {
      return toast({
        title:  options.title,
        description: options.description || message,
        variant: 'success',
        duration: options.duration || 4000,
      });
    },

    error: (message: string, options: Omit<ToastOptions, 'variant'> = {}): string => {
      return toast({
        title:  options.title,
        description: options.description || message,
        variant: 'error',
        duration: options.duration || 4000,
      });
    },

    warning: (message: string, options: Omit<ToastOptions, 'variant'> = {}): string => {
      return toast({
        title:  options.title,
        description: options.description || message,
        variant: 'warning',
        duration: options.duration || 4000,
      });
    },

    info: (message: string, options: Omit<ToastOptions, 'variant'> = {}): string => {
      return toast({
        title: options.title,
        description: options.description || message,
        variant: 'info',
        duration: options.duration || 4000,
      });
    },
  };

  // Debug methods (development only)
  debug = {
    getActiveToasts: () => Array.from(this.activeToasts.entries()),
    getActiveTimers: () => this.toastTimers.size,
    clearTracking: () => {
      this.toastTimers.forEach(timer => clearTimeout(timer));
      this.activeToasts.clear();
      this.toastTimers.clear();
    },
  };
}

// Create singleton instance
export const stableToast = new StableToast();

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).stableToast = stableToast;
}

export default stableToast;
