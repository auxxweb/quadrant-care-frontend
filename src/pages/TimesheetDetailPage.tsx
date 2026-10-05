import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getAccessToken } from '../api/client';
import { timesheetApi } from '../api/services';
import { TimesheetPreview } from '../components/timesheet/TimesheetPreview';
import { SignaturePad } from '../components/timesheet/SignaturePad';
import { Button, Input, Modal, Skeleton } from '../components/ui';
import { InchargeSelect } from '../components/timesheet/InchargeSelect';
import { useAuth } from '../store/auth';
import { calculateShiftDuration, fileUrl } from '../utils';
import type { Timesheet } from '../types';

export function TimesheetDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['timesheet', id], queryFn: () => timesheetApi.get(id) });
  if (isLoading || !data) return <Skeleton className="h-80" />;
  return <TimesheetDetailBody key={data._id} id={id} data={data} />;
}

function TimesheetDetailBody({ id, data }: { id: string; data: Timesheet }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [signature, setSignature] = useState('');
  const [useSavedSignature, setUseSavedSignature] = useState(Boolean(user?.signaturePath));
  const [remarks, setRemarks] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [hoursModalOpen, setHoursModalOpen] = useState(searchParams.get('edit') === 'hours');
  const [edit, setEdit] = useState({
    startTime: data.startTime,
    endTime: data.endTime,
    breakDuration: data.breakDuration,
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
      startTime: data.startTime,
      endTime: data.endTime,
      breakDuration: data.breakDuration,
      inchargeName: data.inchargeName ?? '',
      remarks: data.remarks ?? '',
    });
  }, [data.startTime, data.endTime, data.breakDuration, data.inchargeName, data.remarks]);

  useEffect(() => {
    setHoursModalOpen(searchParams.get('edit') === 'hours');
  }, [searchParams]);

  const submit = useMutation({ mutationFn: () => timesheetApi.submit(id),     onSuccess: () => { toast.success('Timesheet submitted successfully.'); qc.invalidateQueries(); } });
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
  const saveCorrection = useMutation({
    mutationFn: async () => {
      try {
        calculateShiftDuration(edit.startTime, edit.endTime, Number(edit.breakDuration || 0));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'A shift must be less than 24 hours in a day.';
        toast.error(message);
        throw error;
      }
      await timesheetApi.update(id, edit);
      await timesheetApi.submit(id);
    },
    onSuccess: () => {
      toast.success('Timesheet submitted successfully.');
      qc.invalidateQueries();
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

  const isOwn = Boolean(user?.id && data.userId && String(user.id) === String(data.userId));
  const ownerCanEdit = (user?.role === 'STAFF' || (user?.role === 'ADMIN' && isOwn)) && ['DRAFT', 'ADMIN_REJECTED', 'SUPER_ADMIN_REJECTED'].includes(data.status);
  const isStaffSheet = data.ownerRole !== 'ADMIN';
  const managerCanEditHours = Boolean(
    isStaffSheet
    && user
    && (user.role === 'SUPER_ADMIN' || (user.role === 'ADMIN' && !isOwn)),
  );
  const adminCanReview = user?.role === 'ADMIN' && !isOwn && data.ownerRole !== 'ADMIN' && ['SUBMITTED', 'ADMIN_REVIEW', 'RESUBMITTED'].includes(data.status);
  const superCanApprove = user?.role === 'SUPER_ADMIN' && (
    ['SUPER_ADMIN_REVIEW', 'ADMIN_VERIFIED'].includes(data.status)
    || (data.ownerRole === 'ADMIN' && ['SUBMITTED', 'ADMIN_REVIEW', 'RESUBMITTED'].includes(data.status))
  );

  let previewHours = '—';
  try {
    previewHours = calculateShiftDuration(hoursEdit.startTime, hoursEdit.endTime, Number(hoursEdit.breakDuration || 0)).formattedHours;
  } catch {
    previewHours = 'Invalid';
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

  async function downloadPdf() {
    const res = await fetch(`/api/timesheets/${id}/pdf`, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.timesheetId}.pdf`;
    a.click();
  }

  return (
    <div className="space-y-5">
      <TimesheetPreview item={data} />
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant="secondary" onClick={() => window.print()}>Print</Button>
        <Button variant="secondary" onClick={downloadPdf}>Download PDF</Button>
        {managerCanEditHours && (
          <Button variant="accent" onClick={openHoursModal}>Edit hours & break</Button>
        )}
        {ownerCanEdit && data.status === 'DRAFT' && (
          <Button variant="accent" loading={submit.isPending} onClick={() => submit.mutate()}>Submit</Button>
        )}
      </div>
      {ownerCanEdit && (
        <div className="card space-y-4 p-5">
          <h3 className="text-lg font-semibold">Correct timesheet</h3>
          {data.rejectionReason && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">Rejection reason: {data.rejectionReason}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start" type="time" value={edit.startTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdit((v) => ({ ...v, startTime: e.target.value }))} />
            <Input label="End" type="time" value={edit.endTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdit((v) => ({ ...v, endTime: e.target.value }))} />
          </div>
          <Input label="Break (minutes)" type="number" value={edit.breakDuration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdit((v) => ({ ...v, breakDuration: Number(e.target.value) }))} />
          {data.ownerRole === 'ADMIN' ? (
            <Input label="Incharge / supervisor" value={edit.inchargeName || 'Super Admin'} readOnly />
          ) : (
            <InchargeSelect value={edit.inchargeName} onChange={(e) => setEdit((v) => ({ ...v, inchargeName: e.target.value }))} />
          )}
          <Input label="Remarks" value={edit.remarks} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdit((v) => ({ ...v, remarks: e.target.value }))} />
          <Button variant="accent" className="w-full" loading={saveCorrection.isPending} onClick={() => saveCorrection.mutate()}>Resubmit timesheet</Button>
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
            <Input label="Start" type="time" value={hoursEdit.startTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoursEdit((v) => ({ ...v, startTime: e.target.value }))} />
            <Input label="End" type="time" value={hoursEdit.endTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoursEdit((v) => ({ ...v, endTime: e.target.value }))} />
          </div>
          <Input label="Break (minutes)" type="number" value={hoursEdit.breakDuration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoursEdit((v) => ({ ...v, breakDuration: Number(e.target.value) }))} />
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
    </div>
  );
}
