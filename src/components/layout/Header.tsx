import { Bell, LogOut, Moon, Search, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { searchApi, notificationApi } from '../../api/services';
import { useAuth } from '../../store/auth';
import { BrandLogo } from '../brand/BrandLogo';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { PwaInstallButton } from '../../pwa/PwaInstallButton';
import { useEffect, useRef, useState } from 'react';

export function Header() {
  const { user, logout } = useAuth();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const navigate = useNavigate();
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
    refetchInterval: 15000,
  });
  const search = useQuery({
    queryKey: ['search', q],
    queryFn: () => searchApi.query(q),
    enabled: q.length > 1,
  });

  useEffect(() => {
    const t = setTimeout(() => setOpen(q.length > 1), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (notesRef.current && !notesRef.current.contains(e.target as Node)) setNotesOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  }

  return (
    <header className="flex items-center gap-2 border-b border-slate-200 bg-white/90 px-3 py-3 sm:gap-3 sm:px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <BrandLogo className="h-9 w-auto shrink-0 md:hidden" />
      <div className="relative hidden min-w-0 flex-1 md:block">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search employees, timesheets, care homes"
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 outline-none ring-brand-600 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
        />
        {open && search.data && (
          <div className="absolute z-20 mt-2 w-full rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-100 dark:bg-slate-900">
            {(search.data.employees ?? []).map((item: { _id: string; fullName: string }) => (
              <button key={item._id} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50" onClick={() => navigate(`/${user?.role === 'ADMIN' ? 'admin' : 'super-admin'}/employees/${item._id}`)}>
                {item.fullName}
              </button>
            ))}
            {(search.data.timesheets ?? []).map((item: { _id: string; timesheetId: string }) => (
              <button key={item._id} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50" onClick={() => navigate(`/${user?.role === 'STAFF' ? 'staff' : user?.role === 'ADMIN' ? 'admin' : 'super-admin'}/timesheets/${item._id}`)}>
                {item.timesheetId}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <PwaInstallButton />
        <button onClick={toggleTheme} className="rounded-2xl p-3 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle theme">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <div className="relative" ref={notesRef}>
          <button
            className="rounded-2xl p-3 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Notifications"
            onClick={() => setNotesOpen((openNotes) => !openNotes)}
          >
            <Bell className="h-5 w-5" />
            {Boolean(notifications.data?.unread) && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
          {notesOpen && <NotificationPanel onClose={() => setNotesOpen(false)} />}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role.replaceAll('_', ' ').toLowerCase()}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
