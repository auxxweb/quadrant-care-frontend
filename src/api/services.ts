import { api } from './client';
import { API_BASE_URL } from '../config';
import type { AuthUser, CareHome, ChatConversation, ChatMessage, ChatPerson, Employee, JobRole, NotificationItem, Paginated, Timesheet } from '../types';

export const authApi = {
  login: (identifier: string, password: string) => api.post('/auth/login', { identifier, password }).then((r) => r.data),
  loginPasscode: (identifier: string, passcode: string) => api.post('/auth/login-passcode', { identifier, passcode }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data as { user: AuthUser; employee: Employee | null; authOptions: Record<string, boolean> }),
  options: () => api.get('/auth/options').then((r) => r.data as {
    emailLoginEnabled: boolean;
    mobileLoginEnabled: boolean;
    passcodeLoginEnabled: boolean;
    staffSignupEnabled?: boolean;
    appName?: string;
    companyName?: string;
  }),
  signupOptions: () => api.get('/auth/signup-options').then((r) => r.data as {
    staffSignupEnabled: boolean;
    jobRoles: { _id: string; name: string }[];
    careHomes: { _id: string; name: string; city: string }[];
  }),
  signup: (payload: object) => api.post('/auth/signup', payload).then((r) => r.data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }).then((r) => r.data),
  updateMe: (payload: object) => api.patch('/auth/me', payload).then((r) => r.data),
};

export const employeeApi = {
  list: (params?: object) => api.get('/employees', { params }).then((r) => r.data as Paginated<Employee>),
  get: (id: string) => api.get(`/employees/${id}`).then((r) => r.data as Employee),
  create: (payload: object) => api.post('/employees', payload).then((r) => r.data),
  update: (id: string, payload: object) => api.put(`/employees/${id}`, payload).then((r) => r.data),
  status: (id: string, status: string) => api.patch(`/employees/${id}/status`, { status }).then((r) => r.data),
};

export const adminApi = {
  list: (params?: object) => api.get('/admins', { params }).then((r) => r.data as Paginated<AuthUser>),
  directory: () =>
    api.get('/admins/directory').then((r) => r.data as { items: { id: string; name: string; adminId?: string; role?: string }[] }),
  get: (id: string) => api.get(`/admins/${id}`).then((r) => r.data),
  create: (payload: object) => api.post('/admins', payload).then((r) => r.data),
  update: (id: string, payload: object) => api.put(`/admins/${id}`, payload).then((r) => r.data),
  status: (id: string, status: string) => api.patch(`/admins/${id}/status`, { status }).then((r) => r.data),
};

export const careHomeApi = {
  list: (params?: object) => api.get('/care-homes', { params }).then((r) => r.data as { items: CareHome[] }),
  get: (id: string) => api.get(`/care-homes/${id}`).then((r) => r.data as CareHome),
  create: (payload: object) => api.post('/care-homes', payload).then((r) => r.data as CareHome),
  update: (id: string, payload: object) => api.put(`/care-homes/${id}`, payload).then((r) => r.data as CareHome),
  status: (id: string, status: string) => api.patch(`/care-homes/${id}/status`, { status }).then((r) => r.data as CareHome),
  remove: (id: string) => api.delete(`/care-homes/${id}`).then((r) => r.data),
};

export const jobRoleApi = {
  list: (params?: object) => api.get('/job-roles', { params }).then((r) => r.data as { items: JobRole[] }),
  get: (id: string) => api.get(`/job-roles/${id}`).then((r) => r.data as JobRole),
  create: (payload: object) => api.post('/job-roles', payload).then((r) => r.data as JobRole),
  update: (id: string, payload: object) => api.put(`/job-roles/${id}`, payload).then((r) => r.data as JobRole),
  status: (id: string, status: string) => api.patch(`/job-roles/${id}/status`, { status }).then((r) => r.data as JobRole),
  remove: (id: string) => api.delete(`/job-roles/${id}`).then((r) => r.data),
};

