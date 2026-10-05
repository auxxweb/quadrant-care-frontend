export type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom' },
];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function resolveDateRange(preset: DatePreset, customFrom = '', customTo = '') {
  if (preset === 'all') return { from: undefined as string | undefined, to: undefined as string | undefined };
  if (preset === 'custom') {
    return {
      from: customFrom || undefined,
      to: customTo || undefined,
    };
  }

  const today = startOfLocalDay(new Date());
  if (preset === 'today') return { from: toDateKey(today), to: toDateKey(today) };

  if (preset === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return { from: toDateKey(yesterday), to: toDateKey(yesterday) };
  }

  if (preset === 'week') {
    const day = today.getDay() || 7;
    const start = new Date(today);
    start.setDate(today.getDate() - day + 1);
    return { from: toDateKey(start), to: toDateKey(today) };
  }

  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateKey(start), to: toDateKey(today) };
  }

  const start = new Date(today.getFullYear(), 0, 1);
  return { from: toDateKey(start), to: toDateKey(today) };
}
