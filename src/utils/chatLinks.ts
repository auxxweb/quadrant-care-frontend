export function inboxPath(role?: string, id?: string) {
  const base = role === 'ADMIN' ? '/admin/inbox' : role === 'SUPER_ADMIN' ? '/super-admin/inbox' : '/staff/inbox';
  return id ? `${base}/${id}` : base;
}

export function roleLabel(role?: string) {
  if (role === 'SUPER_ADMIN') return 'Super Admin';
  if (role === 'ADMIN') return 'Admin';
  return 'Staff';
}
