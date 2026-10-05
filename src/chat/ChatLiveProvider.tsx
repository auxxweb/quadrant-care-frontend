import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getAccessToken } from '../api/client';
import { chatApi } from '../api/services';
import { useAuth } from '../store/auth';
import { inboxPath } from '../utils/chatLinks';
import type { ChatConversation, ChatMessage } from '../types';

type LivePayload = { conversation: ChatConversation; message: ChatMessage };
type ConversationList = { items: ChatConversation[] };
type ThreadData = { conversation: ChatConversation; items: ChatMessage[] };

const ChatLiveContext = createContext<{ setActiveId: (id: string | null) => void }>({ setActiveId: () => undefined });

export function useChatLive() {
  return useContext(ChatLiveContext);
}

export function ChatLiveProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const activeId = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const userRef = useRef(user);
  const navigateRef = useRef(navigate);
  userRef.current = user;
  navigateRef.current = navigate;

  useEffect(() => {
    if (loading || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    const socket = io({
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('chat:message', (payload: LivePayload) => {
      qc.setQueryData<ConversationList>(['chat', 'conversations'], (current) => {
        if (!current) return current;
        const incoming = {
          ...payload.conversation,
          unread: activeId.current === payload.conversation._id || payload.message.senderId === userRef.current?.id
            ? 0
            : (current.items.find((item) => item._id === payload.conversation._id)?.unread ?? 0) + 1,
        };
        return { items: [incoming, ...current.items.filter((item) => item._id !== incoming._id)] };
      });
      qc.setQueryData<ThreadData>(['chat', 'messages', payload.conversation._id], (current) => {
        if (!current) return current;
        if (current.items.some((item) => item._id === payload.message._id)) return current;
        return { conversation: payload.conversation, items: [...current.items, payload.message] };
      });
      qc.invalidateQueries({ queryKey: ['chat', 'unread'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      const currentUser = userRef.current;
      if (!currentUser || payload.message.senderId === currentUser.id) return;
      if (activeId.current === payload.conversation._id) {
        void chatApi.read(payload.conversation._id).then(() => {
          qc.invalidateQueries({ queryKey: ['chat', 'unread'] });
        });
        return;
      }
      toast.message(payload.conversation.title, {
        description: payload.message.sticker || payload.message.body,
        action: {
          label: 'Open',
          onClick: () => navigateRef.current(inboxPath(currentUser.role, payload.conversation._id)),
        },
      });
    });
    socket.on('chat:read', () => {
      qc.invalidateQueries({ queryKey: ['chat'] });
    });
    socket.on('chat:delivered', () => {
      qc.invalidateQueries({ queryKey: ['chat'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, loading, qc]);

  const value = useMemo(
    () => ({
      setActiveId: (id: string | null) => {
        activeId.current = id;
      },
    }),
    [],
  );

  return <ChatLiveContext.Provider value={value}>{children}</ChatLiveContext.Provider>;
}
