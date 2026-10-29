import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { adminApi, auditApi, settingsApi } from '../../api/services';
import { Button, Card, ConfirmDialog, Input, Modal, PageHeader, RecordStatusPill, Skeleton } from '../../components/ui';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { ListFilters } from '../../components/filters/ListFilters';
import { useListFilters } from '../../hooks/useListFilters';
import { formatDateTime } from '../../utils';
import { Link } from 'react-router-dom';
import { timesheetBrowsePath } from '../../utils/timesheetLinks';
import { useState } from 'react';
import { ChangeCredentialsForm } from '../../components/auth/ChangeCredentialsForm';
import { SavedSignatureForm } from '../../components/auth/SavedSignatureForm';
import { PwaInstallButton } from '../../pwa/PwaInstallButton';
import type { AuthUser } from '../../types';

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
  const disabling = target?.status === 'ACTIVE';
  const targetName = target?.name ?? 'this admin';
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
      { label: item.status === 'ACTIVE' ? 'Disable' : 'Enable', onClick: () => setTarget(item), tone: item.status === 'ACTIVE' ? 'danger' as const : 'success' as const },
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
              <RecordStatusPill status={item.status} />
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
        title={disabling ? `Disable ${targetName}?` : `Enable ${targetName}?`}
        description={disabling
          ? `${targetName} is Active. This will set them to Inactive and they will not be able to log in.`
          : `${targetName} is Inactive. This will set them to Active and they will be able to log in again.`}
        confirmLabel={disabling ? 'Disable' : 'Enable'}
        danger={disabling}
        onClose={() => setTarget(null)}
        onConfirm={async () => {
          if (!target) return;
          await adminApi.status(target.id, target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
          toast.success(disabling ? 'Admin disabled' : 'Admin enabled');
          setTarget(null);
          qc.invalidateQueries({ queryKey: ['admins'] });
        }}
      />
    </div>
  );
}

const AUTH_FLAG_KEYS = ['emailLoginEnabled', 'mobileLoginEnabled', 'passcodeLoginEnabled', 'staffSignupEnabled'] as const;
const LOGIN_METHOD_REQUIRED = 'Enable at least one login method (email, mobile, or passcode).';

function hydrateSettings(data: Record<string, unknown>): Record<string, unknown> {
  return { ...data, staffSignupEnabled: data.staffSignupEnabled !== false };
}

function hasLoginMethod(values: Record<string, unknown>) {
  return Boolean(values.emailLoginEnabled) || Boolean(values.mobileLoginEnabled) || Boolean(values.passcodeLoginEnabled);
}

function authFlagsChanged(next: Record<string, unknown>, current?: Record<string, unknown>) {
  if (!current) return true;
  return AUTH_FLAG_KEYS.some((key) => Boolean(next[key]) !== Boolean(current[key]));
}

function disablingAuth(next: Record<string, unknown>, current?: Record<string, unknown>) {
  if (!current) return false;
  return AUTH_FLAG_KEYS.some((key) => Boolean(current[key]) && !Boolean(next[key]));
}

function authConfirmDescription(values: Record<string, unknown>) {
  const state = (on: unknown) => (on ? 'on' : 'off');
  return `This will change how people sign in. Email login: ${state(values.emailLoginEnabled)}. Mobile login: ${state(values.mobileLoginEnabled)}. Passcode login: ${state(values.passcodeLoginEnabled)}. Staff self-signup: ${state(values.staffSignupEnabled)}. People using a disabled method will not be able to sign in.`;
}

export function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });
  const saved = data ? hydrateSettings(data as Record<string, unknown>) : undefined;
  const form = useForm<Record<string, unknown>>({ values: saved });
  const [pendingValues, setPendingValues] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const emailOn = form.watch('emailLoginEnabled');
  const mobileOn = form.watch('mobileLoginEnabled');
  const passcodeOn = form.watch('passcodeLoginEnabled');
  const loginMethodMissing = !emailOn && !mobileOn && !passcodeOn;

  async function persistSettings(values: Record<string, unknown>) {
    if (saving) return;
    setSaving(true);
    try {
      await settingsApi.update(values);
      toast.success('Settings saved');
      setPendingValues(null);
      qc.invalidateQueries({ queryKey: ['settings'] });
    } finally {
      setSaving(false);
    }
  }

  function saveSettings(values: Record<string, unknown>) {
    if (!hasLoginMethod(values)) {
      toast.error(LOGIN_METHOD_REQUIRED);
      return;
    }
    const breakDuration = Number(values.defaultBreakDuration);
    if (!Number.isFinite(breakDuration) || breakDuration < 0) {
      toast.error('Break duration cannot be negative.');
      return;
    }
    if (authFlagsChanged(values, saved)) {
      setPendingValues(values);
      return;
    }
    void persistSettings(values);
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
          {loginMethodMissing && <p className="text-sm text-red-600">{LOGIN_METHOD_REQUIRED}</p>}
        </Card>
        <Card className="space-y-3">
          <h3 className="font-semibold">Timesheet</h3>
          <Input label="Default break duration" type="number" min={0} {...form.register('defaultBreakDuration', { valueAsNumber: true })} />
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('allowOvernightShifts')} /> Allow overnight shifts</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('requireInchargeName')} /> Require incharge name</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('requireAdminSignature')} /> Require admin signature</label>
        </Card>
        <Card className="space-y-3">
          <h3 className="font-semibold">Security</h3>
          <Input label="Max login attempts" type="number" {...form.register('maxLoginAttempts', { valueAsNumber: true })} />
          <Input label="Lockout duration (minutes)" type="number" {...form.register('lockoutDurationMinutes', { valueAsNumber: true })} />
        </Card>
        <Button variant="accent" className="w-full" loading={saving}>Save settings</Button>
      </form>
      <ConfirmDialog
        open={Boolean(pendingValues)}
        title="Update authentication?"
        description={pendingValues ? authConfirmDescription(pendingValues) : ''}
        confirmLabel="Save changes"
        danger={Boolean(pendingValues && disablingAuth(pendingValues, saved))}
        onClose={() => !saving && setPendingValues(null)}
        onConfirm={() => pendingValues && persistSettings(pendingValues)}
      />
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
