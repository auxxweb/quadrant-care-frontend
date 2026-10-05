import { BrandLogo } from '../brand/BrandLogo';

export function SessionLoading({ message = 'Opening your workspace…' }: { message?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f4f7fb] px-6 dark:bg-slate-950">
      <BrandLogo className="h-16 w-auto rounded-2xl bg-white p-2 shadow-card" />
      <div className="mt-5 h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <p className="mt-4 text-sm text-slate-500">{message}</p>
    </div>
  );
}
