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

  const selected = channels.find((channel) => channel.id === selectedId) || null;
  const needle = personQuery.trim().toLowerCase();
  const shownTeammates = needle
    ? teammates.filter((person) => `${personName(person)} ${person.email}`.toLowerCase().includes(needle))
    : teammates;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chat</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Team chat goes to everyone in this construction group. A direct message goes to one person. Turn on notifications to hear about new messages on this phone or computer.
          </p>
        </div>
        <button
          type="button"
          onClick={notificationsOn ? disableNotifications : enableNotifications}
          className="px-4 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-800"
        >
          {notificationsOn ? 'Turn off' : 'Turn on notifications'}
        </button>
      </div>
      {error && <p className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>}
      {notice && <p className="rounded-md bg-green-50 text-green-800 px-4 py-3 text-sm">{notice}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[60vh]">
        <aside className={`${selectedId ? 'hidden lg:block' : ''} bg-white rounded-lg shadow p-3 space-y-3`}>
          <ul className="space-y-1">
            {channels.map((channel) => (
              <li key={channel.id} className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => openChannel(channel.id)}
                  className={`flex-1 text-left rounded-md px-3 py-2 min-h-[44px] ${selectedId === channel.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">{channel.title}</span>
                    {channel.unread > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">{channel.unread}</span>
                    )}
                  </span>
                  {channel.latest && <span className="block text-xs text-gray-500 truncate">{channel.latest.body}</span>}
                  {channel.kind === 'TEAM' && (
                    <span className="block text-xs text-gray-500">Everyone in this group</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void setReadState(channel.id, channel.unread === 0)}
                  className="px-2 min-h-[44px] rounded-md text-xs font-semibold text-blue-800 hover:bg-gray-50"
                >
                  {channel.unread > 0 ? 'Mark read' : 'Mark unread'}
                </button>
              </li>
            ))}
          </ul>
          <div>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Message one person</span>
              <input
                value={personQuery}
                onChange={(event) => setPersonQuery(event.target.value)}
                placeholder="Find a person"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">
              {shownTeammates.length === teammates.length
                ? `${teammates.length} people`
                : `${shownTeammates.length} of ${teammates.length} people`}
            </p>
            <ul className="mt-2 rounded-md border border-gray-200 divide-y divide-gray-100">
              {shownTeammates.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => void openDirect(person.id)}
                    className="w-full text-left px-3 py-2 min-h-[44px] text-sm text-gray-900 hover:bg-gray-50"
                  >
                    {personName(person)}
                  </button>
                </li>
              ))}
              {shownTeammates.length === 0 && (
                <li className="px-3 py-3 text-sm text-gray-500">No one matches.</li>
              )}
            </ul>
          </div>
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
            <span className="min-w-0">
              <span className="block truncate">{selected?.title || 'Chat'}</span>
              {selected?.kind === 'TEAM' && (
                <span className="block text-xs font-normal text-gray-500">Everyone in this construction group</span>
              )}
            </span>
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
