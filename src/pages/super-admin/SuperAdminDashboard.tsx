import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, AreaChart, Area, CartesianGrid, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { dashboardApi } from '../../api/services';
import { Button, PageHeader, Skeleton, StatCard } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { formatMinutes } from '../../utils';

export function SuperAdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['sa-dashboard'], queryFn: dashboardApi.superAdmin });
  if (isLoading || !data) return <Skeleton className="h-96" />;
  const pie = [
    { name: 'Approved', value: data.approvedVsRejected.approved, color: '#059669' },
    { name: 'Rejected', value: data.approvedVsRejected.rejected, color: '#dc2626' },
    { name: 'Pending', value: data.approvedVsRejected.pending, color: '#d97706' },
  ];
  return (
    <div className="space-y-5">
      <PageHeader
        title="Quadrant Care Dashboard"
        subtitle="Workforce overview"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/super-admin/employees/new"><Button>Add Employee</Button></Link>
            <Link to="/super-admin/admins"><Button variant="secondary">Add Admin</Button></Link>
            <Link to="/super-admin/approvals"><Button variant="accent">Admin requests</Button></Link>
            <Button
              variant="danger"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              Logout
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Employees" value={data.employees} />
        <StatCard label="Admins" value={data.admins} accent="bg-gradient-to-br from-violet-600 to-brand-800" />
        <StatCard label="Care homes" value={data.careHomes} accent="bg-gradient-to-br from-teal-500 to-brand-700" />
        <StatCard label="Job roles" value={data.jobRoles} accent="bg-gradient-to-br from-sky-500 to-blue-700" />
        <StatCard label="Today's shifts" value={data.todayShifts} accent="bg-gradient-to-br from-cyan-500 to-teal-600" />
        <StatCard label="Pending admin reviews" value={data.pendingAdmin} accent="bg-gradient-to-br from-amber-500 to-orange-600" />
        <StatCard label="Admin requests" value={data.pendingApprovals} accent="bg-gradient-to-br from-fuchsia-500 to-violet-700" />
        <StatCard label="Hours this month" value={formatMinutes(data.monthMinutes)} accent="bg-gradient-to-br from-emerald-500 to-teal-700" />
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="card min-w-0 p-4">
          <h3 className="mb-3 font-semibold">Timesheets submitted over time</h3>
          <div className="h-56"><ResponsiveContainer><AreaChart data={data.weekly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" hide /><YAxis /><Tooltip /><Area dataKey="count" stroke="#065FDF" fill="#d1e3fd" /></AreaChart></ResponsiveContainer></div>
        </div>
        <div className="card min-w-0 p-4">
          <h3 className="mb-3 font-semibold">Approved vs rejected</h3>
          <div className="h-56"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>{pie.map((e) => <Cell key={e.name} fill={e.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="card min-w-0 p-4">
          <h3 className="mb-3 font-semibold">Hours by care home</h3>
          <div className="h-56"><ResponsiveContainer><BarChart data={data.careHomeHours}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="_id" /><YAxis /><Tooltip /><Bar dataKey="minutes" fill="#065FDF" radius={8} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="card min-w-0 p-4">
          <h3 className="mb-3 font-semibold">Employees with highest hours</h3>
          <ul className="space-y-3">{data.topEmployees.map((item: { _id: string; minutes: number }) => <li key={item._id} className="flex justify-between"><span>{item._id}</span><strong>{formatMinutes(item.minutes)}</strong></li>)}</ul>
        </div>
      </div>
    </div>
  );
}
