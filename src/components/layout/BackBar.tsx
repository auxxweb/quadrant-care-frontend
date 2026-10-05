import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { HOME_PATH } from '../../constants';

export function BackBar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || location.pathname.endsWith('/dashboard') || location.pathname.includes('/inbox')) return null;

  function goBack() {
    const historyIndex = typeof window.history.state?.idx === 'number' ? window.history.state.idx : 0;
    if (historyIndex > 0) {
      navigate(-1);
      return;
    }
    navigate(HOME_PATH[user!.role]);
  }

  return (
    <div className="hidden border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur md:block dark:border-slate-800 dark:bg-slate-950/90">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-200 dark:ring-brand-900"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path fillRule="evenodd" d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        Back
      </button>
    </div>
  );
}
