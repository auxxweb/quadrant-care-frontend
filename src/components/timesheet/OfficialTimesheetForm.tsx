import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';
import { COMPANY_DETAILS, STATUS_META, type TimesheetStatus } from '../../constants';
import { fileUrl } from '../../utils';
import { formatClockHours, formatSheetDate, sheetWeekLabel, sortTimesheets } from '../../utils/timesheetSheet';
import { cn } from '../../utils';
import { useAuth } from '../../store/auth';
import type { Timesheet } from '../../types';

const COLUMNS = [
  'SL NO',
  'DATE',
  'Start Time',
  'End Time',
  'BREAK Duration',
  'Total Hours Worked',
  'JOB ROLE',
  'CARE HOME',
  'INCHARGE',
  'ADMIN SIGN',
  'Remarks',
];

function displaySignPath(item: Timesheet) {
  return item.careHomeSignaturePath || item.adminSignaturePath;
}

function personName(value?: { name?: string } | string) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.name ?? '';
}

export function OfficialTimesheetForm({
  entries,
  hrefFor,
  activeId,
  showReviewDetails = false,
}: {
  entries: Timesheet[];
  hrefFor?: (item: Timesheet) => string;
  activeId?: string;
  showReviewDetails?: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const items = sortTimesheets(entries);
  const primary = items[0];
  if (!primary) return null;

  const canManagerEdit = Boolean(
    user
    && primary.ownerRole !== 'ADMIN'
    && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'),
  );

  const totalMinutes = items.reduce((sum, item) => sum + (item.totalMinutes || 0), 0);
  const supervisor = items.find((item) => item.inchargeName)?.inchargeName;
  const careHome = items.find((item) => item.careHomeSnapshot?.name)?.careHomeSnapshot.name;
  const signed = items.find((item) => displaySignPath(item));
  const adminName = personName(items.find((item) => item.adminReviewedBy)?.adminReviewedBy);
  const superName = personName(items.find((item) => item.superAdminApprovedBy)?.superAdminApprovedBy);
  const adminRemarks = items.find((item) => item.adminRemarks)?.adminRemarks;
  const superRemarks = items.find((item) => item.superAdminRemarks)?.superAdminRemarks;
  const rejection = items.find((item) => item.rejectionReason)?.rejectionReason;
  const statusMeta = STATUS_META[primary.status as TimesheetStatus];
  const isAdminSheet = primary.ownerRole === 'ADMIN';
  const columns = [
    ...(isAdminSheet ? COLUMNS.filter((heading) => heading !== 'JOB ROLE') : COLUMNS),
    ...(canManagerEdit ? [''] : []),
  ];
  const showApprovals = showReviewDetails && Boolean(
    signed || adminName || adminRemarks || superName || superRemarks || rejection,
  );

  return (
    <section className="official-timesheet print-sheet overflow-hidden bg-white text-slate-900 shadow-card ring-1 ring-slate-300">
      <header className="grid gap-3 border-b border-slate-300 px-3 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:px-5">
        <BrandLogo className="h-14 w-auto justify-self-start rounded-none bg-transparent sm:h-20" />
        <div className="min-w-0 text-center">
          <p className="text-xs text-slate-500">Company No: {COMPANY_DETAILS.companyNo}</p>
          <div className="mx-auto mt-2 inline-block bg-slate-700 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white sm:px-8 sm:text-sm sm:tracking-[0.28em]">
            Time sheet
          </div>
        </div>
        <div className="text-left text-[11px] leading-5 text-slate-600 sm:text-right">
          <p>Contact: {COMPANY_DETAILS.phone}</p>
          <p className="break-all">{COMPANY_DETAILS.email}</p>
          <p>{COMPANY_DETAILS.website}</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 px-3 py-2 text-xs sm:px-5">
        <p className="font-semibold uppercase tracking-wide text-slate-500">
          {primary.ownerRole === 'ADMIN' ? 'Admin timesheet' : 'Employee timesheet'}
          {items.length === 1 && primary.timesheetId ? ` · ${primary.timesheetId}` : items.length > 1 ? ` · ${items.length} entries` : ''}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {items.length === 1 && statusMeta && (
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', statusMeta.className)}>
              {statusMeta.label}
            </span>
          )}
          <p>
            <span className="font-semibold uppercase tracking-wide text-slate-500">Week: </span>
            {sheetWeekLabel(items)}
          </p>
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-2 border-b border-slate-300 px-3 py-3 text-sm sm:grid-cols-2 sm:px-5">
        <div className="flex gap-2 border-b border-dotted border-slate-400 pb-1">
          <dt className="shrink-0 font-semibold uppercase text-slate-500">Name</dt>
          <dd className="font-semibold">{primary.employeeSnapshot?.name || '—'}</dd>
        </div>
        {!isAdminSheet && (
          <div className="flex gap-2 border-b border-dotted border-slate-400 pb-1">
            <dt className="shrink-0 font-semibold uppercase text-slate-500">Job role</dt>
            <dd className="font-semibold">{primary.jobRoleSnapshot?.name || '—'}</dd>
          </div>
        )}
        {careHome && (
          <div className="flex gap-2 border-b border-dotted border-slate-400 pb-1">
            <dt className="shrink-0 font-semibold uppercase text-slate-500">Care home</dt>
            <dd className="font-semibold">{careHome}</dd>
          </div>
        )}
        {supervisor && (
          <div className="flex gap-2 border-b border-dotted border-slate-400 pb-1">
            <dt className="shrink-0 font-semibold uppercase text-slate-500">Supervisor</dt>
            <dd className="font-semibold">{supervisor}</dd>
          </div>
        )}
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="bg-slate-200">
              {columns.map((heading) => (
                <th key={heading} className="border border-slate-400 px-2 py-2 font-semibold uppercase tracking-wide">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const href = hrefFor?.(item);
              return (
                <tr
                  key={item._id}
                  className={cn(
                    'bg-white',
                    href && 'cursor-pointer hover:bg-slate-50',
                    activeId === item._id && 'bg-brand-50',
                  )}
                  onClick={() => href && navigate(href)}
                >
                  <td className="border border-slate-400 px-2 py-2 text-center">{index + 1}</td>
                  <td className="border border-slate-400 px-2 py-2">{formatSheetDate(item.date)}</td>
                  <td className="border border-slate-400 px-2 py-2">{item.startTime}</td>
                  <td className="border border-slate-400 px-2 py-2">{item.endTime}</td>
                  <td className="border border-slate-400 px-2 py-2">{item.breakDuration}</td>
                  <td className="border border-slate-400 px-2 py-2">{item.totalHoursDisplay}</td>
                  {!isAdminSheet && <td className="border border-slate-400 px-2 py-2">{item.jobRoleSnapshot?.name || ''}</td>}
                  <td className="border border-slate-400 px-2 py-2">{item.careHomeSnapshot?.name || ''}</td>
                  <td className="border border-slate-400 px-2 py-2">{item.inchargeName || ''}</td>
                  <td className="border border-slate-400 px-2 py-1">
                    {displaySignPath(item) ? (
                      <img src={fileUrl(displaySignPath(item))} alt="Admin signature" className="h-8 max-w-[120px] object-contain" />
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="border border-slate-400 px-2 py-2">{item.remarks || ''}</td>
                  {canManagerEdit && (
                    <td className="border border-slate-400 px-2 py-2">
                      {href && (
                        <button
                          type="button"
                          className="font-semibold text-brand-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${href}${href.includes('?') ? '&' : '?'}edit=hours`);
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            <tr className="bg-slate-100 font-semibold">
              <td className="border border-slate-400 px-2 py-2" colSpan={4} />
              <td className="border border-slate-400 px-2 py-2 uppercase">Totals</td>
              <td className="border border-slate-400 px-2 py-2">{formatClockHours(totalMinutes)}</td>
              <td className="border border-slate-400 px-2 py-2" colSpan={isAdminSheet ? (canManagerEdit ? 5 : 4) : (canManagerEdit ? 6 : 5)} />
            </tr>
          </tbody>
        </table>
      </div>

      {showApprovals && (
        <div className="grid gap-3 border-t border-slate-300 px-3 py-3 text-sm sm:grid-cols-2 sm:px-5">
          {items.some((item) => item.careHomeSignaturePath) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Care home admin signature</p>
              <img
                src={fileUrl(items.find((item) => item.careHomeSignaturePath)!.careHomeSignaturePath)}
                alt="Care home admin signature"
                className="mt-1 h-12 max-w-[180px] object-contain"
              />
              {items.find((item) => item.careHomeSignaturePath)?.inchargeName && (
                <p className="mt-1 text-xs text-slate-600">
                  Signed by {items.find((item) => item.careHomeSignaturePath)?.inchargeName}
                </p>
              )}
            </div>
          )}
          {items.some((item) => item.adminSignaturePath) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin signature</p>
              <img
                src={fileUrl(items.find((item) => item.adminSignaturePath)!.adminSignaturePath)}
                alt="Admin signature"
                className="mt-1 h-12 max-w-[180px] object-contain"
              />
              {adminName && <p className="mt-1 text-xs text-slate-600">Signed by {adminName}</p>}
            </div>
          )}
          {!items.some((item) => item.careHomeSignaturePath || item.adminSignaturePath) && adminName && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewed by</p>
              <p className="font-medium">{adminName}</p>
            </div>
          )}
          {adminRemarks && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin remarks</p>
              <p>{adminRemarks}</p>
            </div>
          )}
          {superName && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Super Admin</p>
              <p className="font-medium">{superName}</p>
            </div>
          )}
          {superRemarks && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval remarks</p>
              <p>{superRemarks}</p>
            </div>
          )}
          {rejection && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Rejection reason</p>
              <p className="text-red-700">{rejection}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
