import { cn } from '../../utils';
import { Select } from '../ui';
import type { AuthUser, Employee, JobRole } from '../../types';

export function ScopeTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-xl px-3 py-2.5 text-sm font-semibold transition',
            value === tab.value ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TimesheetScopeFilters({
  employees,
  admins,
  jobRoles,
  employeeId,
  userId,
  jobRoleId,
  onEmployee,
  onUser,
  onJobRole,
  showEmployee,
  showAdmin,
  showJobRole,
}: {
  employees?: Employee[];
  admins?: AuthUser[];
  jobRoles?: JobRole[];
  employeeId?: string;
  userId?: string;
  jobRoleId?: string;
  onEmployee?: (value: string) => void;
  onUser?: (value: string) => void;
  onJobRole?: (value: string) => void;
  showEmployee?: boolean;
  showAdmin?: boolean;
  showJobRole?: boolean;
}) {
  if (!showEmployee && !showAdmin && !showJobRole) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {showEmployee && (
        <Select label="Employee" value={employeeId ?? ''} onChange={(e) => onEmployee?.(e.target.value)}>
          <option value="">All employees</option>
          {employees?.map((item) => (
            <option key={item._id} value={item._id}>
              {item.fullName} · {item.employeeId}
            </option>
          ))}
        </Select>
      )}
      {showAdmin && (
        <Select label="Admin" value={userId ?? ''} onChange={(e) => onUser?.(e.target.value)}>
          <option value="">All admins</option>
          {admins?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}{item.adminId ? ` · ${item.adminId}` : ''}
            </option>
          ))}
        </Select>
      )}
      {showJobRole && (
        <Select label="Job role" value={jobRoleId ?? ''} onChange={(e) => onJobRole?.(e.target.value)}>
          <option value="">All job roles</option>
          {jobRoles?.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