export const timesheetApi = {
  list: (params?: object) => api.get('/timesheets', { params }).then((r) => r.data as Paginated<Timesheet>),
  get: (id: string) => api.get(`/timesheets/${id}`).then((r) => r.data as Timesheet),
  create: (payload: object) => api.post('/timesheets', payload).then((r) => r.data as Timesheet),
  update: (id: string, payload: object) => api.put(`/timesheets/${id}`, payload).then((r) => r.data as Timesheet),
  editHours: (id: string, payload: { startTime?: string; endTime?: string; breakDuration?: number }) =>
    api.patch(`/timesheets/${id}/hours`, payload).then((r) => r.data as Timesheet),
  submit: (id: string) => api.post(`/timesheets/${id}/submit`).then((r) => r.data),
  adminVerify: (id: string, payload: object) => api.post(`/timesheets/${id}/admin-verify`, payload).then((r) => r.data),
  adminReject: (id: string, payload: object) => api.post(`/timesheets/${id}/admin-reject`, payload).then((r) => r.data),
  approve: (id: string, payload?: object) => api.post(`/timesheets/${id}/super-admin-approve`, payload ?? {}).then((r) => r.data),
  reject: (id: string, payload: object) => api.post(`/timesheets/${id}/super-admin-reject`, payload).then((r) => r.data),
  pdfUrl: (id: string) => `${API_BASE_URL}/timesheets/${id}/pdf`,
  weekly: (params?: object) => api.get('/timesheets/summary/weekly', { params }).then((r) => r.data),
  monthly: (params?: object) => api.get('/timesheets/summary/monthly', { params }).then((r) => r.data),
};

export const dashboardApi = {
  staff: () =>
    api.get('/dashboard/staff').then(
      (r) =>
        r.data as {
          employee: Employee;
          weekMinutes: number;
          pending: number;
          approved: number;
          monthMinutes: number;
          weekly: { date: string; shifts: number; hours: number }[];
          statusMix: { approved: number; pending: number; rejected: number; draft: number };
        },
    ),
  admin: () =>
    api.get('/dashboard/admin').then(
      (r) =>
        r.data as {
          employees: number;
          submittedToday: number;
          pendingReview: number;
          verified: number;
          rejected: number;
          weekly: { date: string; submitted: number; hours: number }[];
          recent: Timesheet[];
        },
    ),
  superAdmin: () =>
    api.get('/dashboard/super-admin').then(
      (r) =>
        r.data as {
          employees: number;
          admins: number;
          careHomes: number;
          jobRoles: number;
          todayShifts: number;
          pendingAdmin: number;
          pendingApprovals: number;
          approvedMonth: number;
          monthMinutes: number;
          weekly: { date: string; count: number }[];
          approvedVsRejected: { approved: number; rejected: number; pending: number };
          careHomeHours: { _id: string; minutes: number }[];
          topEmployees: { _id: string; minutes: number }[];
        },
    ),
};

export const reportsApi = {
  timesheets: (params?: object) => api.get('/reports/timesheets', { params }).then((r) => r.data),
  hours: (params?: object) => api.get('/reports/hours', { params }).then((r) => r.data),
  careHomes: (params?: object) => api.get('/reports/care-homes', { params }).then((r) => r.data),
  csvUrl: (params: URLSearchParams) => `${API_BASE_URL}/reports/timesheets?${params.toString()}&format=csv`,
};

export const settingsApi = {
  get: () => api.get('/settings').then((r) => r.data),
  update: (payload: object) => api.put('/settings', payload).then((r) => r.data),
};

export const auditApi = {
  list: (params?: object) => api.get('/audit-logs', { params }).then((r) => r.data),
};

export const notificationApi = {
  list: () => api.get('/notifications').then((r) => r.data as { items: NotificationItem[]; unread: number }),
  read: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  readAll: () => api.patch('/notifications/read-all').then((r) => r.data),
};

export const searchApi = {
  query: (q: string) => api.get('/search', { params: { q } }).then((r) => r.data),
};

export const chatApi = {
  directory: () => api.get('/chat/directory').then((r) => r.data as { items: ChatPerson[] }),
  unread: () => api.get('/chat/unread').then((r) => r.data as { unread: number }),
  conversations: () => api.get('/chat/conversations').then((r) => r.data as { items: ChatConversation[] }),
  openDirect: (userId: string) => api.post('/chat/conversations/direct', { userId }).then((r) => r.data as ChatConversation),
  broadcast: (payload: object) =>
    api.post('/chat/conversations/broadcast', payload).then((r) => r.data as {
      conversation: ChatConversation;
      conversations?: ChatConversation[];
      message?: ChatMessage;
      delivery?: 'GROUP' | 'INDIVIDUAL';
      count?: number;
    }),
  messages: (id: string, params?: object) =>
    api.get(`/chat/conversations/${id}/messages`, { params }).then((r) => r.data as { conversation: ChatConversation; items: ChatMessage[] }),
  send: (id: string, payload: { body?: string; sticker?: string }) =>
    api.post(`/chat/conversations/${id}/messages`, payload).then((r) => r.data as ChatMessage),
  read: (id: string) => api.post(`/chat/conversations/${id}/read`).then((r) => r.data),
};
