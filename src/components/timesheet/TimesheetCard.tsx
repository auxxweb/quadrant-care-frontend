import { Link } from 'react-router-dom';
import type { Timesheet } from '../../types';
import { formatDate, fileUrl } from '../../utils';
import { StatusBadge } from '../ui';

export function TimesheetCard({ item, href }: { item: Timesheet; href: string }) {
  return (
    <article className="card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.timesheetId}</p>
          <p className="mt-0.5 font-semibold">{item.employeeSnapshot.name}</p>
          <p className="text-sm text-slate-500">{formatDate(item.date)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800/80">
        <div>
          <p className="text-xs text-slate-500">Shift</p>
          <p className="font-semibold">{item.startTime} → {item.endTime}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Hours</p>
          <p className="font-semibold">{item.totalHoursDisplay}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Break</p>
          <p className="font-semibold">{item.breakDuration} min</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Incharge</p>
          <p className="font-semibold">{item.inchargeName || '—'}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {item.careHomeSnapshot.name} · {item.jobRoleSnapshot.name}
      </p>
      {(item.careHomeSignaturePath || item.adminSignaturePath) && (
        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {item.careHomeSignaturePath ? 'Care home admin sign' : 'Admin sign'}
          </p>
          <img
            src={fileUrl(item.careHomeSignaturePath || item.adminSignaturePath)}
            alt="Signature"
            className="mt-1 h-10 max-w-[140px] object-contain"
          />
        </div>
      )}
      <Link to={href} className="touch-btn block w-full bg-white text-center text-brand-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white">
        View
      </Link>
    </article>
  );
}
