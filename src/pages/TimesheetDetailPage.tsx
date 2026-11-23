import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { timesheetApi } from '../api/services';
import { TimesheetPreview } from '../components/timesheet/TimesheetPreview';
import { SignaturePad } from '../components/timesheet/SignaturePad';
import { CareHomeSelect } from '../components/timesheet/CareHomeSelect';
import { Button, ConfirmDialog, Input, Modal, Select, Skeleton, TimeInput } from '../components/ui';
import { useAuth } from '../store/auth';
import { useProductivePanel } from '../hooks/useMetricsFocus';
import {
  calculateShiftDuration,
  employeeJobRoles,
  employeePrimaryJobRole,
  fileUrl,
  toInputDate,
} from '../utils';
import { downloadWithToast, saveAxiosBlob } from '../utils/download';
import { exportTimesheetSheetsAsJpeg } from '../utils/timesheetJpeg';
import type { Timesheet } from '../types';

const STAFF_WITHDRAW_STATUSES = ['SUBMITTED', 'ADMIN_REVIEW', 'RESUBMITTED', 'SUPER_ADMIN_REVIEW'];

function listPathForRole(role?: string) {
  if (role === 'ADMIN') return '/admin/timesheets';
  if (role === 'SUPER_ADMIN') return '/super-admin/timesheets';
  return '/staff/timesheets';
}

function toEditDate(value: string) {
  try {
    return toInputDate(new Date(value));
  } catch {
    return String(value).slice(0, 10);
  }
}

export function TimesheetDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['timesheet', id], queryFn: () => timesheetApi.get(id) });
  if (isLoading || !data) return <Skeleton className="h-80" />;
  return <TimesheetDetailBody key={data._id} id={id} data={data} />;
}

