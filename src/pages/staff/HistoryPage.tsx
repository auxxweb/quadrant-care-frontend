import { useQuery } from '@tanstack/react-query';
import { timesheetApi } from '../../api/services';
import { formatMinutes } from '../../utils';
import { Button, Card, EmptyState, PageHeader, Skeleton } from '../../components/ui';
import { OfficialTimesheetForm } from '../../components/timesheet/OfficialTimesheetForm';
import { groupTimesheetsByEmployee } from '../../utils/timesheetSheet';
import { ListFilters } from '../../components/filters/ListFilters';
import { useListFilters } from '../../hooks/useListFilters';
import { useState } from 'react';

export function HistoryPage() {
  const [offset, setOffset] = useState(0);
  const { search, range, from, to, dates, update } = useListFilters();
  const weekStart = new Date();
  const day = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - day + 1 + offset * 7);
  const key = weekStart.toISOString().slice(0, 10);
  const weekly = useQuery({ queryKey: ['weekly', key], queryFn: () => timesheetApi.weekly({ week: key }) });
  const monthly = useQuery({ queryKey: ['monthly'], queryFn: () => timesheetApi.monthly() });
  const timesheets = useQuery({
    queryKey: ['timesheets', '/staff/timesheets', 'history', search, dates.from, dates.to],
    queryFn: () => timesheetApi.list({ search: search || undefined, from: dates.from, to: dates.to, limit: 200 }),
  });
  if (weekly.isLoading) return <Skeleton className="h-64" />;
  return (
    <div className="space-y-5">
      <PageHeader title="History" subtitle={timesheets.data ? `${timesheets.data.total} timesheets` : 'Weekly and monthly hours'} />
      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setOffset((v) => v - 1)}>Previous</Button>
        <p className="text-center text-sm font-medium">Week of {key}</p>
        <Button variant="secondary" onClick={() => setOffset((v) => v + 1)}>Next</Button>
      </div>
      <div className="grid gap-2">
        {weekly.data?.days.map((dayItem: { date: string; minutes: number }) => (
          <Card key={dayItem.date} className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate">{new Date(dayItem.date).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}</span>
            <strong className="shrink-0">{formatMinutes(dayItem.minutes)}</strong>
          </Card>
        ))}
      </div>
      <Card>
        <p className="text-sm text-slate-500">Week total</p>
        <p className="text-3xl font-bold">{formatMinutes(weekly.data?.totalMinutes ?? 0)}</p>
      </Card>
      {monthly.data && (
        <div className="grid grid-cols-2 gap-3">
          <Card><p className="text-xs text-slate-500">Shifts</p><p className="text-2xl font-bold">{monthly.data.totalShifts}</p></Card>
          <Card><p className="text-xs text-slate-500">Total hours</p><p className="text-2xl font-bold">{formatMinutes(monthly.data.totalMinutes)}</p></Card>
          <Card><p className="text-xs text-slate-500">Approved hours</p><p className="text-2xl font-bold">{formatMinutes(monthly.data.approvedMinutes)}</p></Card>
          <Card><p className="text-xs text-slate-500">Rejected entries</p><p className="text-2xl font-bold">{monthly.data.rejected}</p></Card>
        </div>
      )}
      <div>
        <h2 className="mb-3 text-lg font-semibold">All timesheets</h2>
        <ListFilters
          search={search}
          onSearch={(value) => update({ q: value })}
          range={range}
          onRange={(value) => update({ range: value === 'all' ? undefined : value, from: undefined, to: undefined })}
          from={from}
          to={to}
          onCustomDates={(nextFrom, nextTo) => update({ range: 'custom', from: nextFrom, to: nextTo })}
          searchPlaceholder="Search your timesheets"
        />
        {timesheets.isLoading && <Skeleton className="h-32" />}
        {!timesheets.isLoading && !timesheets.data?.items.length && (
          <EmptyState title="No timesheets found." description="Try another search or date range." />
        )}
        <div className="space-y-6">
          {groupTimesheetsByEmployee(timesheets.data?.items ?? []).map((entries) => (
            <OfficialTimesheetForm
              key={entries[0].userId || entries[0]._id}
              entries={entries}
              hrefFor={(entry) => `/staff/timesheets/${entry._id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
