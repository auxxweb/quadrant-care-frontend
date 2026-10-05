import { useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '../../api/services';
import { useAuth } from '../../store/auth';
import { fileUrl } from '../../utils';
import { SignaturePad } from '../timesheet/SignaturePad';
import { Button, Card } from '../ui';

export function SavedSignatureForm() {
  const { user, refreshMe } = useAuth();
  const [drawing, setDrawing] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!drawing) {
      toast.error('Draw your signature first.');
      return;
    }
    setSaving(true);
    try {
      await authApi.updateMe({ signature: drawing });
      await refreshMe();
      setDrawing('');
      toast.success('Signature saved. It will be used when you approve timesheets.');
    } finally {
      setSaving(false);
    }
  }

  async function clearSaved() {
    setSaving(true);
    try {
      await authApi.updateMe({ clearSignature: true });
      await refreshMe();
      toast.success('Saved signature removed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-semibold">Approval signature</h3>
        <p className="mt-1 text-sm text-slate-500">
          Save your signature here. On timesheet verification you can apply it instead of drawing each time.
        </p>
      </div>
      {user?.signaturePath && (
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved signature</p>
          <img src={fileUrl(user.signaturePath)} alt="Saved signature" className="mt-2 h-16 max-w-full object-contain" />
          <Button type="button" variant="ghost" className="mt-3 text-red-600" loading={saving} onClick={clearSaved}>
            Remove saved signature
          </Button>
        </div>
      )}
      <SignaturePad value={drawing} onChange={setDrawing} />
      <Button type="button" variant="accent" className="w-full" loading={saving} onClick={save}>
        {user?.signaturePath ? 'Replace saved signature' : 'Save signature'}
      </Button>
    </Card>
  );
}
