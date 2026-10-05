export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(event: BeforeInstallPromptEvent | null) => void>();

function notify() {
  listeners.forEach((listener) => listener(deferred));
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export function getInstallEvent() {
  return deferred;
}

export function subscribeInstallEvent(listener: (event: BeforeInstallPromptEvent | null) => void) {
  listeners.add(listener);
  listener(deferred);
  return () => {
    listeners.delete(listener);
  };
}

export function clearInstallEvent() {
  deferred = null;
  notify();
}
