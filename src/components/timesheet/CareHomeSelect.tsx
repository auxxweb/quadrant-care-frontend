import { forwardRef, type SelectHTMLAttributes } from 'react';
import { useQuery } from '@tanstack/react-query';
import { careHomeApi } from '../../api/services';
import { Select } from '../ui';

type CareHomeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
};

export const CareHomeSelect = forwardRef<HTMLSelectElement, CareHomeSelectProps>(function CareHomeSelect(
  { error, ...props },
  ref,
) {
  const { data, isLoading } = useQuery({
    queryKey: ['care-homes', { status: 'ACTIVE' }],
    queryFn: () => careHomeApi.list({ status: 'ACTIVE' }),
  });

  return (
    <Select ref={ref} label="Care home" error={error} {...props}>
      <option value="">{isLoading ? 'Loading care homes…' : 'Select a care home'}</option>
      {(data?.items ?? []).map((home) => (
        <option key={home._id} value={home._id}>
          {home.name}
        </option>
      ))}
    </Select>
  );
});
