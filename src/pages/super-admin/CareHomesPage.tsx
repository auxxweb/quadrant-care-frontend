import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { careHomeApi } from '../../api/services';
import { Button, Card, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Skeleton } from '../../components/ui';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { ListFilters } from '../../components/filters/ListFilters';
import { useListFilters } from '../../hooks/useListFilters';
import { cn } from '../../utils';
import type { CareHome } from '../../types';

type CareHomeFormValues = {
  name: string;
  address: string;
  city: string;
  postcode: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  notes: string;
};

const emptyForm: CareHomeFormValues = {
  name: '',
  address: '',
  city: '',
  postcode: '',
  contactPerson: '',
  contactNumber: '',
  email: '',
  notes: '',
};

function toForm(home?: CareHome | null): CareHomeFormValues {
  if (!home) return emptyForm;
  return {
    name: home.name ?? '',
    address: home.address ?? '',
    city: home.city ?? '',
    postcode: home.postcode ?? '',
    contactPerson: home.contactPerson ?? '',
    contactNumber: home.contactNumber ?? '',
    email: home.email ?? '',
    notes: home.notes ?? '',
  };
}

function toPayload(values: CareHomeFormValues) {
  return {
    ...values,
    email: values.email.trim() || undefined,
    contactPerson: values.contactPerson.trim() || undefined,
    contactNumber: values.contactNumber.trim() || undefined,
    notes: values.notes.trim() || undefined,
  };
}

