import { useEffect, useState, type ReactNode } from 'react';
import { DATE_PRESETS, type DatePreset } from '../../utils/dateRange';
import { Input, Select } from '../ui';

export function ListFilters({
  search,
  onSearch,
  range,
  onRange,
  from,
  to,
  onCustomDates,
  searchPlaceholder = 'Search',
  extra,
}: {
  search: string;
  onSearch: (value: string) => void;
  range: DatePreset;
  onRange: (value: DatePreset) => void;
  from: string;
  to: string;
  onCustomDates: (from: string, to: string) => void;
  searchPlaceholder?: string;
  extra?: ReactNode;
}) {
  const [localSearch, setLocalSearch] = useState(search);
  useEffect(() => setLocalSearch(search), [search]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) onSearch(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search]);

  return (
    <div className="mb-5 space-y-3 no-print">
      <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
        <Input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search"
        />
        <Select
          value={range}
          aria-label="Date filter"
          onChange={(e) => onRange(e.target.value as DatePreset)}
        >
          {DATE_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </Select>
      </div>
      {range === 'custom' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="From" type="date" value={from} onChange={(e) => onCustomDates(e.target.value, to)} />
          <Input label="To" type="date" value={to} onChange={(e) => onCustomDates(from, e.target.value)} />
        </div>
      )}
      {extra}
    </div>
  );
}
