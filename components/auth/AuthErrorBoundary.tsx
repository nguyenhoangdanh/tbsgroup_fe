'use client';

import { Component, ReactNode } from 'react';

import { logger } from '@/utils/monitoring/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const errorId = this.state.errorId || 'unknown';

    logger.error('Auth Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId,
      component: 'AuthErrorBoundary',
    });

    // Report to monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          errorId,
          component: 'AuthErrorBoundary',
        },
      });
    }

    // If it's an auth-related error, trigger logout
    if (this.isAuthError(error)) {
      this.handleAuthError();
    }
  }

  private isAuthError(error: Error): boolean {
    const authErrorMessages = [
      'token',
      'authentication',
      'unauthorized',
      'forbidden',
      'session',
      'csrf',
      'auth',
    ];

    return authErrorMessages.some(keyword => error.message.toLowerCase().includes(keyword));
  }

  private handleAuthError() {
    // Clear auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      localStorage.removeItem('auth-user-minimal');

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login?reason=auth_error';
      }, 2000);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  We encountered an unexpected error. This has been reported to our team.
                </p>

                {this.state.errorId && (
                  <p className="text-xs text-gray-500 mt-2">Error ID: {this.state.errorId}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Reload Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Go Home
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}