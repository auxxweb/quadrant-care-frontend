import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { cn } from '../../utils';
import { STATUS_META, type TimesheetStatus } from '../../constants';

export function Button({
  variant = 'primary',
  className,
  loading,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'; loading?: boolean }) {
  const styles = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    accent: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-white text-brand-600 ring-1 ring-slate-200 hover:bg-brand-50 dark:bg-slate-800 dark:text-white dark:ring-slate-700',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      className={cn('touch-btn inline-flex items-center justify-center gap-2 disabled:opacity-60', styles[variant], className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, className, ...props }, ref) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>}
      <input
        ref={ref}
        className={cn(
          'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none ring-brand-600 focus:ring-2 dark:border-slate-700 dark:bg-slate-900',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
});

export { Select } from './DropdownSelect';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card p-5', className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className={cn('rounded-2xl p-4 text-white shadow-card', accent ?? 'bg-gradient-to-br from-brand-600 to-brand-800')}>
      <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-2 break-words text-xl font-bold sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/80">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as TimesheetStatus] ?? { label: status.replaceAll('_', ' '), className: 'bg-slate-100 text-slate-700' };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', meta.className)}>{meta.label}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl dark:bg-brand-900/40">📋</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800', className)} />;
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0" aria-label="Close dialog" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => onChange(local), 300);
    return () => clearTimeout(t);
  }, [local, onChange]);
  return <Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder={placeholder ?? 'Search'} aria-label="Search" />;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions ? <div className="flex w-full flex-col gap-2 [&>*]:w-full sm:w-auto sm:flex-row sm:[&>*]:w-auto">{actions}</div> : null}
    </div>
  );
}
