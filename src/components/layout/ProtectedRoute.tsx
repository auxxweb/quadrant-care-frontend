import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { HOME_PATH, type Role } from '../../constants';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { BackBar } from './BackBar';
import { SessionLoading } from '../auth/SessionLoading';
import { cn } from '../../utils';

export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={HOME_PATH[user.role]} replace />;
  return <AppShell />;
}

function AppShell() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isInbox = location.pathname.includes('/inbox');
  if (!user) return null;
  return (
    <div className="min-h-screen md:flex md:h-dvh md:overflow-hidden">
      <Sidebar role={user.role} collapsed={collapsed} onCollapse={() => setCollapsed((v) => !v)} onLogout={async () => { await logout(); navigate('/login'); }} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:h-dvh md:min-h-0 md:overflow-hidden">
        <div className="sticky top-0 z-30 shrink-0">
          <Header />
          <BackBar />
        </div>
        <main
          className={cn(
            'min-w-0 flex-1 overflow-y-auto px-3 py-4 pb-28 sm:px-5 md:px-8 md:py-6 md:pb-8',
            isInbox && 'flex flex-col overflow-hidden p-0 pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:p-0',
          )}
        >
          <Outlet />
        </main>
      </div>
      <BottomNav role={user.role} />
    </div>
  );
}
