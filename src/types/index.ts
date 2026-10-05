export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  status: string;
  employeeId?: string;
  adminId?: string;
  lastLogin?: string;
  themePreference?: 'light' | 'dark' | 'system';
  hasPasscode?: boolean;
  mustChangePassword?: boolean;
  signaturePath?: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  mobile: string;
  profilePhoto?: string;
  address?: string;
  dateOfBirth?: string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  loginEnabled: boolean;
  jobRoleId: JobRole | string;
  careHomeId?: CareHome | string;
}

export interface CareHome {
  _id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface JobRole {
  _id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Timesheet {
  _id: string;
  timesheetId: string;
  employeeId?: string;
  userId?: string;
  ownerRole?: 'STAFF' | 'ADMIN';
  jobRoleId?: string;
  employeeSnapshot: { name: string; employeeId: string; email?: string; mobile?: string };
  careHomeSnapshot: { name: string };
  jobRoleSnapshot: { name: string };
  date: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  totalMinutes: number;
  totalHoursDisplay: string;
  inchargeName?: string;
  careHomeSignaturePath?: string;
  remarks?: string;
  status: string;
  submittedAt?: string;
  adminReviewedAt?: string;
  adminSignaturePath?: string;
  adminRemarks?: string;
  adminReviewedBy?: { name?: string; adminId?: string } | string;
  superAdminApprovedBy?: { name?: string } | string;
  superAdminApprovedAt?: string;
  superAdminRemarks?: string;
  superAdminSignaturePath?: string;
  rejectionReason?: string;
  history?: { status: string; actorName?: string; note?: string; at: string }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface NotificationItem {
  _id: string;
  title: string;
  description: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  createdAt: string;
}

export interface ChatPerson {
  id: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  adminId?: string;
  employeeId?: string;
}

export interface ChatConversation {
  _id: string;
  type: 'DIRECT' | 'BROADCAST';
  title: string;
  createdBy: string;
  audience?: string;
  participants: { userId: string; name: string; role: string; adminId?: string; employeeId?: string }[];
  other?: { userId: string; name: string; role: string };
  lastMessageAt?: string;
  lastMessageText?: string;
  lastSenderId?: string;
  unread: number;
  memberCount: number;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  kind: 'TEXT' | 'STICKER';
  body?: string;
  sticker?: string;
  createdAt: string;
  deliveredTo: string[];
  readBy: { userId: string; at: string }[];
  mine: boolean;
  ticks: 'sent' | 'delivered' | 'read';
}
