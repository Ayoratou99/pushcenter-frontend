import type { ReactNode } from 'react';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { authService } from 'src/services/auth.service';
import { setSessionExpiredHandler } from 'src/services/api.client';

import { tokenStorage } from './tokens';

import type { AuthUser, LoginResult } from './types';

// ----------------------------------------------------------------------

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** True once the user has signed in but Google Authenticator is not set up. */
  needsTwoFactorSetup: boolean;
  login: (email: string, password: string, code?: string) => Promise<LoginResult>;
  completeTwoFactor: (challengeToken: string, code: string) => Promise<void>;
  /** Called by the setup wizard once the enrolment has been confirmed. */
  finishTwoFactorSetup: (user?: AuthUser) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  hasRole: (...roles: string[]) => boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    if (!tokenStorage.getAccessToken()) {
      setUser(null);
      return null;
    }

    try {
      const me = await authService.me();
      setUser(me);
      return me;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  // Restore the session on first paint.
  useEffect(() => {
    let active = true;

    (async () => {
      await refreshUser();
      if (active) {
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  // A refresh token rejected by the API means the session is over.
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));

    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string, code?: string) => {
      const result = await authService.login(email, password, code);

      if (result.status === 'authenticated') {
        await refreshUser();
      }

      return result;
    },
    [refreshUser]
  );

  const completeTwoFactor = useCallback(
    async (challengeToken: string, code: string) => {
      await authService.loginTwoFactor(challengeToken, code);
      await refreshUser();
    },
    [refreshUser]
  );

  const finishTwoFactorSetup = useCallback(
    async (confirmed?: AuthUser) => {
      if (confirmed) {
        setUser(confirmed);
        return;
      }

      await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(
    async (allDevices = false) => {
      try {
        await authService.logout(allDevices);
      } finally {
        clearSession();
      }
    },
    [clearSession]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      needsTwoFactorSetup: !!user && !user.two_factor_enabled,
      login,
      completeTwoFactor,
      finishTwoFactorSetup,
      logout,
      refreshUser,
      hasRole: (...roles: string[]) => !!user && roles.includes(user.role),
      isAdmin: user?.role === 'admin',
    }),
    [user, loading, login, completeTwoFactor, finishTwoFactorSetup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used inside <AuthProvider>');
  }

  return context;
}
