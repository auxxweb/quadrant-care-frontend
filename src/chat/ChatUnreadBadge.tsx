import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../api/services';
import { useAuth } from '../store/auth';
import { cn } from '../utils';

export function ChatUnreadBadge({ className }: { className?: string }) {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['chat', 'unread'],
    queryFn: chatApi.unread,
    refetchInterval: 20000,
    enabled: Boolean(user),
  });
  if (!data?.unread) return null;
  return (
    <span className={cn('rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white', className)}>
      {data.unread > 99 ? '99+' : data.unread}
    </span>
  );
}
