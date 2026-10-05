import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { dashboardApi } from '../../api/services';
import { Button, PageHeader, Skeleton, StatCard } from '../../components/ui';

export function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: dashboardApi.admin });
  if (isLoading || !data) return <Skeleton className="h-80" />;
  return (
    <div className="space-y-5">
      <PageHeader title="Quadrant Care Dashboard" subtitle="Review submitted staff timesheets" actions={<Link to="/admin/timesheets?status=SUBMITTED,ADMIN_REVIEW,RESUBMITTED"><Button variant="accent">Review pending</Button></Link>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Employees" value={data.employees} />
        <StatCard label="Today submitted" value={data.submittedToday} accent="bg-gradient-to-br from-sky-500 to-brand-700" />
        <StatCard label="Pending review" value={data.pendingReview} accent="bg-gradient-to-br from-amber-500 to-orange-600" />
        <StatCard label="Verified" value={data.verified} accent="bg-gradient-to-br from-blue-600 to-violet-600" />
        <StatCard label="Rejected" value={data.rejected} accent="bg-gradient-to-br from-rose-500 to-red-600" />
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="card min-w-0 p-4">
          <h3 className="mb-3 font-semibold">Weekly submitted timesheets</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={data.weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Area dataKey="submitted" stroke="#065FDF" fill="#d1e3fd" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card min-w-0 p-4">
          <h3 className="mb-3 font-semibold">Hours by day</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={data.weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#065FDF" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
