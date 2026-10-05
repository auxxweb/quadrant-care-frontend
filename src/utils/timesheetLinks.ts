export function timesheetBrowsePath(
  basePath: string,
  extras: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  Object.entries(extras).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function timesheetDetailPath(role: string | undefined, id: string) {
  if (role === 'ADMIN') return `/admin/timesheets/${id}`;
  if (role === 'SUPER_ADMIN') return `/super-admin/timesheets/${id}`;
  return `/staff/timesheets/${id}`;
}

export function timesheetNewPath(role: string | undefined) {
  return role === 'ADMIN' ? '/admin/timesheets/new' : '/staff/timesheets/new';
}
