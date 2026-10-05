import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi, timesheetApi } from '../../api/services';
import { useAuth } from '../../store/auth';
import { Button, Input, PageHeader } from '../../components/ui';
import { InchargeSelect } from '../../components/timesheet/InchargeSelect';
import { CareHomeSelect } from '../../components/timesheet/CareHomeSelect';
import { SignaturePad } from '../../components/timesheet/SignaturePad';
import { calculateShiftDuration, toInputDate } from '../../utils';
import { timesheetDetailPath } from '../../utils/timesheetLinks';
import type { JobRole } from '../../types';

const schema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  breakDuration: z.coerce.number().min(0),
  careHomeId: z.string().min(1, 'Select a care home'),
  inchargeName: z.string().min(1, 'Incharge name is required'),
  remarks: z.string().optional(),
}).superRefine((values, ctx) => {
  try {
    calculateShiftDuration(values.startTime, values.endTime, Number(values.breakDuration || 0));
  } catch (error) {
    ctx.addIssue({
      code: 'custom',
      path: ['endTime'],
      message: error instanceof Error ? error.message : 'A shift must be less than 24 hours in a day.',
    });
  }
});

type FormValues = z.infer<typeof schema>;

export function NewTimesheetPage() {
  const { user, employee } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [hours, setHours] = useState('0:00');
  const [hoursError, setHoursError] = useState('');
  const [careHomeSignature, setCareHomeSignature] = useState('');
  const isAdmin = user?.role === 'ADMIN';
  const job = employee?.jobRoleId as JobRole | undefined;
  const directory = useQuery({
    queryKey: ['admins', 'directory'],
    queryFn: adminApi.directory,
    enabled: isAdmin,
  });
  const superAdminName = directory.data?.items.find((item) => item.role === 'SUPER_ADMIN')?.name || 'Super Admin';
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: toInputDate(new Date()), startTime: '08:00', endTime: '20:00', breakDuration: 60, careHomeId: '', inchargeName: '' },
  });

  useEffect(() => {
    if (isAdmin && superAdminName) form.setValue('inchargeName', superAdminName);
  }, [isAdmin, superAdminName, form]);

  const watch = form.watch();
  useMemo(() => {
    try {
      setHours(calculateShiftDuration(watch.startTime || '00:00', watch.endTime || '00:00', Number(watch.breakDuration || 0)).formattedHours);
      setHoursError('');
    } catch (error) {
      setHours('Invalid');
      setHoursError(error instanceof Error ? error.message : 'A shift must be less than 24 hours in a day.');
    }
  }, [watch.startTime, watch.endTime, watch.breakDuration]);

  async function save(values: FormValues, submit: boolean) {
    const created = await timesheetApi.create({
      ...values,
      inchargeName: isAdmin ? superAdminName : values.inchargeName,
      ...( !isAdmin && careHomeSignature ? { careHomeSignature } : {}),
      submit,
    });
    await qc.invalidateQueries();
    toast.success(submit ? 'Timesheet submitted successfully.' : 'Draft saved.');
    navigate(timesheetDetailPath(user?.role, created._id));
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Add timesheet" subtitle={isAdmin ? 'Admin timesheet' : job?.name ?? 'Staff timesheet'} />
      <form className="card space-y-4 p-5" onSubmit={form.handleSubmit((v) => save(v, true))}>
        <Input label="Date" type="date" {...form.register('date')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start time" type="time" {...form.register('startTime')} />
          <Input label="End time" type="time" {...form.register('endTime')} error={form.formState.errors.endTime?.message} />
        </div>
        <Input label="Break duration (minutes)" type="number" {...form.register('breakDuration')} />
        <div className="rounded-2xl bg-brand-50 p-4 text-brand-600 dark:bg-brand-900/30 dark:text-white">
          <p className="text-xs uppercase tracking-wide">Total hours worked</p>
          <p className="text-3xl font-bold">{hours}</p>
          {hoursError && <p className="mt-2 text-sm text-red-600">{hoursError}</p>}
        </div>
        {!isAdmin && <Input label="Job role" value={job?.name ?? ''} readOnly />}
        <CareHomeSelect {...form.register('careHomeId')} error={form.formState.errors.careHomeId?.message} />
        {isAdmin ? (
          <Input label="Incharge / supervisor" value={superAdminName} readOnly />
        ) : (
          <InchargeSelect {...form.register('inchargeName')} error={form.formState.errors.inchargeName?.message} />
        )}
        {!isAdmin && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Care home admin signature (optional)</p>
            <p className="text-xs text-slate-500">Ask the care home admin or incharge to sign here when the shift is confirmed.</p>
            <SignaturePad value={careHomeSignature} onChange={setCareHomeSignature} />
          </div>
        )}
        <Input label="Remarks" {...form.register('remarks')} />
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={form.handleSubmit((v) => save(v, false))}>Save draft</Button>
          <Button type="submit" variant="accent">Submit</Button>
        </div>
      </form>
    </div>
  );
}
