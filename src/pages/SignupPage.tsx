import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, Mail, Phone, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../api/services';
import { JobRoleMultiSelect } from '../components/employees/JobRoleMultiSelect';
import { useAuth } from '../store/auth';
import { Button } from '../components/ui';
import { AuthField, authControlClass } from '../components/auth/AuthShell';
import { cn } from '../utils';
import type { JobRole } from '../types';

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function StaffSignupForm({ onBack }: { onBack: () => void }) {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [jobRoleIds, setJobRoleIds] = useState<string[]>([]);
  const [primaryJobRoleId, setPrimaryJobRoleId] = useState('');
  const [jobRoleError, setJobRoleError] = useState('');
  const [careHomeId, setCareHomeId] = useState('');
  const [joiningDate, setJoiningDate] = useState(todayIso());
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<{
    staffSignupEnabled: boolean;
    jobRoles: { _id: string; name: string }[];
    careHomes: { _id: string; name: string; city: string }[];
  } | null>(null);

  useEffect(() => {
    authApi.signupOptions().then(setOptions).catch(() => setOptions({ staffSignupEnabled: false, jobRoles: [], careHomes: [] }));
  }, []);

  const pickerRoles = useMemo<JobRole[]>(
    () => (options?.jobRoles ?? []).map((role) => ({ ...role, status: 'ACTIVE' as const })),
    [options?.jobRoles],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (passcode && passcode.length !== 5) {
      toast.error('Passcode must be 5 digits, or leave it blank.');
      return;
    }
    if (!jobRoleIds.length) {
      setJobRoleError('Select at least one job role.');
      return;
    }
    setJobRoleError('');
    setLoading(true);
    try {
      await signup({
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        jobRoleIds,
        primaryJobRoleId: primaryJobRoleId || jobRoleIds[0],
        careHomeId,
        joiningDate,
        passcode: passcode || undefined,
      });
      toast.success('Account created. Welcome to Quadrant Care.');
    } finally {
      setLoading(false);
    }
  }

  if (options && !options.staffSignupEnabled) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Staff self-signup is turned off. Ask an admin to create your account.</p>
        <Button type="button" variant="secondary" className="w-full" onClick={onBack}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthField label="Full name" htmlFor="signup-name">
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" placeholder="Your full name" className={cn(authControlClass, 'pl-11')} />
        </div>
      </AuthField>
      <AuthField label="Email" htmlFor="signup-email">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="name@company.com" className={cn(authControlClass, 'pl-11')} />
        </div>
      </AuthField>
      <AuthField label="Mobile" htmlFor="signup-mobile">
        <div className="relative">
          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input id="signup-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required autoComplete="tel" placeholder="07..." className={cn(authControlClass, 'pl-11')} />
        </div>
      </AuthField>
      <JobRoleMultiSelect
        roles={pickerRoles}
        assignedIds={jobRoleIds}
        primaryId={primaryJobRoleId}
        error={jobRoleError}
        label="Job roles"
        hint="Select every role you can work. Mark one as primary for lists and the default timesheet role."
        onChange={(nextIds, nextPrimary) => {
          setJobRoleIds(nextIds);
          setPrimaryJobRoleId(nextPrimary);
          setJobRoleError(nextIds.length ? '' : 'Select at least one job role.');
        }}
      />
      <AuthField label="Care home" htmlFor="signup-home">
        <select id="signup-home" value={careHomeId} onChange={(e) => setCareHomeId(e.target.value)} required className={authControlClass}>
          <option value="">{options ? 'Select care home' : 'Loading care homes…'}</option>
          {(options?.careHomes ?? []).map((home) => (
            <option key={home._id} value={home._id}>{home.city ? `${home.name} — ${home.city}` : home.name}</option>
          ))}
        </select>
      </AuthField>
      {options && (!options.jobRoles.length || !options.careHomes.length) && (
        <p className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {!options.jobRoles.length && !options.careHomes.length
            ? 'Job roles and care homes have not been set up yet. Ask Super Admin to add them first.'
            : !options.jobRoles.length
              ? 'No job roles are available yet. Ask Super Admin to add one first.'
              : 'No care homes are available yet. Ask Super Admin to add one first.'}
        </p>
      )}
      <AuthField label="Joining date" htmlFor="signup-joined">
        <input id="signup-joined" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required className={authControlClass} />
      </AuthField>
      <AuthField label="Password" htmlFor="signup-password" hint="At least 8 characters.">
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={cn(authControlClass, 'px-11')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={() => setShowPassword((open) => !open)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </AuthField>
      <AuthField label="Confirm password" htmlFor="signup-confirm">
        <input
          id="signup-confirm"
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className={authControlClass}
        />
      </AuthField>
      <AuthField label="5-digit passcode (optional)" htmlFor="signup-passcode" hint="Use this for quicker sign-in on a phone.">
        <input
          id="signup-passcode"
          inputMode="numeric"
          maxLength={5}
          value={passcode}
          onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 5))}
          autoComplete="off"
          className={authControlClass}
          placeholder="Optional"
        />
      </AuthField>
      <Button type="submit" variant="accent" className="w-full text-base" loading={loading} disabled={!options}>
        Create account
      </Button>
      <Button type="button" variant="secondary" className="w-full" onClick={onBack}>
        Back to sign in
      </Button>
    </form>
  );
}
