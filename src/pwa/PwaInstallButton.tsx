import { Download } from 'lucide-react';
import { cn } from '../utils';
import { useOptionalPwaInstall } from './PwaInstallContext';

export function PwaInstallButton({
  className,
  variant = 'header',
}: {
  className?: string;
  variant?: 'header' | 'full' | 'card';
}) {
  const pwa = useOptionalPwaInstall();
  if (!pwa || pwa.installed) return null;

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={() => void pwa.installApp()}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-2xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-700',
          className,
        )}
        aria-label="Install app"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Install app</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void pwa.installApp()}
      className={cn(
        variant === 'full'
          ? 'touch-btn flex w-full items-center justify-center gap-2 bg-brand-600 text-white hover:bg-brand-700'
          : 'card flex w-full items-center justify-center gap-2 p-4 font-medium text-brand-600',
        className,
      )}
    >
      <Download className="h-4 w-4" />
      Install app
    </button>
  );
}
