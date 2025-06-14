"use client"

import React, { useState } from 'react';

import { useAuthManager } from '@/hooks/auth/useAuthManager';
import { useSessionMonitor } from '@/hooks/auth/useSmartSession';

interface SessionStatusIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showInProduction?: boolean;
  onStatusClick?: () => void;
}

/**
 * SessionStatusIndicator - Visual indicator of session status
 * Useful for development and debugging session issues
 */
export const SessionStatusIndicator: React.FC<SessionStatusIndicatorProps> = ({
  position = 'bottom-right',
  showInProduction = false,
  onStatusClick,
}) => {
  const {
    status,
    isAuthenticated,
    isReady,
    isInitializing,
    hasError,
    sessionInfo,
    forceRefresh,
  } = useAuthManager();
  
  const { logSessionDiagnostics } = useSessionMonitor();
  const [showDetails, setShowDetails] = useState(false);

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  const getStatusColor = () => {
    if (hasError) return 'bg-red-500';
    if (isInitializing) return 'bg-yellow-500';
    if (isAuthenticated && isReady) return 'bg-green-500';
    if (status === 'unauthenticated') return 'bg-gray-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (hasError) return 'Error';
    if (isInitializing) return 'Init';
    if (isAuthenticated && isReady) return 'Auth';
    if (status === 'unauthenticated') return 'Unauth';
    return 'Loading';
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'top-left': return `${baseClasses} top-4 left-4`;
      case 'top-right': return `${baseClasses} top-4 right-4`;
      case 'bottom-left': return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right': return `${baseClasses} bottom-4 right-4`;
      default: return `${baseClasses} bottom-4 right-4`;
    }
  };

  const handleClick = () => {
    setShowDetails(!showDetails);
    onStatusClick?.();
    if (!showDetails) {
      logSessionDiagnostics();
    }
  };

  const formatTimeLeft = (timeToExpiry: number | null) => {
    if (!timeToExpiry || timeToExpiry < 0) return 'Expired';
    
    const hours = Math.floor(timeToExpiry / (1000 * 60 * 60));
    const minutes = Math.floor((timeToExpiry % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeToExpiry % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className={getPositionClasses()}>
      {/* Status Indicator Dot */}
      <div
        className={`
          ${getStatusColor()} 
          w-3 h-3 rounded-full cursor-pointer 
          shadow-lg border-2 border-white
          ${isInitializing ? 'animate-pulse' : ''}
          hover:scale-110 transition-transform
        `}
        onClick={handleClick}
        title={`Session Status: ${getStatusText()}`}
      />

      {/* Detailed Status Panel */}
      {showDetails && (
        <div className="absolute bottom-6 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-80 max-w-96">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Session Status</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            {/* Status */}
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                isAuthenticated ? 'text-green-600' : 'text-red-600'
              }`}>
                {getStatusText()}
              </span>
            </div>

            {/* Ready State */}
            <div className="flex justify-between">
              <span className="text-gray-600">Ready:</span>
              <span className={`font-medium ${
                isReady ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {isReady ? 'Yes' : 'No'}
              </span>
            </div>

            {/* Session Expiry */}
            {sessionInfo.timeToExpiry !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expires in:</span>
                <span className={`font-medium ${
                  sessionInfo.timeToExpiry < 300000 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatTimeLeft(sessionInfo.timeToExpiry)}
                </span>
              </div>
            )}

            {/* Needs Refresh */}
            {sessionInfo.needsRefresh && (
              <div className="flex justify-between">
                <span className="text-gray-600">Needs Refresh:</span>
                <span className="font-medium text-yellow-600">Yes</span>
              </div>
            )}

            {/* Last Check */}
            {sessionInfo.lastCheck && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last Check:</span>
                <span className="font-medium text-gray-800">
                  {Math.floor((Date.now() - sessionInfo.lastCheck) / 1000)}s ago
                </span>
              </div>
            )}

            {/* Error */}
            {hasError && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-600">Error:</span>
                <div className="text-red-600 text-xs mt-1 break-words">
                  {sessionInfo.status}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                forceRefresh();
                logSessionDiagnostics();
              }}
              className="flex-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              Force Refresh
            </button>
            <button
              onClick={logSessionDiagnostics}
              className="flex-1 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
            >
              Log Debug
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => window.location.href = '/login'}
              className="flex-1 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
            >
              Re-login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionStatusIndicator;
