import { useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '../../api/services';
import { useAuth } from '../../store/auth';
import { Button, Card, Input } from '../ui';

export function ChangeCredentialsForm({ title = 'Password & passcode' }: { title?: string }) {
  const { user, refreshMe } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [currentPasscode, setCurrentPasscode] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [savingPasscode, setSavingPasscode] = useState(false);

  const hasPasscode = Boolean(user?.hasPasscode);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.updateMe({ currentPassword, password });
      toast.success('Password updated');
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      await refreshMe();
    } finally {
      setSavingPassword(false);
    }
  }

  async function savePasscode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(passcode)) {
      toast.error('Passcode must be 5 digits.');
      return;
    }
    if (passcode !== confirmPasscode) {
      toast.error('New passcodes do not match.');
      return;
    }
    setSavingPasscode(true);
    try {
      await authApi.updateMe({
        passcode,
        currentPasscode: hasPasscode ? currentPasscode : undefined,
      });
      toast.success(hasPasscode ? 'Passcode updated' : 'Passcode created');
      setCurrentPasscode('');
      setPasscode('');
      setConfirmPasscode('');
      await refreshMe();
    } finally {
      setSavingPasscode(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <form className="space-y-3" onSubmit={savePassword}>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-slate-500">Change the password you use to sign in.</p>
          <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <Button type="submit" variant="accent" className="w-full" loading={savingPassword}>Update password</Button>
        </form>
      </Card>
      <Card>
        <form className="space-y-3" onSubmit={savePasscode}>
          <h3 className="font-semibold">{hasPasscode ? 'Change passcode' : 'Create passcode'}</h3>
          <p className="text-sm text-slate-500">
            {hasPasscode ? 'Replace your 5-digit passcode.' : 'Create a 5-digit passcode for faster sign-in.'}
          </p>
          {hasPasscode && (
            <Input label="Current passcode" inputMode="numeric" maxLength={5} value={currentPasscode} onChange={(e) => setCurrentPasscode(e.target.value.replace(/\D/g, '').slice(0, 5))} required />
          )}
          <Input label="New 5-digit passcode" inputMode="numeric" maxLength={5} value={passcode} onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 5))} required />
          <Input label="Confirm passcode" inputMode="numeric" maxLength={5} value={confirmPasscode} onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, '').slice(0, 5))} required />
          <Button type="submit" variant="accent" className="w-full" loading={savingPasscode}>
            {hasPasscode ? 'Update passcode' : 'Create passcode'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