export function CareHomesPage() {
  const qc = useQueryClient();
  const { search, range, from, to, dates, update } = useListFilters();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CareHome | null>(null);
  const [viewing, setViewing] = useState<CareHome | null>(null);
  const [deleting, setDeleting] = useState<CareHome | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['care-homes', 'manage', search, dates.from, dates.to],
    queryFn: () => careHomeApi.list({ search: search || undefined, from: dates.from, to: dates.to }),
  });

  const form = useForm<CareHomeFormValues>({ defaultValues: emptyForm });
  const errors = form.formState.errors;

  const save = useMutation({
    mutationFn: (values: CareHomeFormValues) =>
      editing ? careHomeApi.update(editing._id, toPayload(values)) : careHomeApi.create(toPayload(values)),
    onSuccess: () => {
      toast.success(editing ? 'Care home updated' : 'Care home created');
      form.reset(emptyForm);
      setEditing(null);
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ['care-homes'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => careHomeApi.remove(id),
    onSuccess: () => {
      toast.success('Care home deleted');
      setDeleting(null);
      void qc.invalidateQueries({ queryKey: ['care-homes'] });
    },
  });

  const items = data?.items ?? [];
  const filtered = items;

  function startCreate() {
    setEditing(null);
    form.reset(emptyForm);
    setFormOpen(true);
  }

  function startEdit(home: CareHome) {
    setEditing(home);
    form.reset(toForm(home));
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setFormOpen(false);
    form.reset(emptyForm);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Care Homes"
        subtitle="Create and manage the homes staff are assigned to"
        actions={<Button variant="accent" onClick={startCreate}>Add care home</Button>}
      />

      <Modal open={formOpen} title={editing ? `Edit ${editing.name}` : 'Add care home'} onClose={closeForm}>
        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
          <Input label="Name" error={errors.name?.message} {...form.register('name', { required: 'Care home name is required', minLength: { value: 2, message: 'Enter at least 2 characters' } })} />
          <Input label="City" error={errors.city?.message} {...form.register('city', { required: 'City is required', minLength: { value: 2, message: 'Enter at least 2 characters' } })} />
          <Input label="Address" error={errors.address?.message} {...form.register('address', { required: 'Address is required', minLength: { value: 2, message: 'Enter at least 2 characters' } })} />
          <Input label="Postcode" error={errors.postcode?.message} {...form.register('postcode', { required: 'Postcode is required', minLength: { value: 3, message: 'Enter a valid postcode' } })} />
          <Input label="Contact person" {...form.register('contactPerson')} />
          <Input label="Contact number" {...form.register('contactNumber')} />
          <Input label="Email" type="email" error={errors.email?.message} {...form.register('email')} />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notes</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-brand-600 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              {...form.register('notes')}
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" variant="accent" className="flex-1" loading={save.isPending} disabled={save.isPending}>
              {editing ? 'Save changes' : 'Create care home'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <div>
        <h2 className="text-lg font-semibold">All care homes</h2>
        <p className="mb-3 text-sm text-slate-500">{items.length} shown</p>
        <ListFilters
          search={search}
          onSearch={(value) => update({ q: value })}
          range={range}
          onRange={(value) => update({ range: value === 'all' ? undefined : value, from: undefined, to: undefined })}
          from={from}
          to={to}
          onCustomDates={(nextFrom, nextTo) => update({ range: 'custom', from: nextFrom, to: nextTo })}
          searchPlaceholder="Search by name, city or postcode"
        />
      </div>

      {isLoading && (
        <div className="grid gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      {!isLoading && !items.length && (
        <EmptyState title="No care homes yet" description="Create your first care home to assign staff and capture timesheets." />
      )}

      {!isLoading && items.length > 0 && !filtered.length && (
        <EmptyState title="No matches" description="Try a different name, city or postcode." />
      )}

      <div className="grid gap-3 md:hidden">
        {filtered.map((item) => (
          <Card key={item._id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-slate-500">{item.address}</p>
                <p className="text-sm text-slate-500">{item.city} · {item.postcode}</p>
              </div>
              <StatusPill status={item.status} />
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <ActionButtons
                actions={[
                  { label: 'View', onClick: () => setViewing(item), tone: 'view' },
                  { label: 'Edit', onClick: () => startEdit(item), tone: 'edit' },
                  { label: 'Delete', onClick: () => setDeleting(item), tone: 'danger' },
                ]}
              />
            </div>
          </Card>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="card hidden overflow-x-auto p-0 md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
              <tr>
                {['Name', 'Location', 'Contact', 'Status', ''].map((heading) => (
                  <th key={heading || 'actions'} className="px-4 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">
                    <p>{item.city} · {item.postcode}</p>
                    <p className="text-xs text-slate-500">{item.address}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{item.contactPerson || '—'}</p>
                    <p className="text-xs text-slate-500">{item.contactNumber || item.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={item.status} /></td>
                  <td className="px-4 py-3">
                    <ActionButtons
                      actions={[
                        { label: 'View', onClick: () => setViewing(item), tone: 'view' },
                        { label: 'Edit', onClick: () => startEdit(item), tone: 'edit' },
                        { label: 'Delete', onClick: () => setDeleting(item), tone: 'danger' },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(viewing)} title={viewing?.name ?? 'Care home'} onClose={() => setViewing(null)}>
        {viewing && (
          <dl className="grid gap-3 text-sm">
            <Detail label="Address" value={viewing.address} />
            <Detail label="City" value={viewing.city} />
            <Detail label="Postcode" value={viewing.postcode} />
            <Detail label="Contact person" value={viewing.contactPerson} />
            <Detail label="Contact number" value={viewing.contactNumber} />
            <Detail label="Email" value={viewing.email} />
            <Detail label="Notes" value={viewing.notes} />
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="mt-1"><StatusPill status={viewing.status} /></dd>
            </div>
            <div className="mt-2 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setViewing(null); startEdit(viewing); }}>Edit</Button>
              <Button variant="danger" className="flex-1" onClick={() => { setViewing(null); setDeleting(viewing); }}>Delete</Button>
            </div>
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete care home"
        description={`Delete ${deleting?.name ?? 'this care home'}? This cannot be undone. Homes with assigned employees cannot be deleted.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting._id)}
      />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium">{value?.trim() || '—'}</dd>
    </div>
  );
}
