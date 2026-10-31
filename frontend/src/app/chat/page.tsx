'use client';

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Person {
  id: string;
  name: string | null;
  email: string;
}

interface Channel {
  id: string;
  kind: 'TEAM' | 'DIRECT';
  title: string;
  otherUserId: string | null;
  unread: number;
  latest: { body: string; createdAt: string; authorName: string } | null;
}

interface Message {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
  author: Person;
}

function personName(person: { name: string | null; email: string }) {
  return person.name || person.email;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading chat…</p>}>
      <ChatScreen />
    </Suspense>
  );
}

function ChatScreen() {
  const params = useSearchParams();
  const requested = params.get('channel');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [teammates, setTeammates] = useState<Person[]>([]);
  const [vapid, setVapid] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(requested);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [teammateId, setTeammateId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const newest = useRef<string | null>(null);

  const loadChannels = useCallback(async () => {
    const response = await fetch('/api/v1/chat', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || 'Failed to load chat');
      return;
    }
    setChannels(body.channels || []);
    setTeammates(body.teammates || []);
    setVapid(body.vapidPublicKey || null);
    setSelectedId((current) => current || body.channels?.[0]?.id || null);
  }, []);

  const loadMessages = useCallback(async (channelId: string, after?: string | null) => {
    const query = after ? `?after=${encodeURIComponent(after)}` : '';
    const response = await fetch(`/api/v1/chat/channels/${channelId}/messages${query}`, { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) return;
    const incoming: Message[] = body.messages || [];
    setMessages((current) => {
      if (!after) return incoming;
      const seen = new Set(current.map((message) => message.id));
      return [...current, ...incoming.filter((message) => !seen.has(message.id))];
    });
    if (incoming.length > 0) newest.current = incoming[incoming.length - 1].createdAt;
    await fetch(`/api/v1/chat/channels/${channelId}/read`, { method: 'POST' });
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (!selectedId) return;
    newest.current = null;
    loadMessages(selectedId);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadMessages(selectedId, newest.current);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/chat/channels/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to send');
        return;
      }
      setDraft('');
      setMessages((current) => current.some((message) => message.id === body.id) ? current : [...current, body]);
      newest.current = body.createdAt;
      loadChannels();
    } finally {
      setSending(false);
    }
  }

  async function openDirect() {
    if (!teammateId) return;
    setError('');
    const response = await fetch('/api/v1/chat/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: teammateId }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || 'Failed to open the chat');
      return;
    }
    setTeammateId('');
    await loadChannels();
    setSelectedId(body.id);
  }

  async function enableNotifications() {
    setNotice('');
    setError('');
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setError('This browser cannot show notifications.');
        return;
      }
      if (!vapid) {
        setError('Notifications are not ready yet.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Notification permission was not granted.');
        return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      });
      const json = subscription.toJSON();
      const response = await fetch('/api/v1/chat/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error || 'Failed to turn on notifications');
        return;
      }
      setNotice('Notifications are on for this browser.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to turn on notifications');
    }
  }

  const selected = channels.find((channel) => channel.id === selectedId) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chat</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            The team room is for everyone in this construction group. A direct message goes to one person. Turn on notifications to hear about new messages on this phone or computer.
          </p>
        </div>
        <button
          type="button"
          onClick={enableNotifications}
          className="px-4 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-800"
        >
          Turn on notifications
        </button>
      </div>
      {error && <p className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>}
      {notice && <p className="rounded-md bg-green-50 text-green-800 px-4 py-3 text-sm">{notice}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[60vh]">
        <aside className={`${selectedId ? 'hidden lg:block' : ''} bg-white rounded-lg shadow p-3 space-y-3`}>
          <div className="flex gap-2">
            <select
              value={teammateId}
              onChange={(event) => setTeammateId(event.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-2 py-2 bg-white text-sm min-h-[44px]"
              aria-label="Teammate"
            >
              <option value="">Message one person</option>
              {teammates.map((person) => (
                <option key={person.id} value={person.id}>{personName(person)}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={!teammateId}
              onClick={openDirect}
              className="px-3 min-h-[44px] rounded-md bg-gray-900 text-white text-sm disabled:opacity-60"
            >
              Open
            </button>
          </div>
          <ul className="space-y-1">
            {channels.map((channel) => (
              <li key={channel.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(channel.id)}
                  className={`w-full text-left rounded-md px-3 py-2 min-h-[44px] ${selectedId === channel.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">{channel.title}</span>
                    {channel.unread > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">{channel.unread}</span>
                    )}
                  </span>
                  {channel.latest && <span className="block text-xs text-gray-500 truncate">{channel.latest.body}</span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className={`${selectedId ? 'flex' : 'hidden lg:flex'} bg-white rounded-lg shadow flex-col min-h-[70vh]`}>
          <div className="border-b border-gray-100 px-4 py-3 font-semibold text-gray-900 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="lg:hidden min-h-[44px] text-sm font-medium text-blue-700"
            >
              Chats
            </button>
            <span className="min-w-0 truncate">{selected?.title || 'Chat'}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((message) => (
              <article key={message.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${message.mine ? 'ml-auto bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                {!message.mine && <p className="text-xs font-medium opacity-80">{personName(message.author)}</p>}
                <p className="whitespace-pre-wrap">{message.body}</p>
              </article>
            ))}
            <div ref={bottom} />
          </div>
          <form onSubmit={send} className="border-t border-gray-100 p-3 flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selected ? `Message ${selected.title}` : 'Choose a chat'}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 min-h-[44px]"
            />
            <button
              type="submit"
              disabled={sending || !selectedId || !draft.trim()}
              className="px-4 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
