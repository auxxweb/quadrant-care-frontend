import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/services';
import { useAuth } from '../../store/auth';
import { formatDateTime } from '../../utils';
import { cn } from '../../utils';
import type { NotificationItem } from '../../types';
import { inboxPath } from '../../utils/chatLinks';
import { timesheetDetailPath } from '../../utils/timesheetLinks';

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
    refetchInterval: 15000,
  });
  const markRead = useMutation({
    mutationFn: notificationApi.read,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readAll = useMutation({
    mutationFn: notificationApi.readAll,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.items ?? [];

  function openItem(item: NotificationItem) {
    if (!item.read) markRead.mutate(item._id);
    const href = item.type === 'CHAT_MESSAGE' || item.entityType === 'Conversation'
      ? inboxPath(user?.role, item.entityId)
      : item.entityId
        ? timesheetDetailPath(user?.role, item.entityId)
        : null;
    onClose();
    if (href) navigate(href);
  }

  return (
    <div className="fixed inset-x-3 top-[4.25rem] z-40 overflow-hidden rounded-2xl bg-white shadow-auth ring-1 ring-slate-200 md:absolute md:inset-x-auto md:right-0 md:top-12 md:w-[min(24rem,calc(100vw-2rem))] dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div>
          <p className="font-semibold">Notifications</p>
          <p className="text-xs text-slate-500">{data?.unread ?? 0} unread</p>
        </div>
        {Boolean(data?.unread) && (
          <button type="button" className="text-xs font-semibold text-brand-600" onClick={() => readAll.mutate()}>
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {!items.length && <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>}
        {items.map((item) => (
          <button
            key={item._id}
            type="button"
            className={cn('block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800', !item.read && 'bg-brand-50/70 dark:bg-brand-950/40')}
            onClick={() => openItem(item)}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{item.title}</p>
              {!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
            </div>
            <p className="mt-1 text-sm text-slate-500">{item.description}</p>
            <p className="mt-1 text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
