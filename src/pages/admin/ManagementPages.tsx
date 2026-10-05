import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { adminApi, auditApi, employeeApi, jobRoleApi, reportsApi, settingsApi } from '../../api/services';
import { API_BASE_URL } from '../../config';
import { Button, Card, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Skeleton } from '../../components/ui';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { ListFilters } from '../../components/filters/ListFilters';
import { useListFilters } from '../../hooks/useListFilters';
import { OfficialTimesheetForm } from '../../components/timesheet/OfficialTimesheetForm';
import { ScopeTabs, TimesheetScopeFilters } from '../../components/timesheet/TimesheetFilters';
import { Link } from 'react-router-dom';
import { formatDateTime, formatMinutes } from '../../utils';
import { timesheetBrowsePath } from '../../utils/timesheetLinks';
import { groupTimesheetsByEmployee } from '../../utils/timesheetSheet';
import { useAuth } from '../../store/auth';
import { useState } from 'react';
import { ChangeCredentialsForm } from '../../components/auth/ChangeCredentialsForm';
import { SavedSignatureForm } from '../../components/auth/SavedSignatureForm';
import { PwaInstallButton } from '../../pwa/PwaInstallButton';
import type { AuthUser, Timesheet } from '../../types';

export function AdminUsersPage() {
  const { search, range, from, to, dates, update } = useListFilters();
  const { data, isLoading } = useQuery({
    queryKey: ['admins', search, dates.from, dates.to],
    queryFn: () => adminApi.list({ search: search || undefined, from: dates.from, to: dates.to, limit: 200 }),
  });
  const form = useForm({ defaultValues: { name: '', email: '', mobile: '', password: '', passcode: '' } });
  const qc = useQueryClient();
  const [loginTarget, setLoginTarget] = useState<AuthUser | null>(null);
  const [adding, setAdding] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [savingLogin, setSavingLogin] = useState(false);
  const [target, setTarget] = useState<AuthUser | null>(null);
  function adminActions(item: AuthUser) {
    return [
      { label: 'Edit', onClick: () => { setLoginTarget(item); setNewPassword(''); setNewPasscode(''); }, tone: 'edit' as const },
      {
        label: 'Timesheet',
        to: timesheetBrowsePath('/super-admin/timesheets', {
          tab: 'admins',
          userId: item.id,
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
    <div className="space-y-5">
      <PageHeader
        title="Admins"
        subtitle="Create and manage admin accounts"
        actions={<Button variant="accent" onClick={() => { form.reset(); setAdding(true); }}>Add Admin</Button>}
      />
      <Modal
        open={adding}
        title="Add Admin"
        onClose={() => { setAdding(false); form.reset(); }}
      >
        <form className="grid gap-3" onSubmit={form.handleSubmit(async (values) => {
          await adminApi.create({
            ...values,
            passcode: values.passcode || undefined,
          });
          toast.success('Admin created');
          form.reset();
          setAdding(false);
          qc.invalidateQueries({ queryKey: ['admins'] });
        })}>
          <Input label="Name" {...form.register('name', { required: true })} />
          <Input label="Email" type="email" {...form.register('email', { required: true })} />
          <Input label="Mobile" {...form.register('mobile', { required: true })} />
          <Input label="Password" type="password" {...form.register('password', { required: true })} />
          <Input label="5-digit passcode (optional)" inputMode="numeric" maxLength={5} {...form.register('passcode')} />
          <Button className="w-full" variant="accent">Create admin</Button>
        </form>
      </Modal>
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
      {isLoading && <Skeleton className="h-40" />}
      <div className="grid gap-3">
        {data?.items.map((item) => (
          <Card key={item.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{item.name}</p>
                <p className="break-all text-sm text-slate-500">{item.adminId} · {item.email}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-slate-500">{item.status}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <ActionButtons actions={adminActions(item)} />
            </div>
          </Card>
        ))}
      </div>
      <Modal open={Boolean(loginTarget)} title={`Change login for ${loginTarget?.name ?? ''}`} onClose={() => setLoginTarget(null)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!loginTarget) return;
            if (!newPassword && !newPasscode) {
              toast.error('Enter a new password or passcode.');
              return;
            }
            if (newPasscode && !/^\d{5}$/.test(newPasscode)) {
              toast.error('Passcode must be 5 digits.');
              return;
            }
            setSavingLogin(true);
            try {
              await adminApi.update(loginTarget.id, {
                password: newPassword || undefined,
                passcode: newPasscode || undefined,
              });
              toast.success('Admin login updated');
              setLoginTarget(null);
            } finally {
              setSavingLogin(false);
            }
          }}
        >
          <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Input label="New 5-digit passcode" inputMode="numeric" maxLength={5} value={newPasscode} onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, '').slice(0, 5))} />
          <Button type="submit" variant="accent" className="w-full" loading={savingLogin}>Save login details</Button>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(target)}
        title="Change admin status"
        description="This will enable or disable login for the selected admin."
        confirmLabel="Continue"
        danger
        onClose={() => setTarget(null)}
        onConfirm={async () => {
          if (!target) return;
          await adminApi.status(target.id, target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
          toast.success('Admin status updated');
          setTarget(null);
          qc.invalidateQueries({ queryKey: ['admins'] });
        }}
      />
    </div>
  );
}

