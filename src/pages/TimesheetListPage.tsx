import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi, employeeApi, jobRoleApi, timesheetApi } from '../api/services';
import { Button, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { OfficialTimesheetForm } from '../components/timesheet/OfficialTimesheetForm';
import { ScopeTabs, TimesheetScopeFilters } from '../components/timesheet/TimesheetFilters';
import { ListFilters } from '../components/filters/ListFilters';
import { useListFilters } from '../hooks/useListFilters';
import { useAuth } from '../store/auth';
import { timesheetNewPath } from '../utils/timesheetLinks';
import { groupTimesheetsByEmployee } from '../utils/timesheetSheet';

const STAFF_FILTERS = [
  { value: '', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED,ADMIN_REVIEW,RESUBMITTED,SUPER_ADMIN_REVIEW', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ADMIN_REJECTED,SUPER_ADMIN_REJECTED', label: 'Rejected' },
];

const ADMIN_FILTERS = [
  { value: '', label: 'All' },
  { value: 'SUBMITTED,ADMIN_REVIEW,RESUBMITTED', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ADMIN_REJECTED,SUPER_ADMIN_REJECTED', label: 'Rejected' },
];

const SUPER_FILTERS = [
  { value: 'SUBMITTED,ADMIN_REVIEW,RESUBMITTED,SUPER_ADMIN_REVIEW', label: 'Pending' },
  { value: '', label: 'All' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ADMIN_REJECTED,SUPER_ADMIN_REJECTED', label: 'Rejected' },
];

const ADMIN_MINE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUPER_ADMIN_REVIEW', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SUPER_ADMIN_REJECTED', label: 'Rejected' },
];

export function TimesheetListPage({
  title,
  basePath,
  defaultStatus,
  hideScopeTabs,
}: {
  title: string;
  basePath: string;
  defaultStatus?: string;
  hideScopeTabs?: boolean;
}) {
  const { user } = useAuth();
  const { params, search, range, from, to, dates, update } = useListFilters();
  const status = params.has('status') ? (params.get('status') ?? '') : (defaultStatus ?? '');
  const defaultTab = user?.role === 'ADMIN' ? 'employees' : 'staff';
  const tab = hideScopeTabs ? '' : (params.get('tab') ?? defaultTab);
  const employeeId = params.get('employeeId') ?? '';
  const userId = params.get('userId') ?? '';
  const jobRoleId = params.get('jobRoleId') ?? '';

  const ownerRole = tab === 'mine' || tab === 'admins' ? 'ADMIN' : tab === 'employees' || tab === 'staff' ? 'STAFF' : undefined;
  const listUserId = tab === 'mine' ? user?.id : tab === 'admins' ? userId || undefined : undefined;
  const listEmployeeId = tab === 'employees' || tab === 'staff' ? employeeId || undefined : undefined;

  const employees = useQuery({
    queryKey: ['employees', 'dropdown'],
    queryFn: () => employeeApi.list({ limit: 200, status: 'ACTIVE' }),
    enabled: Boolean(user && user.role !== 'STAFF' && (tab === 'employees' || tab === 'staff' || !tab)),
  });
  const admins = useQuery({
    queryKey: ['admins', 'dropdown'],
    queryFn: () => adminApi.list({ limit: 200, status: 'ACTIVE' }),
    enabled: Boolean(user?.role === 'SUPER_ADMIN' && tab === 'admins'),
  });
  const roles = useQuery({
    queryKey: ['job-roles', { status: 'ACTIVE' }],
    queryFn: () => jobRoleApi.list({ status: 'ACTIVE' }),
    enabled: Boolean(user && user.role !== 'STAFF'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['timesheets', basePath, tab, status, search, dates.from, dates.to, listEmployeeId, listUserId, jobRoleId, ownerRole],
    queryFn: () =>
      timesheetApi.list({
        status: status || undefined,
        search: search || undefined,
        from: dates.from,
        to: dates.to,
        employeeId: listEmployeeId,
        userId: listUserId,
        jobRoleId: jobRoleId || undefined,
        ownerRole,
        limit: 200,
      }),
  });

  const isStaff = basePath.includes('/staff/');
  const canAdd = isStaff || (user?.role === 'ADMIN' && tab === 'mine');
  const statusFilters = isStaff ? STAFF_FILTERS : tab === 'mine' ? ADMIN_MINE_FILTERS : user?.role === 'SUPER_ADMIN' ? SUPER_FILTERS : ADMIN_FILTERS;
  const items = data?.items ?? [];
  const sheets = groupTimesheetsByEmployee(items);
  const pageTitle =
    tab === 'mine' ? 'My Timesheets' : tab === 'employees' ? 'Employee Timesheets' : tab === 'admins' ? 'Admin Timesheets' : tab === 'staff' ? 'Staff Timesheets' : title;

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={data ? `${data.total} ${data.total === 1 ? 'entry' : 'entries'} · ${sheets.length} sheet${sheets.length === 1 ? '' : 's'}` : undefined}
        actions={
          canAdd ? (
            <Link to={timesheetNewPath(user?.role)}><Button variant="accent">Add timesheet</Button></Link>
          ) : null
        }
      />
      {!hideScopeTabs && user?.role === 'ADMIN' && (
        <ScopeTabs
          tabs={[
            { value: 'mine', label: 'My timesheet' },
            { value: 'employees', label: 'Employee timesheet' },
          ]}
          value={tab}
          onChange={(value) => update({ tab: value, employeeId: undefined, userId: undefined, status: undefined })}
        />
      )}
      {!hideScopeTabs && user?.role === 'SUPER_ADMIN' && (
        <ScopeTabs
          tabs={[
            { value: 'admins', label: 'Admin timesheet' },
            { value: 'staff', label: 'Staff timesheet' },
          ]}
          value={tab}
          onChange={(value) => update({ tab: value, employeeId: undefined, userId: undefined, status: undefined })}
        />
      )}
      <ListFilters
        search={search}
        onSearch={(value) => update({ q: value || undefined })}
        range={range}
        onRange={(value) => update({ range: value === 'all' ? undefined : value, from: undefined, to: undefined })}
        from={from}
        to={to}
        onCustomDates={(nextFrom, nextTo) => update({ range: 'custom', from: nextFrom, to: nextTo })}
        searchPlaceholder="Search name, timesheet ID or care home"
        extra={
          <div className="space-y-3">
            <TimesheetScopeFilters
              employees={employees.data?.items}
              admins={admins.data?.items}
              jobRoles={roles.data?.items}
              employeeId={employeeId}
              userId={userId}
              jobRoleId={jobRoleId}
              onEmployee={(value) => update({ employeeId: value || undefined })}
              onUser={(value) => update({ userId: value || undefined })}
              onJobRole={(value) => update({ jobRoleId: value || undefined })}
              showEmployee={tab === 'employees' || tab === 'staff'}
              showAdmin={tab === 'admins'}
              showJobRole={tab === 'employees' || tab === 'staff'}
            />
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => update({ status: filter.value || undefined })}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-sm ${status === filter.value ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white ring-1 ring-slate-200 dark:bg-slate-900'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        }
      />
      {isLoading && <div className="grid gap-3"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>}
      {!isLoading && !items.length && (
        <EmptyState
          title="No timesheets found."
          description="Try another search, date range or filter."
          action={canAdd ? <Link to={timesheetNewPath(user?.role)}><Button>Add Timesheet</Button></Link> : null}
        />
      )}
      <div className="space-y-6">
        {sheets.map((entries) => (
          <OfficialTimesheetForm
            key={entries[0].userId || entries[0].employeeId || entries[0]._id}
            entries={entries}
            hrefFor={(entry) => `${basePath}/${entry._id}`}
          />
        ))}
      </div>
    </div>
  );
}
