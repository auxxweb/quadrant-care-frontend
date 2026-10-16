import { useAuth } from '../store/auth';

/** True when this Super Admin login is the productive-hours monitoring panel. */
export function useProductivePanel() {
  const { user } = useAuth();
  return user?.role === 'SUPER_ADMIN' && user.metricsFocus === 'PRODUCTIVE';
}

export function useMetricsFocus(): 'WORKED' | 'PRODUCTIVE' {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN' && user.metricsFocus === 'PRODUCTIVE') return 'PRODUCTIVE';
  return 'WORKED';
}
