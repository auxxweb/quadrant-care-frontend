import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; children: ReactNode };

function readOptions(children: ReactNode) {
  const options: { value: string; label: string; disabled?: boolean }[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== 'option') return;
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    options.push({
      value: String(props.value ?? ''),
      label: typeof props.children === 'string' || typeof props.children === 'number' ? String(props.children) : String(props.value ?? ''),
      disabled: props.disabled,
    });
  });
  return options;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, children, className, ...props },
  ref,
) {
  const options = useMemo(() => readOptions(children), [children]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [inner, setInner] = useState(String(props.value ?? ''));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });

  useEffect(() => {
    if (props.value !== undefined) setInner(String(props.value));
  }, [props.value]);

  function updateBox() {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const openBelow = below >= 180 || below >= above;
    const maxHeight = Math.min(320, Math.max(160, openBelow ? below : above));
    const top = openBelow ? rect.bottom + gap : Math.max(12, rect.top - gap - maxHeight);
    const width = Math.max(rect.width, Math.min(rect.width, window.innerWidth - 24));
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    setBox({ top, left, width, maxHeight });
  }

  useLayoutEffect(() => {
    if (!open) return;
    setQuery('');
    updateBox();
    const onWin = () => updateBox();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function pick(value: string) {
    setInner(value);
    const event = {
      target: { value, name: props.name ?? '' },
      currentTarget: { value, name: props.name ?? '' },
    } as ChangeEvent<HTMLSelectElement>;
    props.onChange?.(event);
    setOpen(false);
  }

  const selected = options.find((item) => item.value === inner);
  const display = selected?.label || options.find((item) => item.value === '')?.label || 'Select';
  const filtered = query
    ? options.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>}
      <select ref={ref} className="sr-only" tabIndex={-1} aria-hidden {...props} value={props.value ?? inner}>
        {children}
      </select>
      <button
        ref={triggerRef}
        type="button"
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label || props['aria-label'] || 'Select'}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-base outline-none ring-brand-600 focus:ring-2 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900',
          className,
        )}
      >
        <span className={cn('min-w-0 truncate', !inner && 'text-slate-400')}>{display}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className={cn('h-4 w-4 shrink-0 text-slate-400 transition', open && 'rotate-180')} aria-hidden>
          <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60] bg-slate-900/30" onClick={() => setOpen(false)} />
            <div
              role="listbox"
              className="fixed z-[70] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
            >
              {options.length > 8 && (
                <div className="border-b border-slate-100 p-2 dark:border-slate-800">
                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search"
                    className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-brand-600 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              )}
              <div className="overflow-y-auto p-1.5" style={{ maxHeight: options.length > 8 ? box.maxHeight - 58 : box.maxHeight }}>
                {filtered.map((option) => (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    role="option"
                    disabled={option.disabled}
                    aria-selected={inner === option.value}
                    className={cn(
                      'flex min-h-11 w-full items-center rounded-xl px-3 py-2.5 text-left text-sm',
                      inner === option.value ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-200' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                    )}
                    onClick={() => pick(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
                {!filtered.length && <p className="px-3 py-6 text-center text-sm text-slate-500">No matches</p>}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
});
