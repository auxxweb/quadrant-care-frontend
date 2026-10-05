import { useAuth } from '../store/auth';
import { Card, PageHeader } from '../components/ui';
import { ChangeCredentialsForm } from '../components/auth/ChangeCredentialsForm';
import { PwaInstallButton } from '../pwa/PwaInstallButton';
import type { JobRole } from '../types';
import { fileUrl, formatDate } from '../utils';

export function ProfilePage() {
  const { user, employee, logout } = useAuth();
  const job = employee?.jobRoleId as JobRole | undefined;
  return (
    <div className="space-y-5">
      <PageHeader title="Profile" subtitle="Your Quadrant Care account" />
      <Card className="flex items-center gap-4">
        {employee?.profilePhoto ? <img src={fileUrl(employee.profilePhoto)} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl text-white">{user?.name[0]}</div>}
        <div className="min-w-0">
          <p className="text-xl font-bold">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email} · {user?.mobile}</p>
          <p className="text-sm text-slate-500">{user?.employeeId || user?.adminId}</p>
        </div>
      </Card>
      {employee && (
        <Card className="space-y-2 text-sm">
          <p><span className="text-slate-500">Job role:</span> {job?.name}</p>
          <p><span className="text-slate-500">Joined:</span> {formatDate(employee.joiningDate)}</p>
          <p><span className="text-slate-500">Status:</span> {employee.status}</p>
        </Card>
      )}
      {user?.role === 'STAFF' && <ChangeCredentialsForm />}
      <PwaInstallButton variant="card" />
      <button onClick={() => logout()} className="w-full rounded-2xl bg-red-50 py-3 font-semibold text-red-700">Logout</button>
    </div>
  );
}
