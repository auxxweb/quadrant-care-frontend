import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/services';
import { refreshAccessToken, setAccessToken } from '../api/client';
import { AuthContext, type AuthState } from '../store/auth';
import type { AuthUser, Employee } from '../types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    const data = await authApi.me();
    setUser(data.user);
    setEmployee(data.employee);
    applyTheme(data.user.themePreference);
  }

  useEffect(() => {
    refreshAccessToken()
      .then(async (token) => {
        if (token) await refreshMe();
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      employee,
      loading,
      async login(identifier: string, password: string) {
        const data = await authApi.login(identifier, password);
        setAccessToken(data.accessToken);
        setUser(data.user);
        applyTheme(data.user.themePreference);
        await refreshMe();
        return data.user as AuthUser;
      },
      async loginPasscode(identifier: string, passcode: string) {
        const data = await authApi.loginPasscode(identifier, passcode);
        setAccessToken(data.accessToken);
        setUser(data.user);
        await refreshMe();
        return data.user as AuthUser;
      },
      async signup(payload: Parameters<AuthState['signup']>[0]) {
        const data = await authApi.signup(payload);
        setAccessToken(data.accessToken);
        setUser(data.user);
        applyTheme(data.user.themePreference);
        await refreshMe();
        return data.user as AuthUser;
      },
      async logout() {
        await authApi.logout();
        setAccessToken('');
        setUser(null);
        setEmployee(null);
      },
      refreshMe,
    }),
    [user, employee, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function applyTheme(preference?: string) {
  const root = document.documentElement;
  const dark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', Boolean(dark));
}
