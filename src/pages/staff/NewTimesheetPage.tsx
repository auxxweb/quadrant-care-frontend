import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi, employeeApi, timesheetApi } from '../../api/services';
import { useAuth } from '../../store/auth';
import { Button, Input, PageHeader, Select, TimeInput } from '../../components/ui';
import { CareHomeSelect } from '../../components/timesheet/CareHomeSelect';
import { SignaturePad } from '../../components/timesheet/SignaturePad';
import { calculateShiftDuration, employeeJobRoles, employeePrimaryJobRole, toInputDate } from '../../utils';
import { timesheetDetailPath } from '../../utils/timesheetLinks';

const schema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  breakDuration: z.coerce.number().min(0, 'Break duration cannot be negative.'),
  jobRoleId: z.string().optional(),
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
  const [signatureError, setSignatureError] = useState('');
  const [searchParams] = useSearchParams();
  const isAdmin = user?.role === 'ADMIN';
  // Admin or Super Admin creating a staff timesheet on behalf of an employee.
  // Super admins have no timesheets of their own, so it's always on behalf.
  const onBehalf = (isAdmin && searchParams.get('for') === 'employee') || user?.role === 'SUPER_ADMIN';
  // Own admin timesheet (no job role / signature, Super Admin as incharge).
  const adminOwn = isAdmin && !onBehalf;
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(searchParams.get('employeeId') ?? '');
  const [employeeError, setEmployeeError] = useState('');
  const employees = useQuery({
    queryKey: ['employees', 'dropdown'],
    queryFn: () => employeeApi.list({ limit: 200, status: 'ACTIVE' }),
    enabled: onBehalf,
  });
  const targetEmployee = onBehalf
    ? employees.data?.items.find((item) => item._id === selectedEmployeeId)
    : employee;
  const assignedRoles = employeeJobRoles(targetEmployee);
  const primaryRole = employeePrimaryJobRole(targetEmployee);
  const directory = useQuery({
    queryKey: ['admins', 'directory'],
    queryFn: adminApi.directory,
    enabled: adminOwn,
  });
  const superAdminName = directory.data?.items.find((item) => item.role === 'SUPER_ADMIN')?.name || 'Super Admin';
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: toInputDate(new Date()), startTime: '08:00', endTime: '20:00', breakDuration: 60, jobRoleId: '', careHomeId: '', inchargeName: '' },
  });

  useEffect(() => {
    if (adminOwn && superAdminName) form.setValue('inchargeName', superAdminName);
  }, [adminOwn, superAdminName, form]);

  useEffect(() => {
    if (adminOwn) return;
    const current = form.getValues('jobRoleId');
    // Default to the primary role; reset if the chosen employee doesn't have the current role.
    if (!current || !assignedRoles.some((role) => role._id === current)) {
      form.setValue('jobRoleId', primaryRole?._id ?? '');
    }
  }, [adminOwn, primaryRole?._id, selectedEmployeeId, form]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const selectedRole = assignedRoles.find((role) => role._id === watch.jobRoleId) ?? primaryRole;

  async function save(values: FormValues, submit: boolean) {
    if (onBehalf && !selectedEmployeeId) {
      setEmployeeError('Select an employee.');
      return;
    }
    const jobRoleId = adminOwn ? undefined : values.jobRoleId || primaryRole?._id;
    if (!adminOwn && !jobRoleId) {
      toast.error('Select a job role.');
      return;
    }
    if (!adminOwn && submit && !careHomeSignature) {
      setSignatureError('Care Home In-Charge Signature is required.');
      return;
    }
    const created = await timesheetApi.create({
      ...values,
      ...(jobRoleId ? { jobRoleId } : {}),
      ...(onBehalf ? { employeeId: selectedEmployeeId } : {}),
      inchargeName: adminOwn ? superAdminName : values.inchargeName,
      ...(!adminOwn && careHomeSignature ? { careHomeSignature } : {}),
      submit,
    });
    await qc.invalidateQueries();
    toast.success(submit ? 'Timesheet submitted successfully.' : 'Draft saved.');
    navigate(timesheetDetailPath(user?.role, created._id));
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader
        title={onBehalf ? 'Add employee timesheet' : 'Add timesheet'}
        subtitle={adminOwn ? 'Admin timesheet' : onBehalf ? (targetEmployee ? `For ${targetEmployee.fullName}` : 'Create a timesheet on behalf of an employee') : selectedRole?.name ?? 'Staff timesheet'}
      />
      <form className="card space-y-4 p-5" onSubmit={form.handleSubmit((v) => save(v, true))}>
        {onBehalf && (
          <Select
            label="Employee"
            value={selectedEmployeeId}
            onChange={(event) => { setSelectedEmployeeId(event.target.value); if (event.target.value) setEmployeeError(''); }}
            error={employeeError}
          >
            <option value="">{employees.isLoading ? 'Loading employees…' : 'Select employee'}</option>
            {(employees.data?.items ?? []).map((item) => (
              <option key={item._id} value={item._id}>{item.fullName} ({item.employeeId})</option>
            ))}
          </Select>
        )}
        <Input label="Date" type="date" {...form.register('date')} />
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Start time" value={watch.startTime} onChange={(value) => form.setValue('startTime', value, { shouldValidate: true })} />
          <TimeInput label="End time" value={watch.endTime} onChange={(value) => form.setValue('endTime', value, { shouldValidate: true })} error={form.formState.errors.endTime?.message} />
        </div>
        <Input label="Break duration (minutes)" type="number" min={0} {...form.register('breakDuration')} />
        <div className="rounded-2xl bg-brand-50 p-4 text-brand-600 dark:bg-brand-900/30 dark:text-white">
          <p className="text-xs uppercase tracking-wide">Total hours worked</p>
          <p className="text-3xl font-bold">{hours}</p>
          {hoursError && <p className="mt-2 text-sm text-red-600">{hoursError}</p>}
        </div>
        {!adminOwn && assignedRoles.length > 1 && (
          <Select label="Job role" {...form.register('jobRoleId', { required: true })} value={watch.jobRoleId ?? ''} error={form.formState.errors.jobRoleId?.message}>
            {assignedRoles.map((role) => (
              <option key={role._id} value={role._id}>
                {role._id === primaryRole?._id ? `${role.name} (primary)` : role.name}
              </option>
            ))}
          </Select>
        )}
        {!adminOwn && assignedRoles.length <= 1 && <Input label="Job role" value={assignedRoles[0]?.name ?? primaryRole?.name ?? ''} readOnly />}
        <CareHomeSelect {...form.register('careHomeId')} error={form.formState.errors.careHomeId?.message} />
        {adminOwn ? (
          <Input label="Incharge / supervisor" value={superAdminName} readOnly />
        ) : (
          <Input label="Incharge / supervisor" {...form.register('inchargeName')} error={form.formState.errors.inchargeName?.message} />
        )}
        {!adminOwn && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Care Home In-Charge Signature</p>
            <p className="text-xs text-slate-500">Ask the care home admin or incharge to sign here when the shift is confirmed.</p>
            <SignaturePad value={careHomeSignature} onChange={(value) => { setCareHomeSignature(value); if (value) setSignatureError(''); }} />
            {signatureError && <p className="text-sm text-red-600">{signatureError}</p>}
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
