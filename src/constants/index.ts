export const LOGO_SRC = '/logo.png';
export const BRAND_BLUE = '#065FDF';
export const APP_NAME = 'Quadrant Care';
export const COMPANY_NAME = 'Quadrant Care Services Ltd';
export const COMPANY_DETAILS = {
  phone: '+44 1582 943111',
  email: 'info@quadrantcare.co.uk',
  website: 'www.quadrantcare.co.uk',
  companyNo: '12019912',
};

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const TIMESHEET_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  ADMIN_REVIEW: 'ADMIN_REVIEW',
  ADMIN_VERIFIED: 'ADMIN_VERIFIED',
  ADMIN_REJECTED: 'ADMIN_REJECTED',
  SUPER_ADMIN_REVIEW: 'SUPER_ADMIN_REVIEW',
  APPROVED: 'APPROVED',
  SUPER_ADMIN_REJECTED: 'SUPER_ADMIN_REJECTED',
  RESUBMITTED: 'RESUBMITTED',
} as const;

export type TimesheetStatus = (typeof TIMESHEET_STATUS)[keyof typeof TIMESHEET_STATUS];

export const STATUS_META: Record<TimesheetStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
  SUBMITTED: { label: 'Submitted', className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200' },
  ADMIN_REVIEW: { label: 'Pending review', className: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200' },
  ADMIN_VERIFIED: { label: 'Admin verified', className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200' },
  ADMIN_REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200' },
  SUPER_ADMIN_REVIEW: { label: 'Awaiting approval', className: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200' },
  SUPER_ADMIN_REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200' },
  RESUBMITTED: { label: 'Resubmitted', className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200' },
};

export const HOME_PATH: Record<Role, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  ADMIN: '/admin/dashboard',
  STAFF: '/staff/dashboard',
};
