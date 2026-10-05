import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardApi } from '../../api/services';
import { useAuth } from '../../store/auth';
import { firstName, formatMinutes, greeting } from '../../utils';
import { Button, Skeleton, StatCard } from '../../components/ui';
import type { JobRole } from '../../types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StaffDashboard() {
  const { employee, user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['staff-dashboard'], queryFn: dashboardApi.staff });
  const job = employee?.jobRoleId as JobRole | undefined;
  if (isLoading || !data) return <div className="grid gap-3"><Skeleton className="h-40" /><Skeleton className="h-28" /><Skeleton className="h-56" /></div>;

  const weekly = (data.weekly ?? []).map((item, index) => ({
    ...item,
    day: WEEKDAYS[index] ?? item.date,
  }));
  const statusMix = [
    { name: 'Approved', value: data.statusMix?.approved ?? 0, color: '#059669' },
    { name: 'Pending', value: data.statusMix?.pending ?? 0, color: '#d97706' },
    { name: 'Rejected', value: data.statusMix?.rejected ?? 0, color: '#dc2626' },
    { name: 'Draft', value: data.statusMix?.draft ?? 0, color: '#64748b' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-800 p-6 text-white shadow-card">
        <p className="text-sm text-white/80">{greeting()}, {firstName(user?.name)} 👋</p>
        <h1 className="mt-1 text-3xl font-bold">{employee?.fullName ?? user?.name}</h1>
        <p className="mt-2 text-white/80">{job?.name || 'Staff workspace'}</p>
      </section>
      <Link to="/staff/timesheets/new" className="block">
        <Button variant="accent" className="min-h-14 w-full text-base">
          <Plus className="h-5 w-5" /> Add Timesheet
        </Button>
      </Link>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="This week" value={formatMinutes(data.weekMinutes ?? 0)} hint="Hours worked" />
        <StatCard label="Pending" value={data.pending ?? 0} accent="bg-gradient-to-br from-amber-500 to-orange-500" />
        <StatCard label="Approved" value={data.approved ?? 0} accent="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard label="This month" value={formatMinutes(data.monthMinutes ?? 0)} accent="bg-gradient-to-br from-violet-600 to-brand-700" />
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="card min-w-0 p-4">
          <h3 className="mb-3 font-semibold">Hours this week</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#065FDF" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card min-w-0 p-4">
          <h3 className="mb-3 font-semibold">Shifts this week</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area dataKey="shifts" stroke="#065FDF" fill="#d1e3fd" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card min-w-0 p-4 lg:col-span-2">
          <h3 className="mb-3 font-semibold">This month by status</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {statusMix.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
