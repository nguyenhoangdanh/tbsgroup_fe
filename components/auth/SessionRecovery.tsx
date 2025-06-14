"use client"

import React, { useEffect, useState } from 'react';

import { useAuthManager } from '@/hooks/auth/useAuthManager';
import { useSessionMonitor } from '@/hooks/auth/useSmartSession';

interface SessionRecoveryProps {
  children: React.ReactNode;
  onRecoveryAttempt?: (attempt: number) => void;
  onRecoverySuccess?: () => void;
  onRecoveryFailed?: () => void;
  maxRetries?: number;
}

/**
 * SessionRecovery component provides intelligent session recovery capabilities
 * Automatically attempts to recover failed sessions and provides fallback UI
 */
export const SessionRecovery: React.FC<SessionRecoveryProps> = ({
  children,
  onRecoveryAttempt,
  onRecoverySuccess,
  onRecoveryFailed,
  maxRetries = 3,
}) => {
  const { 
    status, 
    error, 
    forceRefresh, 
    clearAuthErrors,
    sessionInfo 
  } = useAuthManager();
  
  const { logSessionDiagnostics } = useSessionMonitor();
  
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastRecoveryTime, setLastRecoveryTime] = useState<number>(0);

  // Automatic recovery when session errors occur
  useEffect(() => {
    const shouldAttemptRecovery = 
      error && 
      !isRecovering && 
      recoveryAttempts < maxRetries &&
      status !== 'unauthenticated' && // Don't recover from intentional logout
      (Date.now() - lastRecoveryTime) > 10000; // Wait at least 10 seconds between attempts

    if (shouldAttemptRecovery) {
      attemptRecovery();
    }
  }, [error, status, isRecovering, recoveryAttempts, maxRetries, lastRecoveryTime]);

  const attemptRecovery = async () => {
    const attempt = recoveryAttempts + 1;
    setIsRecovering(true);
    setRecoveryAttempts(attempt);
    setLastRecoveryTime(Date.now());
    
    console.log(`🔧 Attempting session recovery (${attempt}/${maxRetries})`);
    onRecoveryAttempt?.(attempt);
    
    // Log diagnostics for debugging
    logSessionDiagnostics();
    
    try {
      // Clear existing errors first
      clearAuthErrors();
      
      // Wait a bit before attempting recovery
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force session refresh
      forceRefresh();
      
      // Wait for the refresh to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if recovery was successful
      const currentState = sessionInfo;
      if (currentState.isValid && !currentState.isExpired) {
        console.log('✅ Session recovery successful');
        setRecoveryAttempts(0);
        onRecoverySuccess?.();
      } else if (attempt >= maxRetries) {
        console.log('❌ Session recovery failed after max attempts');
        onRecoveryFailed?.();
      }
      
    } catch (error) {
      console.error('❌ Session recovery error:', error);
      if (attempt >= maxRetries) {
        onRecoveryFailed?.();
      }
    } finally {
      setIsRecovering(false);
    }
  };

  // Manual recovery trigger
  const triggerManualRecovery = () => {
    setRecoveryAttempts(0); // Reset attempts for manual trigger
    attemptRecovery();
  };

  // Render recovery UI when appropriate
  if (isRecovering) {
    return <RecoveryLoadingUI attempt={recoveryAttempts} maxRetries={maxRetries} />;
  }

  // Render error UI when recovery has failed
  if (error && recoveryAttempts >= maxRetries && !isRecovering) {
    return (
      <RecoveryFailedUI 
        error={error} 
        onRetry={triggerManualRecovery}
        sessionInfo={sessionInfo}
      />
    );
  }

  // Render children when session is ready or recovering
  return <>{children}</>;
};

/**
 * Loading UI during recovery attempts
 */
const RecoveryLoadingUI: React.FC<{ attempt: number; maxRetries: number }> = ({ 
  attempt, 
  maxRetries 
}) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Khôi phục phiên làm việc
      </h2>
      <p className="text-gray-600 mb-4">
        Đang thử khôi phục kết nối... ({attempt}/{maxRetries})
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(attempt / maxRetries) * 100}%` }}
        />
      </div>
    </div>
  </div>
);

/**
 * Error UI when recovery has failed
 */
const RecoveryFailedUI: React.FC<{ 
  error: string; 
  onRetry: () => void;
  sessionInfo: any;
}> = ({ error, onRetry, sessionInfo }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-red-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Lỗi phiên làm việc
      </h2>
      <p className="text-gray-600 mb-4">
        Không thể khôi phục phiên làm việc. Vui lòng thử lại hoặc đăng nhập lại.
      </p>
      <div className="text-sm text-gray-500 mb-4 p-3 bg-gray-100 rounded">
        <strong>Chi tiết lỗi:</strong> {error}
      </div>
      <div className="space-y-2">
        <button 
          onClick={onRetry}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Thử lại
        </button>
        <button 
          onClick={() => window.location.href = '/login'}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Đăng nhập lại
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
        >
          Tải lại trang
        </button>
      </div>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500">
            Debug Info
          </summary>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </details>
      )}
    </div>
  </div>
);

export default SessionRecovery;