export function SettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });
  const form = useForm({ values: data ? { ...data, staffSignupEnabled: data.staffSignupEnabled !== false } : undefined });

  async function saveSettings(values: Record<string, unknown>) {
    await settingsApi.update(values);
    toast.success('Settings saved');
  }

  if (isLoading) return <Skeleton className="h-80" />;

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Authentication, timesheets and security" />
      <ChangeCredentialsForm title="Your password & passcode" />
      <SavedSignatureForm />
      <form className="space-y-5" onSubmit={form.handleSubmit(saveSettings)}>
        <Card className="space-y-3">
          <h3 className="font-semibold">General</h3>
          <Input label="Company name" {...form.register('companyName')} />
          <Input label="App name" {...form.register('appName')} />
          <Input label="Timezone" {...form.register('timezone')} />
        </Card>
        <Card className="space-y-3">
          <h3 className="font-semibold">Authentication</h3>
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('emailLoginEnabled')} /> Email login</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('mobileLoginEnabled')} /> Mobile login</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('passcodeLoginEnabled')} /> Passcode login</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('staffSignupEnabled')} /> Allow staff to sign up themselves</label>
        </Card>
        <Card className="space-y-3">
          <h3 className="font-semibold">Timesheet</h3>
          <Input label="Default break duration" type="number" {...form.register('defaultBreakDuration', { valueAsNumber: true })} />
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('allowOvernightShifts')} /> Allow overnight shifts</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('requireInchargeName')} /> Require incharge name</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('requireAdminSignature')} /> Require admin signature</label>
        </Card>
        <Card className="space-y-3">
          <h3 className="font-semibold">Security</h3>
          <Input label="Max login attempts" type="number" {...form.register('maxLoginAttempts', { valueAsNumber: true })} />
          <Input label="Lockout duration (minutes)" type="number" {...form.register('lockoutDurationMinutes', { valueAsNumber: true })} />
        </Card>
        <Button variant="accent" className="w-full">Save settings</Button>
      </form>
    </div>
  );
}

