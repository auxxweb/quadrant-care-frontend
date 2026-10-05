import { Link } from 'react-router-dom';
import { cn } from '../../utils';

export type ActionTone = 'view' | 'edit' | 'timesheet' | 'danger';

export type RowAction = {
  label: string;
  to?: string;
  onClick?: () => void;
  tone?: ActionTone;
};

const tones: Record<ActionTone, string> = {
  view: 'bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800',
  edit: 'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800',
  timesheet: 'bg-brand-600 text-white ring-brand-600 hover:bg-brand-700',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800',
};

function Icon({ tone }: { tone: ActionTone }) {
  const className = 'h-3.5 w-3.5';
  if (tone === 'edit') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
        <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.25 8.25a2 2 0 0 1-.86.506l-3.04.76a.5.5 0 0 1-.606-.606l.76-3.04a2 2 0 0 1 .506-.86l8.25-8.25Z" />
      </svg>
    );
  }
  if (tone === 'timesheet') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
        <path fillRule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1Zm8 7H6v2h8V9Z" clipRule="evenodd" />
      </svg>
    );
  }
  if (tone === 'danger') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
        <path fillRule="evenodd" d="M8.5 3a1 1 0 0 0-.894.553L6.382 6H4a1 1 0 0 0 0 2h.13l.72 8.15A2 2 0 0 0 6.84 18h6.32a2 2 0 0 0 1.99-1.85L15.87 8H16a1 1 0 1 0 0-2h-2.382l-1.224-2.447A1 1 0 0 0 11.5 3h-3Zm1.5 5a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0V8Zm3 0a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0V8Z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M10 4.5C5.5 4.5 2.2 7.6 1 10c1.2 2.4 4.5 5.5 9 5.5s7.8-3.1 9-5.5c-1.2-2.4-4.5-5.5-9-5.5Zm0 9a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
    </svg>
  );
}

export function ActionButtons({ actions }: { actions: RowAction[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {actions.map((action) => {
        const tone = action.tone ?? 'view';
        const className = cn(
          'inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition sm:w-auto sm:rounded-full sm:py-1.5',
          tones[tone],
        );
        if (action.to) {
          return (
            <Link key={action.label} to={action.to} className={className}>
              <Icon tone={tone} />
              {action.label}
            </Link>
          );
        }
        return (
          <button key={action.label} type="button" onClick={action.onClick} className={className}>
            <Icon tone={tone} />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
