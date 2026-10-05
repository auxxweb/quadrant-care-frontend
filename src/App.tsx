import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from './pages/LoginPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { NewTimesheetPage } from './pages/staff/NewTimesheetPage';
import { TimesheetListPage } from './pages/TimesheetListPage';
import { TimesheetDetailPage } from './pages/TimesheetDetailPage';
import { HistoryPage } from './pages/staff/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard';
import { EmployeeFormPage, EmployeeListPage } from './pages/employees/EmployeePages';
import { AccountSettingsPage, AdminUsersPage, AuditLogsPage, MorePage, ReportsPage, SettingsPage } from './pages/admin/ManagementPages';
import { CareHomesPage } from './pages/super-admin/CareHomesPage';
import { JobRolesPage } from './pages/super-admin/JobRolesPage';
import { useAuth } from './store/auth';
import { HOME_PATH } from './constants';
import { InboxPage } from './pages/chat/InboxPage';
import { SessionLoading } from './components/auth/SessionLoading';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
      <Route path="/reset-password" element={<GuestOnly><ResetPasswordPage /></GuestOnly>} />
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<ProtectedRoute roles={['STAFF']} />}>
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/timesheets" element={<TimesheetListPage title="My Timesheets" basePath="/staff/timesheets" />} />
        <Route path="/staff/timesheets/new" element={<NewTimesheetPage />} />
        <Route path="/staff/timesheets/:id" element={<TimesheetDetailPage />} />
        <Route path="/staff/history" element={<HistoryPage />} />
        <Route path="/staff/inbox" element={<InboxPage basePath="/staff/inbox" />} />
        <Route path="/staff/inbox/:id" element={<InboxPage basePath="/staff/inbox" />} />
        <Route path="/staff/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/timesheets" element={<TimesheetListPage title="Timesheets" basePath="/admin/timesheets" />} />
        <Route path="/admin/timesheets/new" element={<NewTimesheetPage />} />
        <Route path="/admin/timesheets/:id" element={<TimesheetDetailPage />} />
        <Route path="/admin/employees" element={<EmployeeListPage basePath="/admin/employees" />} />
        <Route path="/admin/employees/new" element={<EmployeeFormPage basePath="/admin/employees" />} />
        <Route path="/admin/employees/:id" element={<EmployeeFormPage basePath="/admin/employees" />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/inbox" element={<InboxPage basePath="/admin/inbox" />} />
        <Route path="/admin/inbox/:id" element={<InboxPage basePath="/admin/inbox" />} />
        <Route path="/admin/settings" element={<AccountSettingsPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
        <Route path="/admin/more" element={<MorePage items={[{ to: '/admin/inbox', label: 'Inbox' }, { to: '/admin/reports', label: 'Reports' }, { to: '/admin/settings', label: 'Settings' }, { to: '/admin/profile', label: 'Profile' }]} />} />
      </Route>

      <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/approvals" element={<TimesheetListPage title="Admin requests" basePath="/super-admin/timesheets" defaultStatus="SUBMITTED,ADMIN_REVIEW,RESUBMITTED,SUPER_ADMIN_REVIEW" hideScopeTabs />} />
        <Route path="/super-admin/timesheets" element={<TimesheetListPage title="Timesheets" basePath="/super-admin/timesheets" />} />
        <Route path="/super-admin/timesheets/:id" element={<TimesheetDetailPage />} />
        <Route path="/super-admin/employees" element={<EmployeeListPage basePath="/super-admin/employees" />} />
        <Route path="/super-admin/employees/new" element={<EmployeeFormPage basePath="/super-admin/employees" />} />
        <Route path="/super-admin/employees/:id" element={<EmployeeFormPage basePath="/super-admin/employees" />} />
        <Route path="/super-admin/admins" element={<AdminUsersPage />} />
        <Route path="/super-admin/care-homes" element={<CareHomesPage />} />
        <Route path="/super-admin/job-roles" element={<JobRolesPage />} />
        <Route path="/super-admin/reports" element={<ReportsPage />} />
        <Route path="/super-admin/inbox" element={<InboxPage basePath="/super-admin/inbox" />} />
        <Route path="/super-admin/inbox/:id" element={<InboxPage basePath="/super-admin/inbox" />} />
        <Route path="/super-admin/audit-logs" element={<AuditLogsPage />} />
        <Route path="/super-admin/settings" element={<SettingsPage />} />
        <Route path="/super-admin/profile" element={<ProfilePage />} />
        <Route path="/super-admin/more" element={<MorePage items={[
          { to: '/super-admin/inbox', label: 'Inbox' },
          { to: '/super-admin/admins', label: 'Admins' },
          { to: '/super-admin/care-homes', label: 'Care Homes' },
          { to: '/super-admin/job-roles', label: 'Job Roles' },
          { to: '/super-admin/settings', label: 'Settings' },
          { to: '/super-admin/audit-logs', label: 'Audit Logs' },
          { to: '/super-admin/profile', label: 'Profile' },
        ]} />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoading />;
  if (user) return <Navigate to={HOME_PATH[user.role]} replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_PATH[user.role]} replace />;
}
