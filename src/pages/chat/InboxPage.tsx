import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck, Megaphone, Plus, Search, Send, Smile, Users } from 'lucide-react';
import { toast } from 'sonner';
import { chatApi } from '../../api/services';
import { useAuth } from '../../store/auth';
import { useChatLive } from '../../chat/ChatLiveProvider';
import { CHAT_STICKERS } from '../../chat/stickers';
import { Button, Input, Modal } from '../../components/ui';
import { roleLabel } from '../../utils/chatLinks';
import { cn, formatDateTime } from '../../utils';
import type { ChatConversation, ChatMessage, ChatPerson } from '../../types';

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function Ticks({ status }: { status: ChatMessage['ticks'] }) {
  const color = status === 'read' ? 'text-sky-500' : 'text-slate-500';
  if (status === 'sent') return <Check className={cn('h-3.5 w-3.5', color)} />;
  return <CheckCheck className={cn('h-3.5 w-3.5', color)} />;
}

export function InboxPage({ basePath }: { basePath: string }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { setActiveId } = useChatLive();
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const canBroadcast = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const inbox = useQuery({ queryKey: ['chat', 'conversations'], queryFn: chatApi.conversations });
  const directory = useQuery({ queryKey: ['chat', 'directory'], queryFn: chatApi.directory, enabled: newOpen || broadcastOpen });

  useEffect(() => {
    setActiveId(id ?? null);
    return () => setActiveId(null);
  }, [id, setActiveId]);

  const items = (inbox.data?.items ?? []).filter((item) => {
    const hay = `${item.title} ${item.other?.name ?? ''} ${item.lastMessageText ?? ''}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-[#efeae2] dark:bg-slate-900">
      <aside className={cn('flex w-full flex-col bg-white dark:bg-slate-950 md:w-80 md:border-r md:border-slate-200 dark:md:border-slate-800', id && 'hidden md:flex')}>
        <div className="border-b border-slate-100 p-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold">Inbox</h1>
            <div className="flex gap-1">
              <button type="button" className="rounded-xl p-2 text-brand-600 hover:bg-brand-50" aria-label="New chat" onClick={() => setNewOpen(true)}>
                <Plus className="h-5 w-5" />
              </button>
              {canBroadcast && (
                <button type="button" className="rounded-xl p-2 text-brand-600 hover:bg-brand-50" aria-label="Broadcast" onClick={() => setBroadcastOpen(true)}>
                  <Megaphone className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats" className="min-h-11 w-full rounded-2xl bg-slate-100 pl-9 pr-3 text-sm outline-none dark:bg-slate-900" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!items.length && <p className="px-4 py-10 text-center text-sm text-slate-500">No chats yet. Start a conversation.</p>}
          {items.map((item) => (
            <Link
              key={item._id}
              to={`${basePath}/${item._id}`}
              className={cn('flex gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900', id === item._id && 'bg-brand-50 dark:bg-brand-950/40')}
            >
              <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white', item.type === 'BROADCAST' ? 'bg-amber-500' : 'bg-brand-600')}>
                {item.type === 'BROADCAST' ? <Megaphone className="h-5 w-5" /> : initials(item.other?.name || item.title)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{item.title}</p>
                  {item.lastMessageAt && <span className="shrink-0 text-[11px] text-slate-400">{formatDateTime(item.lastMessageAt).split(',')[0]}</span>}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-slate-500">{item.lastMessageText || (item.type === 'BROADCAST' ? 'Announcement' : 'Tap to chat')}</p>
                  {item.unread > 0 && <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">{item.unread}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </aside>
      <section className={cn('min-w-0 flex-1 flex-col', id ? 'flex' : 'hidden md:flex')}>
        {id ? (
          <ChatThread id={id} basePath={basePath} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-slate-500">
            <Users className="mb-3 h-12 w-12 text-brand-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">Select a chat</p>
            <p className="mt-1 max-w-sm text-sm">Message staff, admins, or Super Admin. Announcements appear here too.</p>
          </div>
        )}
      </section>
      <NewChatModal
        open={newOpen}
        people={directory.data?.items ?? []}
        onClose={() => setNewOpen(false)}
        onPick={async (person) => {
          const conversation = await chatApi.openDirect(person.id);
          await qc.invalidateQueries({ queryKey: ['chat'] });
          setNewOpen(false);
          navigate(`${basePath}/${conversation._id}`);
        }}
      />
      {canBroadcast && (
        <BroadcastModal
          open={broadcastOpen}
          people={(directory.data?.items ?? []).filter((person) => (user?.role === 'ADMIN' ? person.role === 'STAFF' : person.role === 'STAFF' || person.role === 'ADMIN'))}
          isSuper={user?.role === 'SUPER_ADMIN'}
          onClose={() => setBroadcastOpen(false)}
          onSent={(conversation, individual) => {
            qc.invalidateQueries({ queryKey: ['chat'] });
            setBroadcastOpen(false);
            if (!individual) navigate(`${basePath}/${conversation._id}`);
          }}
        />
      )}
    </div>
  );
}

function ChatThread({ id, basePath }: { id: string; basePath: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [stickersOpen, setStickersOpen] = useState(false);
  const thread = useQuery({ queryKey: ['chat', 'messages', id], queryFn: () => chatApi.messages(id) });

  useEffect(() => {
    if (!id) return;
    chatApi.read(id).then(() => qc.invalidateQueries({ queryKey: ['chat'] }));
  }, [id, thread.data?.items.length, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.data?.items.length]);

  const send = useMutation({
    mutationFn: (payload: { body?: string; sticker?: string }) => chatApi.send(id, payload),
    onSuccess: () => {
      setText('');
      setStickersOpen(false);
      qc.invalidateQueries({ queryKey: ['chat'] });
    },
  });

  const conversation = thread.data?.conversation;
  const title = conversation?.title ?? 'Chat';
  const subtitle = conversation?.type === 'BROADCAST'
    ? `${conversation.memberCount} people`
    : roleLabel(conversation?.other?.role);

  return (
    <>
      <header className="flex items-center gap-3 bg-brand-600 px-3 py-3 text-white">
        <Link to={basePath} className="rounded-xl px-2 py-1 text-sm font-semibold md:hidden">Back</Link>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold', conversation?.type === 'BROADCAST' ? 'bg-amber-400 text-white' : 'bg-white/20')}>
          {conversation?.type === 'BROADCAST' ? <Megaphone className="h-5 w-5" /> : initials(conversation?.other?.name || title)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{title}</p>
          <p className="truncate text-xs text-white/75">{subtitle}</p>
        </div>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {(thread.data?.items ?? []).map((item) => (
          <MessageBubble key={item._id} item={item} mine={item.senderId === user?.id} showName={conversation?.type === 'BROADCAST'} />
        ))}
        <div ref={bottomRef} />
      </div>
      {stickersOpen && (
        <div className="grid grid-cols-8 gap-1 border-t border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
          {CHAT_STICKERS.map((sticker) => (
            <button key={sticker} type="button" className="rounded-xl p-1 text-2xl hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => send.mutate({ sticker })}>
              {sticker}
            </button>
          ))}
        </div>
      )}
      <form
        className="flex items-end gap-2 bg-[#f0f2f5] p-2 dark:bg-slate-900"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          send.mutate({ body: text.trim() });
        }}
      >
        <button type="button" className="rounded-full p-2 text-slate-500 hover:bg-white" aria-label="Stickers" onClick={() => setStickersOpen((open) => !open)}>
          <Smile className="h-6 w-6" />
        </button>
        <textarea
          value={text}
          rows={1}
          placeholder="Type a message"
          className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl bg-white px-3 py-2.5 text-sm outline-none dark:bg-slate-950"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) send.mutate({ body: text.trim() });
            }
          }}
        />
        <button type="submit" disabled={send.isPending || !text.trim()} className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white disabled:opacity-40" aria-label="Send">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </>
  );
}

function MessageBubble({ item, mine, showName }: { item: ChatMessage; mine: boolean; showName: boolean }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 shadow-sm', mine ? 'rounded-br-md bg-[#dcf8c6] text-slate-900' : 'rounded-bl-md bg-white dark:bg-slate-800 dark:text-white')}>
        {showName && !mine && <p className="mb-0.5 text-[11px] font-semibold text-brand-600">{item.senderName}</p>}
        {item.sticker && <p className="text-4xl leading-none">{item.sticker}</p>}
        {item.body && <p className="whitespace-pre-wrap text-sm">{item.body}</p>}
        <div className="mt-1 flex items-center justify-end gap-1">
          <span className={cn('text-[10px]', mine ? 'text-slate-500' : 'text-slate-400')}>
            {new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {mine && <Ticks status={item.ticks} />}
        </div>
      </div>
    </div>
  );
}

function NewChatModal({
  open,
  people,
  onClose,
  onPick,
}: {
  open: boolean;
  people: ChatPerson[];
  onClose: () => void;
  onPick: (person: ChatPerson) => Promise<void>;
}) {
  const [q, setQ] = useState('');
  const filtered = people.filter((person) => `${person.name} ${person.role} ${person.employeeId ?? ''} ${person.adminId ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  const groups = [
    { label: 'Staff', items: filtered.filter((person) => person.role === 'STAFF') },
    { label: 'Admins', items: filtered.filter((person) => person.role === 'ADMIN') },
    { label: 'Super Admin', items: filtered.filter((person) => person.role === 'SUPER_ADMIN') },
  ].filter((group) => group.items.length);
  return (
    <Modal open={open} title="New chat" onClose={onClose}>
      <Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or role" />
      <div className="mt-3 max-h-72 space-y-3 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group.label}</p>
            {group.items.map((person) => (
              <button key={person.id} type="button" className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => void onPick(person)}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{initials(person.name)}</span>
                <span>
                  <span className="block font-semibold">{person.name}</span>
                  <span className="text-xs text-slate-500">{roleLabel(person.role)}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
        {!filtered.length && <p className="py-6 text-center text-sm text-slate-500">No people found.</p>}
      </div>
    </Modal>
  );
}

function BroadcastModal({
  open,
  people,
  isSuper,
  onClose,
  onSent,
}: {
  open: boolean;
  people: ChatPerson[];
  isSuper: boolean;
  onClose: () => void;
  onSent: (conversation: ChatConversation, individual?: boolean) => void;
}) {
  const [title, setTitle] = useState('Announcement');
  const [body, setBody] = useState('');
  const [sticker, setSticker] = useState('');
  const [mode, setMode] = useState<'STAFF' | 'ADMIN' | 'ALL' | 'CUSTOM'>('STAFF');
  const [delivery, setDelivery] = useState<'GROUP' | 'INDIVIDUAL'>('GROUP');
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  const filtered = people.filter((person) => person.name.toLowerCase().includes(q.toLowerCase()));

  async function send() {
    if (!body.trim() && !sticker) {
      toast.error('Enter a message or choose a sticker.');
      return;
    }
    if (mode === 'CUSTOM' && !selected.length) {
      toast.error('Select at least one person.');
      return;
    }
    setSaving(true);
    try {
      const result = await chatApi.broadcast({
        title,
        body: body.trim() || undefined,
        sticker: sticker || undefined,
        audience: mode,
        delivery,
        recipientIds: mode === 'CUSTOM' ? selected : undefined,
      });
      toast.success(delivery === 'INDIVIDUAL' ? `Sent to ${result.count ?? selected.length} people.` : 'Announcement sent.');
      setBody('');
      setSticker('');
      setSelected([]);
      if (result.conversation) onSent(result.conversation, delivery === 'INDIVIDUAL');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Send announcement" onClose={onClose}>
      <div className="space-y-3">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Message" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex flex-wrap gap-1">
          {CHAT_STICKERS.slice(0, 12).map((item) => (
            <button key={item} type="button" className={cn('rounded-xl p-1 text-xl', sticker === item && 'bg-brand-50 ring-1 ring-brand-600')} onClick={() => setSticker((cur) => (cur === item ? '' : item))}>
              {item}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={mode === 'STAFF' ? 'accent' : 'secondary'} onClick={() => setMode('STAFF')}>All staff</Button>
          {isSuper && <Button type="button" variant={mode === 'ADMIN' ? 'accent' : 'secondary'} onClick={() => setMode('ADMIN')}>All admins</Button>}
          {isSuper && <Button type="button" variant={mode === 'ALL' ? 'accent' : 'secondary'} onClick={() => setMode('ALL')}>Staff & admins</Button>}
          <Button type="button" variant={mode === 'CUSTOM' ? 'accent' : 'secondary'} onClick={() => setMode('CUSTOM')}>Select people</Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={delivery === 'GROUP' ? 'accent' : 'secondary'} onClick={() => setDelivery('GROUP')}>One group</Button>
          <Button type="button" variant={delivery === 'INDIVIDUAL' ? 'accent' : 'secondary'} onClick={() => setDelivery('INDIVIDUAL')}>One by one</Button>
        </div>
        <p className="text-xs text-slate-500">
          {delivery === 'GROUP' ? 'Everyone shares one announcement thread.' : 'Each person gets a separate personal chat with this message.'}
        </p>
        {mode === 'CUSTOM' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Input label="Search people" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button type="button" className="mb-2 text-sm font-semibold text-brand-600" onClick={() => setSelected(filtered.map((person) => person.id))}>
              Select all listed
            </button>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filtered.map((person) => (
                <label key={person.id} className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={selected.includes(person.id)}
                    onChange={(e) => setSelected((cur) => (e.target.checked ? [...cur, person.id] : cur.filter((id) => id !== person.id)))}
                  />
                  <span className="text-sm font-medium">{person.name}</span>
                  <span className="text-xs text-slate-400">{roleLabel(person.role)}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <Button className="w-full" variant="accent" loading={saving} onClick={send}>Send announcement</Button>
      </div>
    </Modal>
  );
}
