import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart3,
  Building2,
  Briefcase,
  Shield,
  ClipboardCheck,
  ScrollText,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  MessageCircle,
} from 'lucide-react';
import { BrandLogo } from '../brand/BrandLogo';
import { ChatUnreadBadge } from '../../chat/ChatUnreadBadge';
import { cn } from '../../utils';
import type { Role } from '../../constants';

const items: Record<Role, { to: string; label: string; icon: typeof LayoutDashboard }[]> = {
  STAFF: [
    { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/staff/inbox', label: 'Inbox', icon: MessageCircle },
    { to: '/staff/timesheets', label: 'Timesheets', icon: CalendarDays },
    { to: '/staff/history', label: 'History', icon: ClipboardCheck },
    { to: '/staff/profile', label: 'Profile', icon: User },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/inbox', label: 'Inbox', icon: MessageCircle },
    { to: '/admin/timesheets', label: 'Timesheets', icon: CalendarDays },
    { to: '/admin/employees', label: 'Employees', icon: Users },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
    { to: '/admin/profile', label: 'Profile', icon: User },
  ],
  SUPER_ADMIN: [
    { to: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/super-admin/inbox', label: 'Inbox', icon: MessageCircle },
    { to: '/super-admin/approvals', label: 'Admin requests', icon: ClipboardCheck },
    { to: '/super-admin/timesheets', label: 'Timesheets', icon: CalendarDays },
    { to: '/super-admin/employees', label: 'Employees', icon: Users },
    { to: '/super-admin/admins', label: 'Admins', icon: Shield },
    { to: '/super-admin/care-homes', label: 'Care Homes', icon: Building2 },
    { to: '/super-admin/job-roles', label: 'Job Roles', icon: Briefcase },
    { to: '/super-admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    { to: '/super-admin/settings', label: 'Settings', icon: Settings },
    { to: '/super-admin/profile', label: 'Profile', icon: User },
  ],
};

export function Sidebar({ role, collapsed, onCollapse, onLogout }: { role: Role; collapsed: boolean; onCollapse: () => void; onLogout: () => void }) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-950',
        collapsed ? 'w-[84px]' : 'w-64',
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-4">
        {collapsed ? (
          <BrandLogo compact className="mx-auto h-10 w-10" />
        ) : (
          <BrandLogo className="h-12 w-auto max-w-[160px]" />
        )}
        <button onClick={onCollapse} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Collapse sidebar">
          <ChevronLeft className={cn('h-4 w-4 transition', collapsed && 'rotate-180')} />
        </button>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {items[role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium',
                isActive ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && item.label}
            {item.label === 'Inbox' && <ChatUnreadBadge className={collapsed ? 'absolute right-1 top-1' : 'ml-auto'} />}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={onLogout}
        className="m-3 mt-auto flex shrink-0 items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:hover:bg-red-950/70"
      >
        <LogOut className="h-5 w-5" />
        {!collapsed && 'Logout'}
      </button>
    </aside>
  );
}
