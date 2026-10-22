import { describe, expect, it } from 'vitest';
import { calculateShiftDuration, formatEmployeeJobRoles } from './index';
import type { Employee, JobRole } from '../types';

describe('frontend time util', () => {
  it('matches overnight shift behaviour', () => {
    expect(calculateShiftDuration('20:00', '08:00', 0).totalMinutes).toBe(720);
  });

  it('rejects a 24-hour shift', () => {
    expect(() => calculateShiftDuration('00:00', '00:00', 0)).toThrow(/less than 24 hours/);
  });
});

describe('formatEmployeeJobRoles', () => {
  const hca = { _id: '1', name: 'HCA', status: 'ACTIVE' } as JobRole;
  const senior = { _id: '2', name: 'Senior HCA', status: 'ACTIVE' } as JobRole;
  const employee = {
    jobRoleIds: [senior, hca],
    primaryJobRoleId: hca,
  } as Pick<Employee, 'jobRoleIds' | 'primaryJobRoleId'>;

  it('lists the primary role first', () => {
    expect(formatEmployeeJobRoles(employee)).toBe('HCA · Senior HCA');
  });

  it('compacts extra roles on lists', () => {
    expect(formatEmployeeJobRoles(employee, true)).toBe('HCA +1');
  });
});
