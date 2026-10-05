import { NavLink } from 'react-router-dom';
import { CalendarDays, Home, PlusCircle, User, ClipboardCheck, Users, MoreHorizontal, MessageCircle } from 'lucide-react';
import { cn } from '../../utils';
import type { Role } from '../../constants';
import { ChatUnreadBadge } from '../../chat/ChatUnreadBadge';

const staff = [
  { to: '/staff/dashboard', label: 'Home', icon: Home },
  { to: '/staff/timesheets', label: 'Timesheets', icon: CalendarDays },
  { to: '/staff/timesheets/new', label: 'Add', icon: PlusCircle, emphasize: true },
  { to: '/staff/inbox', label: 'Inbox', icon: MessageCircle },
  { to: '/staff/profile', label: 'Profile', icon: User },
];

const admin = [
  { to: '/admin/dashboard', label: 'Home', icon: Home },
  { to: '/admin/timesheets?status=SUBMITTED,ADMIN_REVIEW,RESUBMITTED', label: 'Pending', icon: ClipboardCheck },
  { to: '/admin/inbox', label: 'Inbox', icon: MessageCircle },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/more', label: 'More', icon: MoreHorizontal },
];

const superAdmin = [
  { to: '/super-admin/dashboard', label: 'Home', icon: Home },
  { to: '/super-admin/approvals', label: 'Requests', icon: ClipboardCheck },
  { to: '/super-admin/inbox', label: 'Inbox', icon: MessageCircle },
  { to: '/super-admin/employees', label: 'Employees', icon: Users },
  { to: '/super-admin/more', label: 'More', icon: MoreHorizontal },
];

const map: Record<Role, typeof staff> = { STAFF: staff, ADMIN: admin, SUPER_ADMIN: superAdmin };

export function BottomNav({ role }: { role: Role }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95">
      <ul className="grid grid-cols-5">
        {map[role].map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                  isActive ? 'text-brand-600' : 'text-slate-500',
                )
              }
            >
              {item.emphasize ? (
                <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg">
                  <item.icon className="h-7 w-7" />
                </span>
              ) : (
                <span className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.label === 'Inbox' && <ChatUnreadBadge className="absolute -right-3 -top-1" />}
                </span>
              )}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
