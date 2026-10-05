import { forwardRef, type SelectHTMLAttributes } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { Select } from '../ui';

type InchargeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
};

export const InchargeSelect = forwardRef<HTMLSelectElement, InchargeSelectProps>(function InchargeSelect(
  { value, error, ...props },
  ref,
) {
  const { data, isLoading } = useQuery({
    queryKey: ['admins', 'directory'],
    queryFn: adminApi.directory,
  });

  const items = (data?.items ?? []).filter((item) => item.role !== 'SUPER_ADMIN');
  const selected = typeof value === 'string' ? value : '';
  const extra = selected && !items.some((item) => item.name === selected) ? [selected] : [];

  return (
    <Select ref={ref} label="Incharge / supervisor" value={value} error={error} {...props}>
      <option value="">{isLoading ? 'Loading admins…' : 'Select an admin'}</option>
      {extra.map((name) => (
        <option key={`extra-${name}`} value={name}>{name}</option>
      ))}
      {items.map((admin) => (
        <option key={admin.id} value={admin.name}>
          {admin.name}{admin.adminId ? ` · ${admin.adminId}` : ''}
        </option>
      ))}
    </Select>
  );
});
