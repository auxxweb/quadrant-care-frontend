import { useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { APP_NAME } from '../constants';
import { Button } from '../components/ui';
import { PwaInstallProvider } from './PwaInstallContext';

function PwaUpdateBanner() {
  const [updating, setUpdating] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const check = () => {
        void registration.update();
      };
      check();
      window.setInterval(check, 15 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.addEventListener('online', check);
    },
  });

  async function refreshAndUpdate() {
    setUpdating(true);
    try {
      await updateServiceWorker(true);
    } finally {
      window.location.reload();
    }
  }

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[80] mx-auto max-w-lg rounded-2xl bg-brand-600 p-4 text-white shadow-2xl ring-1 ring-white/20">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <RefreshCw className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Update available</p>
          <p className="mt-1 text-sm text-white/80">A new version of {APP_NAME} is ready. Refresh to get the latest changes.</p>
          <Button
            className="mt-3 w-full bg-white text-brand-600 hover:bg-slate-100"
            loading={updating}
            onClick={refreshAndUpdate}
          >
            Refresh & Update
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PwaManager({ children }: { children: ReactNode }) {
  return (
    <PwaInstallProvider>
      {children}
      <PwaUpdateBanner />
    </PwaInstallProvider>
  );
}
