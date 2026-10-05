import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Download, Share, X } from 'lucide-react';
import { APP_NAME } from '../constants';
import { BrandLogo } from '../components/brand/BrandLogo';
import { Button } from '../components/ui';
import { isAndroid, isIos, isStandalonePwa } from './device';
import { clearInstallEvent, getInstallEvent, subscribeInstallEvent, type BeforeInstallPromptEvent } from './installEvent';

type PwaInstallContextValue = {
  installed: boolean;
  canNativeInstall: boolean;
  installApp: () => Promise<void>;
  openInstall: () => void;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function usePwaInstall() {
  const value = useContext(PwaInstallContext);
  if (!value) throw new Error('usePwaInstall must be used inside PwaInstallProvider');
  return value;
}

export function useOptionalPwaInstall() {
  return useContext(PwaInstallContext);
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(isStandalonePwa);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(getInstallEvent);
  const [guideOpen, setGuideOpen] = useState(!isStandalonePwa());

  useEffect(() => {
    setInstalled(isStandalonePwa());
    return subscribeInstallEvent(setInstallEvent);
  }, []);

  useEffect(() => {
    const onChange = () => setInstalled(isStandalonePwa());
    const media = window.matchMedia('(display-mode: standalone)');
    media.addEventListener('change', onChange);
    window.addEventListener('appinstalled', onChange);
    return () => {
      media.removeEventListener('change', onChange);
      window.removeEventListener('appinstalled', onChange);
    };
  }, []);

  async function installApp() {
    const event = installEvent ?? getInstallEvent();
    if (event) {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === 'accepted') {
        clearInstallEvent();
        setInstalled(true);
        setGuideOpen(false);
      }
      return;
    }
    setGuideOpen(true);
  }

  return (
    <PwaInstallContext.Provider
      value={{
        installed,
        canNativeInstall: Boolean(installEvent),
        installApp,
        openInstall: () => {
          if (installEvent) void installApp();
          else setGuideOpen(true);
        },
      }}
    >
      {children}
      {!installed && guideOpen && (
        <div className="fixed inset-x-3 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-[70] mx-auto max-w-lg rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 md:bottom-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-900 dark:ring-slate-700">
          <button
            type="button"
            className="absolute right-3 top-3 rounded-xl p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Dismiss install prompt"
            onClick={() => setGuideOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <BrandLogo className="h-12 w-12 shrink-0 rounded-2xl bg-white p-1 ring-1 ring-slate-200" />
            <div className="min-w-0">
              <p className="font-semibold">Install {APP_NAME}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add the app to your home screen for a faster, full-screen experience.
              </p>
            </div>
          </div>
          {installEvent ? (
            <Button className="mt-4 w-full" onClick={() => void installApp()}>
              <Download className="h-4 w-4" />
              Install app
            </Button>
          ) : isIos() ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Tap <Share className="mb-0.5 inline h-4 w-4" /> Share, then <strong>Add to Home Screen</strong>.
            </p>
          ) : isAndroid() ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Open the browser menu and tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
            </p>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Use your browser’s install menu, or tap <strong>Install app</strong> in the header.
            </p>
          )}
        </div>
      )}
    </PwaInstallContext.Provider>
  );
}
