import { Link } from 'react-router-dom';
import type { Timesheet } from '../../types';
import { formatDate, fileUrl } from '../../utils';
import { StatusBadge } from '../ui';

export function TimesheetShiftList({
  items,
  hrefFor,
  showEmployee = false,
}: {
  items: Timesheet[];
  hrefFor: (item: Timesheet) => string;
  showEmployee?: boolean;
}) {
  const columns = [
    'SL NO',
    ...(showEmployee ? ['NAME'] : []),
    'DATE',
    'START',
    'END',
    'BREAK',
    'HOURS',
    'JOB ROLE',
    'INCHARGE',
    'SIGN',
    'REMARKS',
    'STATUS',
    '',
  ];
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 md:block dark:bg-slate-900 dark:ring-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              {columns.map((heading) => (
                <th key={heading || 'view'} className="px-3 py-2 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const signPath = item.careHomeSignaturePath || item.adminSignaturePath;
              return (
              <tr key={item._id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-3">{index + 1}</td>
                {showEmployee && <td className="px-3 py-3 font-semibold">{item.employeeSnapshot.name}</td>}
                <td className="px-3 py-3">{formatDate(item.date)}</td>
                <td className="px-3 py-3">{item.startTime}</td>
                <td className="px-3 py-3">{item.endTime}</td>
                <td className="px-3 py-3">{item.breakDuration}m</td>
                <td className="px-3 py-3">{item.totalHoursDisplay}</td>
                <td className="px-3 py-3">{item.jobRoleSnapshot.name}</td>
                <td className="px-3 py-3">{item.inchargeName || '—'}</td>
                <td className="px-3 py-3">
                  {signPath ? (
                    <img src={fileUrl(signPath)} alt="Signature" className="h-8 max-w-[100px] object-contain" />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-3">{item.remarks || '—'}</td>
                <td className="px-3 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-3 py-3">
                  <Link to={hrefFor(item)} className="font-semibold text-brand-600">View</Link>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {items.map((item) => {
          const signPath = item.careHomeSignaturePath || item.adminSignaturePath;
          return (
          <article key={item._id} className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.timesheetId}</p>
                {showEmployee && <p className="font-semibold">{item.employeeSnapshot.name}</p>}
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p>
              <span className="text-slate-500">Date:</span> {formatDate(item.date)}
            </p>
            <p>
              {item.startTime} → {item.endTime}
            </p>
            <p>Break {item.breakDuration} min · {item.totalHoursDisplay} hours</p>
            <p>Job role: {item.jobRoleSnapshot.name}</p>
            <p>Incharge: {item.inchargeName || '—'}</p>
            {signPath && (
              <div>
                <p className="text-slate-500">{item.careHomeSignaturePath ? 'Care home admin sign' : 'Admin sign'}</p>
                <img src={fileUrl(signPath)} alt="Signature" className="mt-1 h-10 max-w-[120px] object-contain" />
              </div>
            )}
            <p>Remarks: {item.remarks || '—'}</p>
            <Link to={hrefFor(item)} className="touch-btn mt-1 block w-full bg-white text-center text-brand-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white">
              View
            </Link>
          </article>
          );
        })}
      </div>
    </>
  );
}
