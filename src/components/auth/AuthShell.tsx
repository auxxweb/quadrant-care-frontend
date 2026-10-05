import type { ReactNode } from 'react';
import { BadgeCheck, Clock3, PenLine, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../brand/BrandLogo';
import { PwaInstallButton } from '../../pwa/PwaInstallButton';
import { APP_NAME, COMPANY_NAME } from '../../constants';

const highlights = [
  { icon: Clock3, title: 'Fast shift capture', text: 'Staff can log hours from any phone in under a minute.' },
  { icon: PenLine, title: 'Digital sign-off', text: 'Admins verify and sign timesheets without paper.' },
  { icon: BadgeCheck, title: 'Clear approvals', text: 'Super Admins approve with a full audit trail.' },
];

export function AuthShell({
  title,
  subtitle,
  badge = 'Secure sign-in',
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f4f7fb] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,1fr)] dark:bg-slate-950">
      <aside className="auth-panel relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12 xl:px-16">
        <div className="auth-panel-grid pointer-events-none absolute inset-0" />
        <div className="relative">
          <BrandLogo className="h-[4.5rem] w-auto rounded-2xl bg-white p-2 shadow-auth" />
          <p className="mt-8 text-sm font-medium uppercase tracking-[0.22em] text-white/60">Staff timesheets</p>
          <h1 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Hours your care team can trust.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
            {APP_NAME} helps {COMPANY_NAME} capture, verify, and approve shifts with a clear path from the floor to final sign-off.
          </p>
        </div>
        <ul className="relative mt-12 grid max-w-lg gap-4">
          {highlights.map(({ icon: Icon, title: itemTitle, text }) => (
            <li key={itemTitle} className="flex gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">{itemTitle}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/70">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="relative mt-10 text-xs text-white/45">© {new Date().getFullYear()} {COMPANY_NAME}</p>
      </aside>

      <section className="flex min-h-dvh flex-col justify-start px-5 py-8 sm:px-8 lg:justify-center">
        <div className="mb-6 flex items-center justify-center lg:hidden">
          <BrandLogo className="h-16 w-auto rounded-2xl bg-white p-2 shadow-card" />
        </div>
        <div className="mx-auto w-full max-w-[440px] rounded-[28px] bg-white p-6 shadow-auth ring-1 ring-slate-200/80 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mb-6">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {badge}
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          {children}
          <div className="mt-4">
            <PwaInstallButton variant="full" />
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-[440px] text-center text-xs text-slate-400 lg:hidden">
          © {new Date().getFullYear()} {COMPANY_NAME}
        </p>
      </section>
    </div>
  );
}

export function AuthField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export const authControlClass =
  'min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
