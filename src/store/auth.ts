import { createContext, useContext } from 'react';
import type { AuthUser, Employee } from '../types';

export interface AuthState {
  user: AuthUser | null;
  employee: Employee | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  loginPasscode: (identifier: string, passcode: string) => Promise<AuthUser>;
  signup: (payload: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
    jobRoleId: string;
    careHomeId: string;
    joiningDate?: string;
    passcode?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
