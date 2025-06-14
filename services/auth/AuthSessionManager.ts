"use client"

import { initializeApp, forceSessionCheck } from '@/redux/slices/authSlice';
import { store } from '@/redux/store';
import type { AuthState } from '@/redux/types/auth';

/**
 * AuthSessionManager - Handles intelligent session management
 */
class AuthSessionManager {
  private static instance: AuthSessionManager;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;

  private constructor() {
    // Only setup listeners in browser environment
    if (typeof window !== 'undefined') {
      this.setupBrowserEventListeners();
    }
  }

  public static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager();
    }
    return AuthSessionManager.instance;
  }

  /**
   * Initialize session management - prevents multiple concurrent calls
   */
  public async initializeSession(): Promise<void> {
    // Return existing promise if initialization is in progress
    if (this.initializationPromise) {
      console.log('🔄 Session initialization already in progress, waiting...');
      return this.initializationPromise;
    }

    if (this.isInitialized) {
      console.log('✅ Session already initialized, skipping...');
      return;
    }

    // Create initialization promise to prevent concurrent calls
    this.initializationPromise = this.performInitialization();
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    console.log('🚀 Starting AuthSessionManager initialization...');
    
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('🔍 Server-side environment detected, skipping session initialization');
        return;
      }

      // Get current auth state
      const currentState = store.getState().auth;
      
      console.log('📊 Current auth state:', {
        hasUser: Boolean(currentState.user),
        isHydrated: currentState.isHydrated,
        sessionInitialized: currentState.sessionInitialized,
        status: currentState.status
      });

      // Wait for hydration if needed
      if (!currentState.isHydrated) {
        console.log('⏳ Waiting for state hydration...');
        await this.waitForHydration();
      }

      // Mark as initialized before dispatching to prevent re-initialization
      this.isInitialized = true;

      // Dispatch initialization action
      store.dispatch(initializeApp());

      console.log('✅ AuthSessionManager initialization completed');

    } catch (error) {
      console.error('❌ AuthSessionManager initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Force a session check (bypasses throttling)
   */
  public forceSessionRefresh(): void {
    if (!this.isInitialized) {
      console.warn('⚠️ Cannot force refresh - manager not initialized');
      return;
    }
    
    console.log('🔄 Force session refresh triggered');
    store.dispatch(forceSessionCheck());
  }

  /**
   * Handle app visibility change (user switching tabs/apps)
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ App became visible, checking if session refresh needed');
      
      const authState = store.getState().auth;
      const now = Date.now();
      const VISIBILITY_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
      
      // If it's been more than 5 minutes since last check, force refresh
      if (authState.lastSessionCheck && 
          (now - authState.lastSessionCheck) > VISIBILITY_REFRESH_THRESHOLD) {
        console.log('⏰ Long time since last check, forcing session refresh');
        this.forceSessionRefresh();
      }
    }
  };

  /**
   * Handle before page unload to clean up
   */
  private handleBeforeUnload = (): void => {
    console.log('🔄 Page unloading, cleaning up session manager');
    this.cleanup();
  };

  /**
   * Setup browser event listeners for smart session management
   */
  private setupBrowserEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for visibility changes (tab switching, app backgrounding)
    this.visibilityChangeHandler = this.handleVisibilityChange;
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // Listen for page unload
    this.beforeUnloadHandler = this.handleBeforeUnload;
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored, checking session');
      this.forceSessionRefresh();
    });

    console.log('📱 Browser event listeners setup completed');
  }

  /**
   * Wait for Redux Persist hydration with timeout
   */
  private async waitForHydration(maxWait = 3000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkHydration = () => {
        const currentState = store.getState().auth;
        const elapsed = Date.now() - startTime;
        
        if (currentState.isHydrated || elapsed >= maxWait) {
          if (elapsed >= maxWait) {
            console.warn('⚠️ Hydration timeout reached, proceeding anyway');
          } else {
            console.log('✅ State hydration completed');
          }
          resolve();
        } else {
          setTimeout(checkHydration, 100);
        }
      };
      
      checkHydration();
    });
  }

  /**
   * Check if user has valid cached session
   */
  public hasCachedSession(): boolean {
    const authState = store.getState().auth;
    return Boolean(authState.user && authState.isHydrated);
  }

  /**
   * Get session info for debugging
   */
  public getSessionInfo(): { 
    isInitialized: boolean; 
    hasCachedSession: boolean; 
    authState: AuthState 
  } {
    return {
      isInitialized: this.isInitialized,
      hasCachedSession: this.hasCachedSession(),
      authState: store.getState().auth
    };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (typeof window === 'undefined') return;

    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    this.isInitialized = false;
  }

  /**
   * Reset session manager
   */
  public reset(): void {
    console.log('🔄 Resetting AuthSessionManager');
    this.cleanup();
    this.isInitialized = false;
    this.initializationPromise = null;
  }
}

export const authSessionManager = AuthSessionManager.getInstance();
