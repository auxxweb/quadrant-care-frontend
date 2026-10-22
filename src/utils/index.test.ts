import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { readOptions } from '../components/ui/dropdownOptions';
import {
  calculateShiftDuration,
  formatEmployeeJobRoles,
  formatOptionLabel,
  formatRecordStatus,
  jobRoleName,
} from './index';
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

  it('does not treat an unpopulated ObjectId as a role name', () => {
    expect(jobRoleName('64b1f2c3d4e5f6a7b8c9d0e1')).toBe('');
    expect(formatEmployeeJobRoles({
      jobRoleIds: ['64b1f2c3d4e5f6a7b8c9d0e1'],
      primaryJobRoleId: '64b1f2c3d4e5f6a7b8c9d0e1',
    })).toBe('');
  });
});

describe('display labels', () => {
  it('formats a person option as name plus business code', () => {
    expect(formatOptionLabel('Jane Smith', 'QC-EMP-0004')).toBe('Jane Smith (QC-EMP-0004)');
    expect(formatOptionLabel('Priya Patel', 'QC-ADM-0001')).toBe('Priya Patel (QC-ADM-0001)');
    expect(formatOptionLabel('HCA')).toBe('HCA');
  });

  it('never uses a Mongo ObjectId as a visible option label', () => {
    expect(formatOptionLabel('64b1f2c3d4e5f6a7b8c9d0e1', 'QC-EMP-0004')).toBe('QC-EMP-0004');
    expect(formatOptionLabel('Jane Smith', '64b1f2c3d4e5f6a7b8c9d0e1')).toBe('Jane Smith');
  });

  it('shows Active and Inactive instead of enum codes', () => {
    expect(formatRecordStatus('ACTIVE')).toBe('Active');
    expect(formatRecordStatus('INACTIVE')).toBe('Inactive');
  });
});

describe('dropdown option labels', () => {
  it('keeps composed option children as the label instead of the Mongo value', () => {
    const options = readOptions([
      createElement('option', { value: '64b1f2c3d4e5f6a7b8c9d0e1', key: 'jane' }, 'Jane Smith', ' (QC-EMP-0004)'),
      createElement('option', { value: '64b1f2c3d4e5f6a7b8c9d0e2', key: 'hca' }, 'HCA', ' (primary)'),
    ]);
    expect(options[0]).toMatchObject({
      value: '64b1f2c3d4e5f6a7b8c9d0e1',
      label: 'Jane Smith (QC-EMP-0004)',
    });
    expect(options[1]).toMatchObject({
      value: '64b1f2c3d4e5f6a7b8c9d0e2',
      label: 'HCA (primary)',
    });
  });
});
