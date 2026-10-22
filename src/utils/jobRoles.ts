import type { Employee, JobRole } from '../types';
import { displayName } from './labels';

export function jobRoleId(role: JobRole | string | undefined): string {
  if (!role) return '';
  return typeof role === 'string' ? role : role._id;
}

export function jobRoleName(role: JobRole | string | undefined): string {
  if (!role) return '';
  return typeof role === 'string' ? displayName(role) : displayName(role.name);
}

export function employeeJobRoles(employee?: Pick<Employee, 'jobRoleIds'> | null): JobRole[] {
  return (employee?.jobRoleIds ?? [])
    .map((role) => (typeof role === 'string' ? undefined : role))
    .filter((role): role is JobRole => Boolean(role));
}

export function employeePrimaryJobRole(employee?: Pick<Employee, 'jobRoleIds' | 'primaryJobRoleId'> | null): JobRole | undefined {
  const roles = employeeJobRoles(employee);
  const primaryId = jobRoleId(employee?.primaryJobRoleId);
  return roles.find((role) => role._id === primaryId)
    ?? (employee?.primaryJobRoleId && typeof employee.primaryJobRoleId !== 'string' ? employee.primaryJobRoleId : undefined)
    ?? roles[0];
}

export function formatEmployeeJobRoles(
  employee?: Pick<Employee, 'jobRoleIds' | 'primaryJobRoleId'> | null,
  compact = false,
): string {
  const roles = employeeJobRoles(employee);
  if (!roles.length) {
    const fallback = jobRoleName(employee?.primaryJobRoleId);
    return fallback || '';
  }
  const primaryId = jobRoleId(employee?.primaryJobRoleId);
  const sorted = [...roles].sort((a, b) => {
    if (a._id === primaryId) return -1;
    if (b._id === primaryId) return 1;
    return a.name.localeCompare(b.name);
  });
  if (compact && sorted.length > 1) return `${sorted[0].name} +${sorted.length - 1}`;
  return sorted.map((role) => role.name).join(' · ');
}
