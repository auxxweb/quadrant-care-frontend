export function roleHome(role: string) {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'SUPER_ADMIN') return '/super-admin/dashboard';
  return '/staff/dashboard';
}
