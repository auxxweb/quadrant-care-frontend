import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { employeeApi, jobRoleApi } from '../../api/services';
import { Button, Card, ConfirmDialog, EmptyState, Input, PageHeader, RecordStatusPill, Skeleton } from '../../components/ui';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { JobRoleMultiSelect } from '../../components/employees/JobRoleMultiSelect';
import { ListFilters } from '../../components/filters/ListFilters';
import { useListFilters } from '../../hooks/useListFilters';
import { fileUrl, formatEmployeeJobRoles, jobRoleId } from '../../utils';
import { timesheetBrowsePath } from '../../utils/timesheetLinks';
import { useEffect, useMemo, useState } from 'react';
import type { Employee, JobRole } from '../../types';

export function EmployeeListPage({ basePath }: { basePath: string }) {
  const { search, range, from, to, dates, update } = useListFilters();
  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, dates.from, dates.to],
    queryFn: () => employeeApi.list({ search: search || undefined, from: dates.from, to: dates.to, limit: 200 }),
  });
  const qc = useQueryClient();
  const [target, setTarget] = useState<Employee | null>(null);
  const disable = useMutation({
    mutationFn: () => employeeApi.status(target!._id, target?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'),
    onSuccess: () => { toast.success('Employee status updated'); setTarget(null); qc.invalidateQueries({ queryKey: ['employees'] }); },
  });
  const timesheetBase = basePath.includes('super-admin') ? '/super-admin/timesheets' : '/admin/timesheets';
  function employeeActions(item: Employee) {
    return [
      { label: 'View', to: `${basePath}/${item._id}`, tone: 'view' as const },
      { label: 'Edit', to: `${basePath}/${item._id}`, tone: 'edit' as const },
      {
        label: 'Timesheet',
        to: timesheetBrowsePath(timesheetBase, {
          tab: basePath.includes('super-admin') ? 'staff' : 'employees',
          employeeId: item._id,
          range,
          from: dates.from,
          to: dates.to,
        }),
        tone: 'timesheet' as const,
      },
      { label: item.status === 'ACTIVE' ? 'Disable' : 'Enable', onClick: () => setTarget(item), tone: 'danger' as const },
    ];
  }
  return (
    <div>
      <PageHeader title="Quadrant Care Employees" actions={<Link to={`${basePath}/new`}><Button variant="accent">Add Employee</Button></Link>} />
      <ListFilters
        search={search}
        onSearch={(value) => update({ q: value })}
        range={range}
        onRange={(value) => update({ range: value === 'all' ? undefined : value, from: undefined, to: undefined })}
        from={from}
        to={to}
        onCustomDates={(nextFrom, nextTo) => update({ range: 'custom', from: nextFrom, to: nextTo })}
        searchPlaceholder="Search name, ID, email or mobile"
      />
      {isLoading && <Skeleton className="mb-4 h-64" />}
      {!isLoading && !data?.items.length && <EmptyState title="No employees found" description="Try another search or date range, or add a new employee." action={<Link to={`${basePath}/new`}><Button>Add Employee</Button></Link>} />}
      <div className="grid gap-3 md:hidden">
        {data?.items.map((item) => {
          return (
            <article key={item._id} className="card p-4">
              <div className="flex items-start gap-3">
                {item.profilePhoto ? <img src={fileUrl(item.profilePhoto)} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">{item.fullName[0]}</div>}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.fullName}</p>
                  <p className="text-xs text-slate-500">{item.employeeId} · {formatEmployeeJobRoles(item, true)}</p>
                  <div className="mt-1"><RecordStatusPill status={item.status} /></div>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <ActionButtons actions={employeeActions(item)} />
              </div>
            </article>
          );
        })}
      </div>
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800"><tr>{['Employee','ID','Role','Status',''].map((h)=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((item) => {
              return (
                <tr key={item._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{item.fullName}</td>
                  <td className="px-4 py-3">{item.employeeId}</td>
                  <td className="px-4 py-3">{formatEmployeeJobRoles(item, true)}</td>
                  <td className="px-4 py-3"><RecordStatusPill status={item.status} /></td>
                  <td className="px-4 py-3">
                    <ActionButtons actions={employeeActions(item)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog open={Boolean(target)} title="Change employee status" description="This will enable or disable login for the selected employee." confirmLabel="Continue" danger onClose={() => setTarget(null)} onConfirm={() => disable.mutate()} />
    </div>
  );
}

export function EmployeeFormPage({ basePath }: { basePath: string }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const roles = useQuery({ queryKey: ['job-roles', { status: 'ACTIVE' }], queryFn: () => jobRoleApi.list({ status: 'ACTIVE' }) });
  const existing = useQuery({ queryKey: ['employee', id], queryFn: () => employeeApi.get(id!), enabled: Boolean(id) });
  const [jobRoleIds, setJobRoleIds] = useState<string[]>([]);
  const [primaryJobRoleId, setPrimaryJobRoleId] = useState('');
  const [jobRoleError, setJobRoleError] = useState('');
  const form = useForm({
    values: existing.data
      ? {
          fullName: existing.data.fullName,
          email: existing.data.email,
          mobile: existing.data.mobile,
          address: existing.data.address ?? '',
          joiningDate: existing.data.joiningDate?.slice(0, 10),
          password: '',
          passcode: '',
        }
      : { fullName: '', email: '', mobile: '', address: '', joiningDate: '', password: '', passcode: '' },
  });

  useEffect(() => {
    if (!existing.data) return;
    const assigned = (existing.data.jobRoleIds ?? []).map(jobRoleId).filter(Boolean);
    setJobRoleIds(assigned);
    setPrimaryJobRoleId(jobRoleId(existing.data.primaryJobRoleId) || assigned[0] || '');
  }, [existing.data]);

  const pickerRoles = useMemo(() => {
    const catalog = roles.data?.items ?? [];
    const assigned = (existing.data?.jobRoleIds ?? []).filter((role): role is JobRole => typeof role !== 'string');
    return [
      ...catalog,
      ...assigned.filter((role) => !catalog.some((item) => item._id === role._id)),
    ];
  }, [roles.data?.items, existing.data?.jobRoleIds]);

  async function onSubmit(values: Record<string, string>) {
    if (!jobRoleIds.length) {
      setJobRoleError('Select at least one job role.');
      return;
    }
    setJobRoleError('');
    const payload = {
      ...values,
      jobRoleIds,
      primaryJobRoleId: primaryJobRoleId || jobRoleIds[0],
      password: values.password || undefined,
      passcode: values.passcode || undefined,
    };
    if (id) await employeeApi.update(id, payload);
    else await employeeApi.create(payload);
    toast.success(id ? 'Employee updated' : 'Employee created');
    navigate(basePath);
  }

  return (
    <form className="mx-auto max-w-2xl space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <PageHeader title={id ? 'Edit employee' : 'Add employee'} />
      <Card className="space-y-3">
        <h3 className="font-semibold">Personal information</h3>
        <Input label="Full name" {...form.register('fullName', { required: true })} />
        <Input label="Address" {...form.register('address')} />
      </Card>
      <Card className="space-y-3">
        <h3 className="font-semibold">Contact information</h3>
        <Input label="Email" type="email" {...form.register('email', { required: true })} />
        <Input label="Mobile" {...form.register('mobile', { required: true })} />
      </Card>
      <Card className="space-y-3">
        <h3 className="font-semibold">Employment information</h3>
        <JobRoleMultiSelect
          roles={pickerRoles}
          assignedIds={jobRoleIds}
          primaryId={primaryJobRoleId}
          error={jobRoleError}
          onChange={(nextIds, nextPrimary) => {
            setJobRoleIds(nextIds);
            setPrimaryJobRoleId(nextPrimary);
            setJobRoleError(nextIds.length ? '' : 'Select at least one job role.');
          }}
        />
        <Input label="Joining date" type="date" {...form.register('joiningDate', { required: true })} />
      </Card>
      <Card className="space-y-3">
        <h3 className="font-semibold">Login information</h3>
        <Input label={id ? 'New password (leave blank to keep current)' : 'Password'} type="password" {...form.register('password', { required: !id })} />
        <Input label={id ? 'New 5-digit passcode (leave blank to keep current)' : '5-digit passcode (optional)'} inputMode="numeric" maxLength={5} {...form.register('passcode')} />
      </Card>
      <Button className="w-full" variant="accent">{id ? 'Save changes' : 'Create employee'}</Button>
    </form>
  );
}
