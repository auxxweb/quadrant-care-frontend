import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { jobRoleApi } from '../../api/services';
import { Button, Card, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Skeleton } from '../../components/ui';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { ListFilters } from '../../components/filters/ListFilters';
import { useListFilters } from '../../hooks/useListFilters';
import { cn } from '../../utils';
import type { JobRole } from '../../types';

type JobRoleFormValues = {
  name: string;
  description: string;
};

const emptyForm: JobRoleFormValues = { name: '', description: '' };

function toForm(role?: JobRole | null): JobRoleFormValues {
  if (!role) return emptyForm;
  return { name: role.name ?? '', description: role.description ?? '' };
}

function toPayload(values: JobRoleFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
  };
}

export function JobRolesPage() {
  const qc = useQueryClient();
  const { search, range, from, to, dates, update } = useListFilters();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobRole | null>(null);
  const [viewing, setViewing] = useState<JobRole | null>(null);
  const [deleting, setDeleting] = useState<JobRole | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['job-roles', 'manage', search, dates.from, dates.to],
    queryFn: () => jobRoleApi.list({ search: search || undefined, from: dates.from, to: dates.to }),
  });

  const form = useForm<JobRoleFormValues>({ defaultValues: emptyForm });
  const errors = form.formState.errors;

  const save = useMutation({
    mutationFn: (values: JobRoleFormValues) =>
      editing ? jobRoleApi.update(editing._id, toPayload(values)) : jobRoleApi.create(toPayload(values)),
    onSuccess: () => {
      toast.success(editing ? 'Job role updated' : 'Job role created');
      form.reset(emptyForm);
      setEditing(null);
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ['job-roles'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => jobRoleApi.remove(id),
    onSuccess: () => {
      toast.success('Job role deleted');
      setDeleting(null);
      void qc.invalidateQueries({ queryKey: ['job-roles'] });
    },
  });

  const items = data?.items ?? [];
  const filtered = items;

  function startCreate() {
    setEditing(null);
    form.reset(emptyForm);
    setFormOpen(true);
  }

  function startEdit(role: JobRole) {
    setEditing(role);
    form.reset(toForm(role));
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
        title="Job Roles"
        subtitle="Create and manage the roles staff are assigned to"
        actions={<Button variant="accent" onClick={startCreate}>Add job role</Button>}
      />

      <Modal open={formOpen} title={editing ? `Edit ${editing.name}` : 'Add job role'} onClose={closeForm}>
        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
          <Input
            label="Role name"
            error={errors.name?.message}
            {...form.register('name', { required: 'Role name is required', minLength: { value: 2, message: 'Enter at least 2 characters' } })}
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-brand-600 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              placeholder="Optional — what this role covers"
              {...form.register('description')}
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" variant="accent" className="flex-1" loading={save.isPending} disabled={save.isPending}>
              {editing ? 'Save changes' : 'Create job role'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <div>
        <h2 className="text-lg font-semibold">All job roles</h2>
        <p className="mb-3 text-sm text-slate-500">{items.length} shown</p>
        <ListFilters
          search={search}
          onSearch={(value) => update({ q: value })}
          range={range}
          onRange={(value) => update({ range: value === 'all' ? undefined : value, from: undefined, to: undefined })}
          from={from}
          to={to}
          onCustomDates={(nextFrom, nextTo) => update({ range: 'custom', from: nextFrom, to: nextTo })}
          searchPlaceholder="Search roles"
        />
      </div>

      {isLoading && (
        <div className="grid gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {!isLoading && !items.length && (
        <EmptyState title="No job roles yet" description="Create your first job role so you can assign it to employees." />
      )}

      {!isLoading && items.length > 0 && !filtered.length && (
        <EmptyState title="No matches" description="Try a different role name or description." />
      )}

      <div className="grid gap-3 md:hidden">
        {filtered.map((item) => (
          <Card key={item._id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description || 'No description'}</p>
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
                {['Role', 'Description', 'Status', ''].map((heading) => (
                  <th key={heading || 'actions'} className="px-4 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.description || '—'}</td>
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

      <Modal open={Boolean(viewing)} title={viewing?.name ?? 'Job role'} onClose={() => setViewing(null)}>
        {viewing && (
          <dl className="grid gap-3 text-sm">
            <Detail label="Role name" value={viewing.name} />
            <Detail label="Description" value={viewing.description} />
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
        title="Delete job role"
        description={`Delete ${deleting?.name ?? 'this job role'}? This cannot be undone. Roles with assigned employees cannot be deleted.`}
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
