import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

import { useAuthManager } from '@/hooks/auth/useAuthManager';
import { logger } from '@/utils/monitoring/logger';

import { AuthLoadingSkeleton } from './AuthLoadingSkeleton';


interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export const AuthGuard = ({
  children,
  fallback = <AuthLoadingSkeleton />,
  redirectTo = '/login',
  requireAuth = true,
  allowedRoles = [],
}: AuthGuardProps) => {
  const { isAuthenticated, isLoading, user } = useAuthManager();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        logger.info('AuthGuard: Redirecting unauthenticated user', {
          currentPath: window.location.pathname,
          redirectTo,
        });
        router.replace(redirectTo);
        return;
      }

      if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        logger.warn('AuthGuard: User does not have required role', {
          userRole: user.role,
          allowedRoles,
          userId: user.id,
        });
        router.replace('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo, requireAuth, allowedRoles]);

  if (isLoading) return fallback;
  if (requireAuth && !isAuthenticated) return fallback;
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};