function TimesheetDetailBody({ id, data }: { id: string; data: Timesheet }) {
  const { user, employee } = useAuth();
  const navigate = useNavigate();
  const productivePanel = useProductivePanel();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [signature, setSignature] = useState('');
  const [careHomeSignature, setCareHomeSignature] = useState('');
  const [useSavedSignature, setUseSavedSignature] = useState(Boolean(user?.signaturePath));
  const [remarks, setRemarks] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [hoursModalOpen, setHoursModalOpen] = useState(searchParams.get('edit') === 'hours');
  const assignedRoles = employeeJobRoles(employee);
  const primaryRole = employeePrimaryJobRole(employee);
  const [edit, setEdit] = useState({
    date: toEditDate(data.date),
    startTime: data.startTime,
    endTime: data.endTime,
    breakDuration: data.breakDuration,
    careHomeId: data.careHomeId ?? '',
    jobRoleId: data.jobRoleId ?? primaryRole?._id ?? '',
    inchargeName: data.inchargeName ?? '',
    remarks: data.remarks ?? '',
  });
  const [hoursEdit, setHoursEdit] = useState({
    startTime: data.startTime,
    endTime: data.endTime,
    breakDuration: data.breakDuration,
  });

  useEffect(() => {
    setHoursEdit({
      startTime: data.startTime,
      endTime: data.endTime,
      breakDuration: data.breakDuration,
    });
    setEdit({
      date: toEditDate(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      breakDuration: data.breakDuration,
      careHomeId: data.careHomeId ?? '',
      jobRoleId: data.jobRoleId ?? primaryRole?._id ?? '',
      inchargeName: data.inchargeName ?? '',
      remarks: data.remarks ?? '',
    });
  }, [
    data.date,
    data.startTime,
    data.endTime,
    data.breakDuration,
    data.careHomeId,
    data.jobRoleId,
    data.inchargeName,
    data.remarks,
    primaryRole?._id,
  ]);

  useEffect(() => {
    setHoursModalOpen(searchParams.get('edit') === 'hours');
  }, [searchParams]);

  const isOwn = Boolean(user?.id && data.userId && String(user.id) === String(data.userId));
  const isDraft = data.status === 'DRAFT';
  const isRejected = data.status === 'ADMIN_REJECTED' || data.status === 'SUPER_ADMIN_REJECTED';
  const ownerCanEdit = (user?.role === 'STAFF' || (user?.role === 'ADMIN' && isOwn)) && data.status !== 'APPROVED';
  const isStaffSheet = data.ownerRole !== 'ADMIN';
  const missingCareHomeSignature = isStaffSheet && !data.careHomeSignaturePath && !careHomeSignature;
  const ownerCanWithdraw = Boolean(
    isOwn
    && (user?.role === 'STAFF' || user?.role === 'ADMIN')
    && (
      data.ownerRole === 'ADMIN'
        ? data.status === 'SUPER_ADMIN_REVIEW'
        : STAFF_WITHDRAW_STATUSES.includes(data.status)
    ),
  );
  const ownerCanDelete = ownerCanEdit;
  const superCanDelete = user?.role === 'SUPER_ADMIN';
  const canDelete = ownerCanDelete || superCanDelete;
  const managerCanEditHours = Boolean(
    !productivePanel
    && isStaffSheet
    && data.status !== 'APPROVED'
    && user
    && (user.role === 'SUPER_ADMIN' || (user.role === 'ADMIN' && !isOwn)),
  );
  const adminCanReview = user?.role === 'ADMIN' && !isOwn && data.ownerRole !== 'ADMIN' && ['SUBMITTED', 'ADMIN_REVIEW', 'RESUBMITTED'].includes(data.status);
  const superCanApprove = user?.role === 'SUPER_ADMIN' && (
    ['SUPER_ADMIN_REVIEW', 'ADMIN_VERIFIED'].includes(data.status)
    || (data.ownerRole === 'ADMIN' && ['SUBMITTED', 'ADMIN_REVIEW', 'RESUBMITTED'].includes(data.status))
  );

  function buildUpdatePayload() {
    return {
      date: edit.date,
      startTime: edit.startTime,
      endTime: edit.endTime,
      breakDuration: Number(edit.breakDuration || 0),
      careHomeId: edit.careHomeId,
      ...(isStaffSheet && edit.jobRoleId ? { jobRoleId: edit.jobRoleId } : {}),
      inchargeName: edit.inchargeName,
      remarks: edit.remarks,
      ...(careHomeSignature ? { careHomeSignature } : {}),
    };
  }

  function assertEditValid() {
    try {
      calculateShiftDuration(edit.startTime, edit.endTime, Number(edit.breakDuration || 0));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'A shift must be less than 24 hours in a day.';
      toast.error(message);
      throw error;
    }
    if (!edit.careHomeId) {
      toast.error('Select a care home.');
      throw new Error('Select a care home.');
    }
    if (isStaffSheet && assignedRoles.length > 1 && !edit.jobRoleId) {
      toast.error('Select a job role.');
      throw new Error('Select a job role.');
    }
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (careHomeSignature) await timesheetApi.update(id, { careHomeSignature });
      return timesheetApi.submit(id);
    },
    onSuccess: () => { toast.success('Timesheet submitted successfully.'); qc.invalidateQueries(); },
  });
  const verify = useMutation({
    mutationFn: () => timesheetApi.adminVerify(id, {
      remarks,
      ...(useSavedSignature && user?.signaturePath ? { useSavedSignature: true } : { signature }),
    }),
    onSuccess: () => { toast.success('Timesheet approved.'); qc.invalidateQueries(); },
  });
  const approve = useMutation({
    mutationFn: () => timesheetApi.approve(id, { remarks }),
    onSuccess: () => { toast.success('Timesheet approved successfully.'); qc.invalidateQueries(); },
  });
  const reject = useMutation({
    mutationFn: () => (user?.role === 'ADMIN' ? timesheetApi.adminReject(id, { reason }) : timesheetApi.reject(id, { reason })),
    onSuccess: () => { toast.success('Timesheet rejected.'); setRejectOpen(false); qc.invalidateQueries(); },
  });
  const saveDraft = useMutation({
    mutationFn: async () => {
      assertEditValid();
      return timesheetApi.update(id, buildUpdatePayload());
    },
    onSuccess: () => {
      toast.success(isDraft ? 'Draft saved.' : 'Changes saved.');
      setCareHomeSignature('');
      qc.invalidateQueries();
    },
  });
  const resubmit = useMutation({
    mutationFn: async () => {
      assertEditValid();
      if (isStaffSheet && missingCareHomeSignature) {
        toast.error('Care Home In-Charge Signature is required.');
        throw new Error('Signature required');
      }
      await timesheetApi.update(id, buildUpdatePayload());
      return timesheetApi.submit(id);
    },
    onSuccess: () => {
      toast.success('Timesheet submitted successfully.');
      setCareHomeSignature('');
      qc.invalidateQueries();
    },
  });
  const withdraw = useMutation({
    mutationFn: () => timesheetApi.withdraw(id),
    onSuccess: () => {
      toast.success('Timesheet returned to draft.');
      setWithdrawOpen(false);
      qc.invalidateQueries();
    },
  });
  const remove = useMutation({
    mutationFn: () => timesheetApi.remove(
      id,
      data.status === 'APPROVED' && superCanDelete ? { reason: voidReason.trim() } : undefined,
    ),
    onSuccess: () => {
      toast.success(data.status === 'APPROVED' ? 'Approved timesheet voided.' : 'Timesheet deleted.');
      setDeleteOpen(false);
      qc.invalidateQueries({ queryKey: ['timesheets'] });
      navigate(listPathForRole(user?.role));
    },
  });
  const saveHours = useMutation({
    mutationFn: async () => {
      try {
        calculateShiftDuration(hoursEdit.startTime, hoursEdit.endTime, Number(hoursEdit.breakDuration || 0));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'A shift must be less than 24 hours in a day.';
        toast.error(message);
        throw error;
      }
      return timesheetApi.editHours(id, hoursEdit);
    },
    onSuccess: () => {
      toast.success('Hours updated.');
      closeHoursModal();
      qc.invalidateQueries({ queryKey: ['timesheet', id] });
      qc.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });

  let previewHours = '—';
  try {
    previewHours = calculateShiftDuration(hoursEdit.startTime, hoursEdit.endTime, Number(hoursEdit.breakDuration || 0)).formattedHours;
  } catch {
    previewHours = 'Invalid';
  }

  let editPreviewHours = '—';
  try {
    editPreviewHours = calculateShiftDuration(edit.startTime, edit.endTime, Number(edit.breakDuration || 0)).formattedHours;
  } catch {
    editPreviewHours = 'Invalid';
  }

  function openHoursModal() {
    setHoursEdit({
      startTime: data.startTime,
      endTime: data.endTime,
      breakDuration: data.breakDuration,
    });
    setHoursModalOpen(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('edit', 'hours');
      return next;
    }, { replace: true });
  }

  function closeHoursModal() {
    setHoursModalOpen(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('edit');
      return next;
    }, { replace: true });
  }

  const [pdfLoading, setPdfLoading] = useState(false);
  const [jpegLoading, setJpegLoading] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  async function downloadPdf() {
    setPdfLoading(true);
    await downloadWithToast(async () => {
      const response = await timesheetApi.downloadPdf(id);
      await saveAxiosBlob(response, `${data.timesheetId || 'timesheet'}.pdf`);
    }, 'PDF downloaded.');
    setPdfLoading(false);
  }

  async function downloadJpeg() {
    setJpegLoading(true);
    await downloadWithToast(async () => {
      const root = sheetRef.current;
      if (!root) throw new Error('Timesheet preview is not ready yet.');
      await exportTimesheetSheetsAsJpeg([root], data.timesheetId || 'timesheet');
    }, 'JPEG downloaded.');
    setJpegLoading(false);
  }

  const voidNeedsReason = data.status === 'APPROVED' && superCanDelete;
  const deleteConfirmDisabled = voidNeedsReason && voidReason.trim().length < 3;

  return (
    <div className="space-y-5">
      <div ref={sheetRef}>
        <TimesheetPreview item={data} />
      </div>
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant="secondary" onClick={() => window.print()}>Print</Button>
        <Button variant="secondary" loading={pdfLoading} onClick={downloadPdf}>Download PDF</Button>
        <Button variant="secondary" loading={jpegLoading} onClick={downloadJpeg}>Download JPEG</Button>
        {managerCanEditHours && (
          <Button variant="accent" onClick={openHoursModal}>Edit hours & break</Button>
        )}
        {ownerCanWithdraw && (
          <Button variant="secondary" onClick={() => setWithdrawOpen(true)}>Withdraw to draft</Button>
        )}
        {ownerCanEdit && isDraft && (
          <Button variant="accent" disabled={missingCareHomeSignature} loading={submit.isPending} onClick={() => submit.mutate()}>Submit</Button>
        )}
        {canDelete && (
          <Button variant="danger" onClick={() => { setVoidReason(''); setDeleteOpen(true); }}>
            {voidNeedsReason ? 'Void timesheet' : 'Delete'}
          </Button>
        )}
      </div>
      {ownerCanEdit && (
        <div className="card space-y-4 p-5">
          <h3 className="text-lg font-semibold">
            {isRejected ? 'Correct timesheet' : isDraft ? 'Edit draft' : 'Edit timesheet'}
          </h3>
          {data.rejectionReason && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">Rejection reason: {data.rejectionReason}</p>}
          <Input label="Date" type="date" value={edit.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdit((v) => ({ ...v, date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <TimeInput label="Start" value={edit.startTime} onChange={(value) => setEdit((v) => ({ ...v, startTime: value }))} />
            <TimeInput label="End" value={edit.endTime} onChange={(value) => setEdit((v) => ({ ...v, endTime: value }))} />
          </div>
          <Input label="Break (minutes)" type="number" min={0} value={edit.breakDuration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdit((v) => ({ ...v, breakDuration: Number(e.target.value) }))} />
          <div className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
            <span className="text-slate-500">Total hours: </span>
            <span className="font-semibold">{editPreviewHours}</span>
          </div>
          <CareHomeSelect
            value={edit.careHomeId}
            onChange={(e) => setEdit((v) => ({ ...v, careHomeId: e.target.value }))}
          />
          {isStaffSheet && assignedRoles.length > 1 && (
            <Select
              label="Job role"
              value={edit.jobRoleId}
              onChange={(e) => setEdit((v) => ({ ...v, jobRoleId: e.target.value }))}
            >
              <option value="">Select a job role</option>
              {assignedRoles.map((role) => (
                <option key={role._id} value={role._id}>{role.name}</option>
              ))}
            </Select>
          )}
          {data.ownerRole === 'ADMIN' ? (
            <Input label="Incharge / supervisor" value={edit.inchargeName || 'Super Admin'} readOnly />
          ) : (
            <Input label="Incharge / supervisor" value={edit.inchargeName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdit((v) => ({ ...v, inchargeName: e.target.value }))} />
          )}
          <Input label="Remarks" value={edit.remarks} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdit((v) => ({ ...v, remarks: e.target.value }))} />
          {isStaffSheet && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Care Home In-Charge Signature</p>
              {data.careHomeSignaturePath ? (
                <p className="text-xs text-slate-500">Already signed. Draw below only to replace the signature.</p>
              ) : (
                <p className="text-sm text-red-600">A Care Home In-Charge Signature is required before submitting.</p>
              )}
              <SignaturePad value={careHomeSignature} onChange={setCareHomeSignature} />
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              className="flex-1"
              loading={saveDraft.isPending}
              onClick={() => saveDraft.mutate()}
            >
              {isDraft ? 'Save draft' : 'Save changes'}
            </Button>
            {isRejected && (
              <Button
                variant="accent"
                className="flex-1"
                disabled={missingCareHomeSignature}
                loading={resubmit.isPending}
                onClick={() => resubmit.mutate()}
              >
                Resubmit
              </Button>
            )}
          </div>
        </div>
      )}
      {adminCanReview && (
        <div className="card space-y-4 p-5">
          <h3 className="text-lg font-semibold">Admin review</h3>
          <Input label="Review remarks" value={remarks} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemarks(e.target.value)} />
          {user?.signaturePath && useSavedSignature ? (
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved signature</p>
              <img src={fileUrl(user.signaturePath)} alt="Saved signature" className="mt-2 h-16 max-w-full object-contain" />
              <Button type="button" variant="ghost" className="mt-2" onClick={() => setUseSavedSignature(false)}>
                Draw a different signature
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {!user?.signaturePath && (
                <p className="text-sm text-slate-500">No saved signature yet. Draw one below, or save one in Settings to reuse it.</p>
              )}
              <SignaturePad value={signature} onChange={setSignature} />
              {user?.signaturePath && (
                <Button type="button" variant="ghost" onClick={() => { setUseSavedSignature(true); setSignature(''); }}>
                  Use saved signature
                </Button>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="danger" onClick={() => setRejectOpen(true)}>Reject</Button>
            <Button
              variant="accent"
              disabled={!(useSavedSignature && user?.signaturePath) && !signature}
              loading={verify.isPending}
              onClick={() => verify.mutate()}
            >
              Approve & Sign
            </Button>
          </div>
        </div>
      )}
      {superCanApprove && (
        <div className="card space-y-4 p-5">
          <h3 className="text-lg font-semibold">Final approval</h3>
          <Input label="Approval remarks" value={remarks} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemarks(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="danger" onClick={() => setRejectOpen(true)}>Reject</Button>
            <Button variant="accent" loading={approve.isPending} onClick={() => approve.mutate()}>Approve</Button>
          </div>
        </div>
      )}
      <Modal open={hoursModalOpen && managerCanEditHours} title="Edit hours & break" onClose={closeHoursModal}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Change start time, end time, or break for this staff timesheet.</p>
          <div className="grid grid-cols-2 gap-3">
            <TimeInput label="Start" value={hoursEdit.startTime} onChange={(value) => setHoursEdit((v) => ({ ...v, startTime: value }))} />
            <TimeInput label="End" value={hoursEdit.endTime} onChange={(value) => setHoursEdit((v) => ({ ...v, endTime: value }))} />
          </div>
          <Input label="Break (minutes)" type="number" min={0} value={hoursEdit.breakDuration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoursEdit((v) => ({ ...v, breakDuration: Number(e.target.value) }))} />
          <div className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
            <span className="text-slate-500">Total hours: </span>
            <span className="font-semibold">{previewHours}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={closeHoursModal}>Cancel</Button>
            <Button variant="accent" loading={saveHours.isPending} onClick={() => saveHours.mutate()}>Save hours</Button>
          </div>
        </div>
      </Modal>
      <Modal open={rejectOpen} title="Reject timesheet" onClose={() => setRejectOpen(false)}>
        <Input label="Rejection reason" value={reason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} />
        <Button className="mt-4 w-full" variant="danger" disabled={reason.length < 3} onClick={() => reject.mutate()}>Reject</Button>
      </Modal>
      <ConfirmDialog
        open={withdrawOpen}
        title="Withdraw timesheet"
        description="Return this timesheet to draft so you can edit or delete it? Approvers will no longer see it in their queue."
        confirmLabel="Withdraw"
        onClose={() => setWithdrawOpen(false)}
        onConfirm={() => withdraw.mutate()}
      />
      <Modal open={deleteOpen} title={voidNeedsReason ? 'Void approved timesheet' : 'Delete timesheet'} onClose={() => setDeleteOpen(false)}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {voidNeedsReason
            ? `Void ${data.timesheetId}? This permanently removes an approved timesheet and cannot be undone.`
            : `Delete ${data.timesheetId}? This cannot be undone.`}
        </p>
        {voidNeedsReason && (
          <div className="mt-4">
            <Input
              label="Reason"
              value={voidReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVoidReason(e.target.value)}
            />
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={deleteConfirmDisabled}
            loading={remove.isPending}
            onClick={() => remove.mutate()}
          >
            {voidNeedsReason ? 'Void' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
