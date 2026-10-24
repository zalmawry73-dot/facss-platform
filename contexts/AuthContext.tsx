'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { TokenPayload } from '@/lib/auth';
import IdleTimeoutModal from '@/components/auth/IdleTimeoutModal';

// 15 Minutes Inactivity Timeout & 60 Seconds Pre-logout Warning
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (900,000 ms)
export const IDLE_WARNING_MS = 60 * 1000;     // 60 seconds warning (60,000 ms)
export const LAST_ACTIVITY_KEY = 'facss_last_activity';
export const ACTIVE_TAB_SESSION_KEY = 'facss_active_tab_session';

interface AuthContextType {
  user: TokenPayload | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: (redirectUrl?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  resetIdleTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showIdleWarning, setShowIdleWarning] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(60);

  const lastActivityThrottledRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  // Safe helper to update last activity in localStorage
  const updateLastActivityStorage = useCallback((timestamp: number) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, timestamp.toString());
    } catch {
      // In case localStorage is disabled/restricted
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    const now = Date.now();
    lastActivityThrottledRef.current = now;
    updateLastActivityStorage(now);
    setShowIdleWarning(false);
  }, [updateLastActivityStorage]);

  const logout = useCallback(async (redirectUrl: string = '/login') => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          sessionStorage.removeItem(ACTIVE_TAB_SESSION_KEY);
        } catch {}
      }
      setShowIdleWarning(false);
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      isLoggingOutRef.current = false;
      if (redirectUrl && typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // 1. Strict Banking-Grade Session Enforcement:
      // If the browser tab or window was closed, sessionStorage is destroyed by the browser engine.
      // Opening a new tab without an active session in that tab requires fresh login!
      if (typeof window !== 'undefined') {
        const hasActiveTabSession = sessionStorage.getItem(ACTIVE_TAB_SESSION_KEY) === 'active';
        if (!hasActiveTabSession) {
          // Tab was closed or brand new tab opened! Clear session cookies and state immediately
          try {
            localStorage.removeItem(LAST_ACTIVITY_KEY);
          } catch {}
          await fetch('/api/auth/logout', { method: 'POST' });
          setUser(null);
          setLoading(false);
          return;
        }

        const storedLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (storedLastActivity) {
          const elapsed = Date.now() - Number(storedLastActivity);
          if (elapsed >= IDLE_TIMEOUT_MS) {
            // Inactivity threshold exceeded while browser was closed or platform was offline
            try {
              localStorage.removeItem(LAST_ACTIVITY_KEY);
              sessionStorage.removeItem(ACTIVE_TAB_SESSION_KEY);
            } catch {}
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            setLoading(false);

            // Redirect if user attempted to access protected administrative or portal pages
            const path = window.location.pathname;
            if (path.startsWith('/admin') || path.startsWith('/portal')) {
              window.location.href = '/login?reason=timeout';
            }
            return;
          }
        }
      }

      // 2. Fetch authenticated user profile
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          const now = Date.now();
          lastActivityThrottledRef.current = now;
          if (typeof window !== 'undefined' && !localStorage.getItem(LAST_ACTIVITY_KEY)) {
            updateLastActivityStorage(now);
          }
        } else {
          setUser(null);
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem(LAST_ACTIVITY_KEY);
              sessionStorage.removeItem(ACTIVE_TAB_SESSION_KEY);
            } catch {}
          }
        }
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            sessionStorage.removeItem(ACTIVE_TAB_SESSION_KEY);
          } catch {}
        }
      }
    } catch {
      setUser(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          sessionStorage.removeItem(ACTIVE_TAB_SESSION_KEY);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [updateLastActivityStorage]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }
      setUser(data.user);
      const now = Date.now();
      lastActivityThrottledRef.current = now;
      updateLastActivityStorage(now);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(ACTIVE_TAB_SESSION_KEY, 'active');
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error occurred' };
    }
  };

  // 3. User Activity Tracking & Heartbeat (Only active when user is logged in)
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    // Throttle writing activity timestamp (at most once every 3 seconds)
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityThrottledRef.current > 3000) {
        lastActivityThrottledRef.current = now;
        updateLastActivityStorage(now);
        setShowIdleWarning(false);
      }
    };

    // Cross-Tab Synchronization: if another tab is active, reset in this tab too
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        lastActivityThrottledRef.current = Number(e.newValue);
        setShowIdleWarning(false);
      }
    };

    const monitoredEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    monitoredEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });
    window.addEventListener('storage', handleStorageChange);

    // Periodic heartbeat to evaluate elapsed inactivity
    const heartbeatInterval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActive = stored ? Number(stored) : lastActivityThrottledRef.current;
      const elapsed = Date.now() - lastActive;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        // Exceeded 15 minutes of inactivity -> Log out automatically
        setShowIdleWarning(false);
        logout('/login?reason=timeout');
      } else if (elapsed >= (IDLE_TIMEOUT_MS - IDLE_WARNING_MS)) {
        // Within the final 60 seconds -> Display countdown warning modal
        const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
        setCountdownSeconds(remaining);
        setShowIdleWarning(true);
      } else {
        if (showIdleWarning) {
          setShowIdleWarning(false);
        }
      }
    }, 1000);

    return () => {
      monitoredEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(heartbeatInterval);
    };
  }, [user, updateLastActivityStorage, logout, showIdleWarning]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, resetIdleTimer }}>
      {children}
      {user && (
        <IdleTimeoutModal
          isOpen={showIdleWarning}
          countdownSeconds={countdownSeconds}
          onStayLoggedIn={resetIdleTimer}
          onLogoutNow={() => logout('/login')}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