export function AuditLogsPage() {
  const { search, range, from, to, dates, update } = useListFilters();
  const { data, isLoading } = useQuery({
    queryKey: ['audit', search, dates.from, dates.to],
    queryFn: () => auditApi.list({ search: search || undefined, from: dates.from, to: dates.to, limit: 100 }),
  });
  return (
    <div>
      <PageHeader title="Audit logs" />
      <ListFilters
        search={search}
        onSearch={(value) => update({ q: value })}
        range={range}
        onRange={(value) => update({ range: value === 'all' ? undefined : value, from: undefined, to: undefined })}
        from={from}
        to={to}
        onCustomDates={(nextFrom, nextTo) => update({ range: 'custom', from: nextFrom, to: nextTo })}
        searchPlaceholder="Search action, user or description"
      />
      <div className="space-y-3">
        {data?.items.map((item: { _id: string; action: string; description: string; userName?: string; createdAt: string }) => (
          <Card key={item._id}>
            <p className="font-semibold">{item.action.replaceAll('_', ' ')}</p>
            <p className="text-sm text-slate-500">{item.description}</p>
            <p className="text-xs text-slate-400">{item.userName} · {formatDateTime(item.createdAt)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const { params, search, range, from, to, dates, update } = useListFilters();
  const defaultTab = user?.role === 'ADMIN' ? 'employees' : 'staff';
  const tab = params.get('tab') ?? defaultTab;
  const employeeId = params.get('employeeId') ?? '';
  const userId = params.get('userId') ?? '';
  const jobRoleId = params.get('jobRoleId') ?? '';
  const ownerRole = tab === 'mine' || tab === 'admins' ? 'ADMIN' : 'STAFF';
  const listUserId = tab === 'mine' ? user?.id : tab === 'admins' ? userId || undefined : undefined;
  const listEmployeeId = tab === 'employees' || tab === 'staff' ? employeeId || undefined : undefined;
  const query = {
    search: search || undefined,
    from: dates.from,
    to: dates.to,
    employeeId: listEmployeeId,
    userId: listUserId,
    jobRoleId: jobRoleId || undefined,
    ownerRole,
  };
  const { data, isLoading } = useQuery({
    queryKey: ['report-timesheets', query],
    queryFn: () => reportsApi.timesheets(query) as Promise<{ items: Timesheet[]; totalMinutes: number }>,
  });
  const employees = useQuery({
    queryKey: ['employees', 'dropdown'],
    queryFn: () => employeeApi.list({ limit: 200, status: 'ACTIVE' }),
    enabled: tab === 'employees' || tab === 'staff',
  });
  const admins = useQuery({
    queryKey: ['admins', 'dropdown'],
    queryFn: () => adminApi.list({ limit: 200, status: 'ACTIVE' }),
    enabled: tab === 'admins',
  });
  const roles = useQuery({
    queryKey: ['job-roles', { status: 'ACTIVE' }],
    queryFn: () => jobRoleApi.list({ status: 'ACTIVE' }),
  });
  const items = data?.items ?? [];
  const csvParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) csvParams.set(key, String(value));
  });
  csvParams.set('format', 'csv');
  const detailBase = user?.role === 'ADMIN' ? '/admin/timesheets' : '/super-admin/timesheets';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle={data ? `${items.length} entries · ${formatMinutes(data.totalMinutes ?? 0)}` : 'Search and filter timesheet records'}
        actions={<a href={`${API_BASE_URL}/reports/timesheets?${csvParams.toString()}`}><Button variant="secondary">Export CSV</Button></a>}
      />
      {user?.role === 'ADMIN' && (
        <ScopeTabs
          tabs={[
            { value: 'mine', label: 'My timesheet' },
            { value: 'employees', label: 'Employee timesheet' },
          ]}
          value={tab}
          onChange={(value) => update({ tab: value, employeeId: undefined, userId: undefined })}
        />
      )}
      {user?.role === 'SUPER_ADMIN' && (
        <ScopeTabs
          tabs={[
            { value: 'admins', label: 'Admin timesheet' },
            { value: 'staff', label: 'Staff timesheet' },
          ]}
          value={tab}
          onChange={(value) => update({ tab: value, employeeId: undefined, userId: undefined })}
        />
      )}
      <ListFilters
        search={search}
        onSearch={(value) => update({ q: value })}
        range={range}
        onRange={(value) => update({ range: value === 'all' ? undefined : value, from: undefined, to: undefined })}
        from={from}
        to={to}
        onCustomDates={(nextFrom, nextTo) => update({ range: 'custom', from: nextFrom, to: nextTo })}
        searchPlaceholder="Search name, timesheet ID or care home"
        extra={
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
        }
      />
      {isLoading && <Skeleton className="h-64" />}
      {!isLoading && !items.length && (
        <EmptyState title="No timesheets found" description="Try another search, date range or filter." />
      )}
      <div className="space-y-6">
        {groupTimesheetsByEmployee(items).map((entries) => (
          <OfficialTimesheetForm
            key={entries[0].userId || entries[0].employeeId || entries[0]._id}
            entries={entries}
            hrefFor={(entry) => `${detailBase}/${entry._id}`}
          />
        ))}
      </div>
    </div>
  );
}

export function AccountSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Update your password, passcode and approval signature" />
      <ChangeCredentialsForm title="Your password & passcode" />
      <SavedSignatureForm />
    </div>
  );
}

export function MorePage({ items }: { items: { to: string; label: string }[] }) {
  return (
    <div className="space-y-3">
      <PageHeader title="More" />
      {items.map((item) => (
        <Link key={item.to} to={item.to} className="card block p-4 font-medium">{item.label}</Link>
      ))}
      <PwaInstallButton variant="card" />
    </div>
  );
}
