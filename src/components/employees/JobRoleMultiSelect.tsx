import type { JobRole } from '../../types';
import { cn } from '../../utils';

export function JobRoleMultiSelect({
  roles,
  assignedIds,
  primaryId,
  onChange,
  error,
}: {
  roles: JobRole[];
  assignedIds: string[];
  primaryId: string;
  onChange: (assignedIds: string[], primaryId: string) => void;
  error?: string;
}) {
  const assigned = new Set(assignedIds);

  function toggle(id: string, checked: boolean) {
    if (!checked) {
      if (assignedIds.length <= 1) return;
      const next = assignedIds.filter((item) => item !== id);
      const nextPrimary = primaryId === id ? next[0] : primaryId;
      onChange(next, nextPrimary);
      return;
    }
    if (assigned.has(id)) return;
    const next = [...assignedIds, id];
    onChange(next, primaryId || id);
  }

  return (
    <div className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Job roles</span>
      {assignedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {assignedIds.map((id) => {
            const role = roles.find((item) => item._id === id);
            const isPrimary = id === primaryId;
            return (
              <span
                key={id}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
                  isPrimary
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
                )}
              >
                {role?.name || '—'}
                {isPrimary ? (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Primary</span>
                ) : (
                  <button
                    type="button"
                    className="text-[10px] uppercase tracking-wide underline-offset-2 hover:underline"
                    onClick={() => onChange(assignedIds, id)}
                  >
                    Set as primary
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
      <div className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
        {roles.map((role) => {
          const checked = assigned.has(role._id);
          const inactive = role.status !== 'ACTIVE';
          const lastChecked = checked && assignedIds.length <= 1;
          return (
            <label
              key={role._id}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm',
                checked ? 'bg-brand-50 dark:bg-brand-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800',
                inactive && 'opacity-70',
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={checked}
                disabled={(inactive && !checked) || lastChecked}
                onChange={(event) => toggle(role._id, event.target.checked)}
              />
              <span className="min-w-0 flex-1">
                {role.name}
                {inactive && <span className="ml-2 text-xs font-medium text-slate-500">Inactive</span>}
              </span>
            </label>
          );
        })}
        {!roles.length && <p className="px-3 py-4 text-sm text-slate-500">No job roles available.</p>}
      </div>
      <p className="text-xs text-slate-500">Select every role this employee can work. Mark one as primary for lists and the default timesheet role.</p>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
