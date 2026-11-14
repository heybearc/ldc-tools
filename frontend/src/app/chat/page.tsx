'use client';

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { userError } from '@/lib/user-error';

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

function initials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() || '').join('');
  return letters || '•';
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function publishUnread(channels: Channel[]) {
  const total = channels.reduce((sum, channel) => sum + channel.unread, 0);
  window.dispatchEvent(new CustomEvent('ldc-chat-unread', { detail: total }));
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
  const [personQuery, setPersonQuery] = useState('');
  const [listQuery, setListQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const peopleBox = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const newest = useRef<string | null>(null);
  const messageRequest = useRef(0);
  const holdUnread = useRef<string | null>(null);
  const readGeneration = useRef(0);

  const loadChannels = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/chat', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not load chat'));
        return;
      }
      const nextChannels: Channel[] = body.channels || [];
      setChannels(nextChannels);
      publishUnread(nextChannels);
      setTeammates(body.teammates || []);
      setVapid(body.vapidPublicKey || null);
      const wide = window.matchMedia('(min-width: 1024px)').matches;
      setSelectedId((current) => current || (wide ? body.channels?.[0]?.id || null : null));
    } catch {
      setError(userError(0, '', 'Could not load chat'));
    }
  }, []);

  const loadMessages = useCallback(async (channelId: string, after?: string | null) => {
    const requestId = messageRequest.current;
    const query = after ? `?after=${encodeURIComponent(after)}` : '';
    let response: Response;
    try {
      response = await fetch(`/api/v1/chat/channels/${channelId}/messages${query}`, { cache: 'no-store' });
    } catch {
      if (requestId === messageRequest.current) setError(userError(0, '', 'Could not load messages'));
      return;
    }
    const body = await response.json().catch(() => ({}));
    if (requestId !== messageRequest.current) return;
    if (!response.ok) {
      setError(userError(response.status, body.error, 'Could not load messages'));
      return;
    }
    const incoming: Message[] = body.messages || [];
    setMessages((current) => {
      if (!after) return incoming;
      const seen = new Set(current.map((message) => message.id));
      return [...current, ...incoming.filter((message) => !seen.has(message.id))];
    });
    if (requestId !== messageRequest.current) return;
    if (incoming.length > 0) newest.current = incoming[incoming.length - 1].createdAt;
    if (holdUnread.current === channelId) return;
    const generation = readGeneration.current;
    const readResponse = await fetch(`/api/v1/chat/channels/${channelId}/read`, { method: 'POST' });
    if (holdUnread.current === channelId || generation !== readGeneration.current) {
      if (holdUnread.current === channelId) {
        await fetch(`/api/v1/chat/channels/${channelId}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unread: true }),
        });
      }
      return;
    }
    if (!readResponse.ok || requestId !== messageRequest.current) return;
    setChannels((current) => {
      const next = current.map((channel) => channel.id === channelId ? { ...channel, unread: 0 } : channel);
      publishUnread(next);
      return next;
    });
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    let cancelled = false;
    async function checkSubscription() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        const subscription = await registration?.pushManager.getSubscription();
        if (!cancelled && subscription) {
          setNotificationsOn(true);
          setNotice('Notifications are on for this browser.');
        }
      } catch {
        // Leave the button on "Turn on" when the browser cannot report a subscription.
      }
    }
    checkSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    messageRequest.current += 1;
    newest.current = null;
    setMessages([]);
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
        setError(userError(response.status, body.error, 'Could not send the message'));
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

  function openChannel(channelId: string) {
    if (holdUnread.current === channelId) holdUnread.current = null;
    setSelectedId(channelId);
  }

  async function setReadState(channelId: string, unread: boolean) {
    setError('');
    readGeneration.current += 1;
    const previousHold = holdUnread.current;
    holdUnread.current = unread ? channelId : (previousHold === channelId ? null : previousHold);
    try {
      const response = await fetch(`/api/v1/chat/channels/${channelId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unread }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        holdUnread.current = previousHold;
        setError(userError(response.status, body.error, 'Could not update the chat'));
        return;
      }
      if (unread && selectedId === channelId) setSelectedId(null);
      setChannels((current) => {
        const next = current.map((channel) => (
          channel.id === channelId ? { ...channel, unread: Number(body.unread) || 0 } : channel
        ));
        publishUnread(next);
        return next;
      });
    } catch {
      holdUnread.current = previousHold;
      setError(userError(0, '', 'Could not update the chat'));
    }
  }

  async function openDirect(userId: string) {
    setError('');
    const response = await fetch('/api/v1/chat/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(userError(response.status, body.error, 'Could not open the chat'));
      return;
    }
    setPersonQuery('');
    setNewChatOpen(false);
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
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) {
        setError('Notifications did not start. Refresh the page and try again.');
        return;
      }
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
        setError(userError(response.status, body.error, 'Could not turn on notifications'));
        return;
      }
      setNotificationsOn(true);
      setNotice('Notifications are on for this browser.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message.includes('Service Worker') || message.includes('push service')
        ? 'Notifications did not start. Refresh the page and try again.'
        : (message || userError(0, '', 'Could not turn on notifications')));
    }
  }

  async function disableNotifications() {
    setNotice('');
    setError('');
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      const endpoint = subscription?.endpoint || '';
      if (subscription) await subscription.unsubscribe();
      if (endpoint) {
        const response = await fetch('/api/v1/chat/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
        if (!response.ok) {
          const body = await response.json();
          setError(userError(response.status, body.error, 'Could not turn off notifications'));
          return;
        }
      }
      setNotificationsOn(false);
      setNotice('Notifications are off for this browser.');
    } catch (err) {
      setError(err instanceof Error ? err.message : userError(0, '', 'Could not turn off notifications'));
    }
  }

  useEffect(() => {
    if (!newChatOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setNewChatOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [newChatOpen]);

  const selected = channels.find((channel) => channel.id === selectedId) || null;
  const needle = personQuery.trim().toLowerCase();
  const shownTeammates = needle
    ? teammates.filter((person) => `${personName(person)} ${person.email}`.toLowerCase().includes(needle))
    : [];
  const listNeedle = listQuery.trim().toLowerCase();
  const visibleChannels = [...channels]
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'TEAM' ? -1 : 1;
      const at = a.latest?.createdAt || '';
      const bt = b.latest?.createdAt || '';
      return bt.localeCompare(at) || a.title.localeCompare(b.title);
    })
    .filter((channel) => (
      !listNeedle || `${channel.title} ${channel.latest?.body || ''}`.toLowerCase().includes(listNeedle)
    ));

  return (
    <div className="flex h-[calc(100dvh-9rem)] min-h-[32rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Chat</h1>
          <p className="truncate text-xs text-slate-500">Personnel team</p>
        </div>
        <button
          type="button"
          onClick={notificationsOn ? disableNotifications : enableNotifications}
          className="shrink-0 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px]"
        >
          {notificationsOn ? 'Turn off' : 'Turn on notifications'}
        </button>
      </header>
      {error && <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{notice}</p>}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${selectedId ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-slate-200 bg-slate-50 lg:border-r`}>
          <div ref={peopleBox} className="border-b border-slate-200 p-3">
            <div className="flex items-center gap-2">
              <input
                value={listQuery}
                onChange={(event) => setListQuery(event.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
                className="min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                aria-expanded={newChatOpen}
                onClick={() => {
                  setNewChatOpen((open) => !open);
                  setPersonQuery('');
                }}
                className="min-h-[44px] shrink-0 rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                New chat
              </button>
            </div>
            {newChatOpen && (
              <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <label className="block text-xs font-medium text-slate-600">
                  Search
                  <input
                    autoFocus
                    value={personQuery}
                    onChange={(event) => setPersonQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setNewChatOpen(false);
                      if (event.key === 'Enter' && shownTeammates.length === 1) {
                        event.preventDefault();
                        void openDirect(shownTeammates[0].id);
                      }
                    }}
                    placeholder="Name or email"
                    aria-label="Search people"
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 min-h-[44px]"
                  />
                </label>
                {needle && (
                  <ul className="max-h-48 overflow-y-auto rounded-md border border-slate-200">
                    {shownTeammates.map((person) => (
                      <li key={person.id}>
                        <button
                          type="button"
                          onClick={() => void openDirect(person.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 min-h-[44px]"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {initials(personName(person))}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{personName(person)}</span>
                            {person.name && <span className="block truncate text-xs text-slate-500">{person.email}</span>}
                          </span>
                        </button>
                      </li>
                    ))}
                    {shownTeammates.length === 0 && (
                      <li className="px-3 py-3 text-sm text-slate-500">No one matches.</li>
                    )}
                  </ul>
                )}
                <label className="block text-xs font-medium text-slate-600">
                  Or choose a person
                  <select
                    aria-label="Choose a person"
                    value=""
                    onChange={(event) => {
                      const userId = event.target.value;
                      if (userId) void openDirect(userId);
                    }}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
                  >
                    <option value="">Select a person</option>
                    {teammates.map((person) => (
                      <option key={person.id} value={person.id}>{personName(person)}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {visibleChannels.map((channel) => (
              <li key={channel.id} className="border-b border-slate-100">
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => openChannel(channel.id)}
                    className={`flex min-h-[64px] flex-1 items-center gap-3 px-3 py-2 text-left ${selectedId === channel.id ? 'bg-white' : 'hover:bg-white/70'}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${channel.kind === 'TEAM' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {channel.kind === 'TEAM' ? 'All' : initials(channel.title)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{channel.title}</span>
                        {channel.latest && (
                          <span className="shrink-0 text-[11px] text-slate-400">{formatWhen(channel.latest.createdAt)}</span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-slate-500">
                          {channel.latest?.body || (channel.kind === 'TEAM' ? 'Personnel team' : 'No messages yet')}
                        </span>
                        {channel.unread > 0 && (
                          <span className="inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                            {channel.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void setReadState(channel.id, channel.unread === 0)}
                    className="px-2 text-[11px] font-medium text-slate-500 hover:bg-white hover:text-slate-800"
                  >
                    {channel.unread > 0 ? 'Mark read' : 'Mark unread'}
                  </button>
                </div>
              </li>
            ))}
            {visibleChannels.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">
                {channels.length === 0 ? 'No conversations yet.' : 'No conversations match.'}
              </li>
            )}
          </ul>
        </aside>
        <section className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col bg-white`}>
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="min-h-[44px] text-sm font-medium text-blue-700 lg:hidden"
            >
              Chats
            </button>
            {selected && (
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${selected.kind === 'TEAM' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {selected.kind === 'TEAM' ? 'All' : initials(selected.title)}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">{selected?.title || 'Chat'}</span>
              <span className="block text-xs font-normal text-slate-500">
                {selected?.kind === 'TEAM' ? 'Personnel team' : selected ? 'Direct message' : 'Choose a conversation'}
              </span>
            </span>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
            {!selected && (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <p className="text-base font-semibold text-slate-800">Choose a conversation</p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Open a chat on the left, or start a new one with someone on the Personnel team.
                </p>
              </div>
            )}
            {selected && messages.length === 0 && (
              <p className="pt-8 text-center text-sm text-slate-400">No messages yet.</p>
            )}
            {messages.map((message) => (
              <article key={message.id} className={`flex max-w-[78%] flex-col ${message.mine ? 'ml-auto items-end' : 'items-start'}`}>
                {!message.mine && <p className="mb-1 px-1 text-xs font-medium text-slate-500">{personName(message.author)}</p>}
                <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${message.mine ? 'rounded-br-md bg-blue-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'}`}>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
                <time className="mt-1 px-1 text-[11px] text-slate-400" dateTime={message.createdAt}>{formatWhen(message.createdAt)}</time>
              </article>
            ))}
            <div ref={bottom} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selected ? `Message ${selected.title}` : 'Choose a chat'}
              disabled={!selectedId}
              className="min-h-[44px] flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !selectedId || !draft.trim()}
              className="min-h-[44px] rounded-full bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
