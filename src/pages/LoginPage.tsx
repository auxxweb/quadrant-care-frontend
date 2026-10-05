import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../api/services';
import { useAuth } from '../store/auth';
import { APP_NAME } from '../constants';
import { Button } from '../components/ui';
import { AuthField, AuthShell, authControlClass } from '../components/auth/AuthShell';
import { StaffSignupForm } from './SignupPage';
import { cn } from '../utils';

const REMEMBER_KEY = 'quadrant.rememberIdentifier';

function readRememberedIdentifier() {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
}

export function LoginPage() {
  const { login, loginPasscode } = useAuth();
  const pinRef = useRef<HTMLInputElement>(null);
  const remembered = readRememberedIdentifier();
  const [identifier, setIdentifier] = useState(remembered);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(Boolean(remembered));
  const [mode, setMode] = useState<'password' | 'passcode'>('password');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<'signin' | 'signup'>('signin');
  const [options, setOptions] = useState({
    emailLoginEnabled: true,
    mobileLoginEnabled: true,
    passcodeLoginEnabled: true,
    staffSignupEnabled: true,
  });

  useEffect(() => {
    authApi.options().then((data) => {
      setOptions({
        emailLoginEnabled: data.emailLoginEnabled,
        mobileLoginEnabled: data.mobileLoginEnabled,
        passcodeLoginEnabled: data.passcodeLoginEnabled,
        staffSignupEnabled: data.staffSignupEnabled !== false,
      });
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (mode === 'passcode' && window.matchMedia('(min-width: 640px)').matches) {
      pinRef.current?.focus();
    }
  }, [mode]);

  function persistIdentifier() {
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, identifier.trim());
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* ignore storage failures */
    }
  }

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === 'password') await login(identifier.trim(), password);
      else await loginPasscode(identifier.trim(), passcode);
      persistIdentifier();
      toast.success('Welcome back');
    } catch {
      if (mode === 'passcode') setPasscode('');
    } finally {
      setLoading(false);
    }
  }

  function setPasscodeDigits(value: string) {
    const next = value.replace(/\D/g, '').slice(0, 5);
    setPasscode(next);
    if (next.length === 5 && identifier.trim()) {
      window.setTimeout(() => {
        const form = document.getElementById('login-form') as HTMLFormElement | null;
        form?.requestSubmit();
      }, 40);
    }
  }

  const canSignup = options.staffSignupEnabled !== false;
  const showingSignup = panel === 'signup' && canSignup;

  return (
    <AuthShell
      badge={showingSignup ? 'Staff registration' : 'Secure sign-in'}
      title={showingSignup ? 'Create your staff account' : 'Welcome back'}
      subtitle={showingSignup
        ? `Join ${APP_NAME} to log shifts, get updates, and message your team.`
        : `Sign in to ${APP_NAME} with your work email, mobile number, or staff ID.`}
    >
      {showingSignup ? (
        <StaffSignupForm onBack={() => setPanel('signin')} />
      ) : (
      <form id="login-form" onSubmit={onSubmit} className="space-y-5">
        {options.passcodeLoginEnabled && (
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Sign-in method">
            {([
              { id: 'password', label: 'Password' },
              { id: 'passcode', label: 'Passcode' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mode === tab.id}
                className={cn(
                  'rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  mode === tab.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700',
                )}
                onClick={() => {
                  setMode(tab.id);
                  setPasscode('');
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <AuthField label="Email, mobile or ID" htmlFor="login-identifier">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="login-identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              placeholder="e.g. name@quadrantcare.local"
              className={cn(authControlClass, 'pl-11')}
            />
          </div>
        </AuthField>

        {mode === 'password' ? (
          <>
            <AuthField label="Password" htmlFor="login-password">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
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
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
                Forgot password?
              </Link>
            </div>
          </>
        ) : (
          <AuthField label="5-digit passcode" htmlFor="login-passcode" hint="Enter all 5 digits to sign in. On a phone, use the keypad below.">
            <div className="relative">
              <input
                ref={pinRef}
                id="login-passcode"
                value={passcode}
                onChange={(e) => setPasscodeDigits(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={5}
                required
                aria-label="5-digit passcode"
                className="sr-only"
              />
              <div
                className="flex justify-between gap-2"
                onClick={() => pinRef.current?.focus()}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      'flex h-14 flex-1 items-center justify-center rounded-2xl border-2 text-xl font-semibold',
                      passcode.length === index
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : passcode.length > index
                          ? 'border-brand-600 bg-white text-slate-900'
                          : 'border-slate-200 bg-slate-50 text-slate-300',
                    )}
                  >
                    {passcode[index] ? '•' : ''}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) => (
                <button
                  type="button"
                  key={key || 'blank'}
                  disabled={!key}
                  className="min-h-14 rounded-2xl bg-slate-50 text-xl font-semibold text-slate-800 ring-1 ring-slate-200 disabled:opacity-0 active:bg-slate-100"
                  onClick={() => {
                    if (key === '⌫') setPasscode((prev) => prev.slice(0, -1));
                    else setPasscodeDigits(passcode + key);
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </AuthField>
        )}

        <Button type="submit" variant="accent" className="w-full text-base" loading={loading}>
          Sign in
        </Button>
        {canSignup && (
          <Button type="button" variant="secondary" className="w-full" onClick={() => setPanel('signup')}>
            Create account
          </Button>
        )}
      </form>
      )}
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell title="Reset your password" subtitle="Enter the email on your account and we will send a reset link if it exists.">
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await authApi.forgotPassword(email);
            toast.success('If an account exists, a reset email has been sent.');
          } finally {
            setLoading(false);
          }
        }}
      >
        <AuthField label="Email" htmlFor="reset-email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              className={cn(authControlClass, 'pl-11')}
            />
          </div>
        </AuthField>
        <Button type="submit" variant="accent" className="w-full" loading={loading}>
          Send reset link
        </Button>
        <Link to="/login" className="block text-center text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = new URLSearchParams(window.location.search).get('token') ?? '';

  return (
    <AuthShell title="Choose a new password" subtitle="Enter a new password for your account.">
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await authApi.resetPassword(token, password);
            toast.success('Password updated. You can now sign in.');
          } finally {
            setLoading(false);
          }
        }}
      >
        <AuthField label="New password" htmlFor="new-password">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
        <Button type="submit" variant="accent" className="w-full" loading={loading}>
          Update password
        </Button>
        <Link to="/login" className="block text-center text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
