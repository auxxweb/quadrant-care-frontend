import { cn } from '../../utils';

type TimeInputProps = {
  label?: string;
  error?: string;
  /** 24-hour "HH:mm" value; kept in this format so storage and duration maths are unchanged. */
  value: string;
  onChange: (value: string) => void;
  minuteStep?: number;
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

function parse(value: string) {
  const [h, m] = (value || '00:00').split(':').map(Number);
  const hour24 = Number.isFinite(h) ? h : 0;
  return {
    hour12: hour24 % 12 || 12,
    minute: Number.isFinite(m) ? m : 0,
    period: hour24 >= 12 ? 'PM' : 'AM',
  };
}

function toValue(hour12: number, minute: number, period: string) {
  const hour24 = (hour12 % 12) + (period === 'PM' ? 12 : 0);
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const selectClass = 'min-h-12 appearance-none bg-transparent px-1 text-center text-base outline-none';

export function TimeInput({ label, error, value, onChange, minuteStep = 5 }: TimeInputProps) {
  const { hour12, minute, period } = parse(value);
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);
  // Keep a stored minute that isn't on the step grid selectable.
  if (!minutes.includes(minute)) {
    minutes.push(minute);
    minutes.sort((a, b) => a - b);
  }

  return (
    <div className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>}
      <div className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 ring-brand-600 focus-within:ring-2 dark:border-slate-700 dark:bg-slate-900">
        <select aria-label={`${label ?? 'Time'} hour`} className={selectClass} value={hour12} onChange={(e) => onChange(toValue(Number(e.target.value), minute, period))}>
          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-slate-400">:</span>
        <select aria-label={`${label ?? 'Time'} minute`} className={selectClass} value={minute} onChange={(e) => onChange(toValue(hour12, Number(e.target.value), period))}>
          {minutes.map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
        </select>
        <select aria-label={`${label ?? 'Time'} AM or PM`} className={cn(selectClass, 'ml-1 font-medium')} value={period} onChange={(e) => onChange(toValue(hour12, minute, e.target.value))}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
