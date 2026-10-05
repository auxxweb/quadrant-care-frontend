import { useSearchParams } from 'react-router-dom';
import { resolveDateRange, type DatePreset } from '../utils/dateRange';

export function useListFilters() {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const range = (params.get('range') ?? 'all') as DatePreset;
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const dates = resolveDateRange(range, from, to);

  function update(next: Record<string, string | undefined>) {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined) merged.delete(key);
      else merged.set(key, value);
    });
    setParams(merged, { replace: true });
  }

  return { params, search, range, from, to, dates, update };
}
