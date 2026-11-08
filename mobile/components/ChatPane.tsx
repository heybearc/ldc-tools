import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Keyboard,
  type KeyboardEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Person = { id: string; name: string | null; email: string };
type Channel = {
  id: string;
  title: string;
  unread: number;
  latest: { body: string } | null;
};
type Message = {
  id: string;
  body: string;
  mine: boolean;
  author: Person;
};

function personName(person: Person) {
  return person.name || person.email;
}

export function ChatPane() {
  const { apiBase, token, signOut } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [teammates, setTeammates] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [blocked, setBlocked] = useState<Person[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [keyboardInset, setKeyboardInset] = useState(0);
  const newest = useRef<string | null>(null);
  const messageRequest = useRef(0);
  const listRef = useRef<FlatList<Message>>(null);
  const screenRef = useRef<View>(null);
  const keyboardInsetRef = useRef(0);

  const fail = useCallback(async (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.status === 401) {
      await signOut();
      return;
    }
    setError(err instanceof Error ? err.message : fallback);
  }, [signOut]);

  const loadChannels = useCallback(async () => {
    if (!token) return;
    try {
      const body = await apiRequest<{ channels: Channel[]; teammates: Person[] }>(apiBase, '/api/v1/mobile/chat', {
        token,
        action: 'Could not load chat',
      });
      setChannels(body.channels || []);
      setTeammates(body.teammates || []);
      const blocks = await apiRequest<{ blocks: Person[] }>(apiBase, '/api/v1/mobile/chat/blocks', {
        token,
        action: 'Could not load blocked people',
      });
      setBlocked(blocks.blocks || []);
    } catch (err) {
      await fail(err, 'Could not load chat. Try again in a moment.');
    }
  }, [apiBase, token, fail]);

  const loadMessages = useCallback(async (channelId: string, after?: string | null) => {
    if (!token) return;
    const requestId = messageRequest.current;
    const query = after ? `?after=${encodeURIComponent(after)}` : '';
    try {
      const body = await apiRequest<{ messages: Array<Message & { createdAt: string }> }>(
        apiBase,
        `/api/v1/mobile/chat/channels/${channelId}/messages${query}`,
        { token, action: 'Could not load messages' },
      );
      if (requestId !== messageRequest.current) return;
      const incoming = body.messages || [];
      setMessages((current) => {
        if (!after) return incoming;
        const seen = new Set(current.map((message) => message.id));
        return [...current, ...incoming.filter((message) => !seen.has(message.id))];
      });
      if (requestId !== messageRequest.current) return;
      if (incoming.length > 0) newest.current = incoming[incoming.length - 1].createdAt;
      await apiRequest(apiBase, `/api/v1/mobile/chat/channels/${channelId}/read`, {
        method: 'POST',
        token,
        action: 'Could not update the chat',
      });
    } catch (err) {
      if (requestId !== messageRequest.current) return;
      await fail(err, 'Could not load messages. Try again in a moment.');
    }
  }, [apiBase, token, fail]);

  useFocusEffect(useCallback(() => {
    void loadChannels();
  }, [loadChannels]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setAppActive(next === 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const liftAboveKeyboard = (event: KeyboardEvent) => {
      const keyboardTop = event.endCoordinates.screenY;
      screenRef.current?.measureInWindow((_x, y, _width, height) => {
        const unpaddedBottom = y + height - keyboardInsetRef.current;
        const lift = Math.max(0, Math.round(unpaddedBottom - keyboardTop));
        keyboardInsetRef.current = lift;
        setKeyboardInset(lift);
      });
    };
    const lower = () => {
      keyboardInsetRef.current = 0;
      setKeyboardInset(0);
    };
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, liftAboveKeyboard);
    const hideSub = Keyboard.addListener(hideEvent, lower);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    messageRequest.current += 1;
    newest.current = null;
    setMessages([]);
    void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    if (!selectedId || !appActive) return;
    const timer = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      void loadMessages(selectedId, newest.current);
    }, 4000);
    return () => clearInterval(timer);
  }, [selectedId, loadMessages, appActive]);

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
  }, [messages, keyboardInset]);

  async function send() {
    const text = draft.trim();
    if (!token || !selectedId || !text || sending) return;
    setSending(true);
    setError('');
    try {
      const body = await apiRequest<Message & { createdAt: string }>(
        apiBase,
        `/api/v1/mobile/chat/channels/${selectedId}/messages`,
        { method: 'POST', token, body: { body: text }, action: 'Could not send the message' },
      );
      setDraft('');
      setMessages((current) => (current.some((message) => message.id === body.id) ? current : [...current, body]));
      newest.current = body.createdAt;
      void loadChannels();
    } catch (err) {
      await fail(err, 'Could not send the message. Try again in a moment.');
    } finally {
      setSending(false);
    }
  }

  async function reportMessage(message: Message) {
    if (!token || !selectedId) return;
    Alert.alert('Report this message?', 'An administrator will review it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await apiRequest(apiBase, `/api/v1/mobile/chat/channels/${selectedId}/messages/${message.id}/report`, {
                method: 'POST',
                token,
                action: 'Could not send the report',
              });
              Alert.alert('Report sent', 'An administrator will review this message.');
            } catch (err) {
              await fail(err, 'Could not send the report. Try again in a moment.');
            }
          })();
        },
      },
    ]);
  }

  async function blockPerson(person: Person) {
    if (!token) return;
    Alert.alert(`Block ${personName(person)}?`, 'Their messages will be hidden, and you will not get their chat notifications.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await apiRequest(apiBase, '/api/v1/mobile/chat/blocks', {
                method: 'POST',
                token,
                body: { userId: person.id },
                action: 'Could not block that person',
              });
              await loadChannels();
              if (selectedId) await loadMessages(selectedId);
            } catch (err) {
              await fail(err, 'Could not block that person. Try again in a moment.');
            }
          })();
        },
      },
    ]);
  }

  async function unblockPerson(person: Person) {
    if (!token) return;
    try {
      await apiRequest(apiBase, '/api/v1/mobile/chat/blocks', {
        method: 'DELETE',
        token,
        body: { userId: person.id },
        action: 'Could not unblock that person',
      });
      await loadChannels();
    } catch (err) {
      await fail(err, 'Could not unblock that person. Try again in a moment.');
    }
  }

  async function openDirect(userId: string) {
    if (!token) return;
    setError('');
    try {
      const body = await apiRequest<{ id: string }>(apiBase, '/api/v1/mobile/chat/direct', {
        method: 'POST',
        token,
        body: { userId },
        action: 'Could not open the chat',
      });
      await loadChannels();
      setSelectedId(body.id);
    } catch (err) {
      await fail(err, 'Could not open the chat. Try again in a moment.');
    }
  }

  const selected = channels.find((channel) => channel.id === selectedId) || null;
  const showThread = Boolean(selectedId);

  return (
    <View ref={screenRef} style={[styles.screen, { paddingBottom: keyboardInset }]}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!showThread ? (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<Text style={styles.listTitle}>Chats</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedId(item.id)} style={styles.channel}>
              <View style={styles.channelRow}>
                <Text style={styles.channelTitle}>{item.title}</Text>
                {item.unread > 0 ? <Text style={styles.unread}>{item.unread}</Text> : null}
              </View>
              {item.latest ? <Text style={styles.preview} numberOfLines={1}>{item.latest.body}</Text> : null}
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No chats yet.</Text>}
          ListFooterComponent={(
            <View style={styles.people}>
              <Text style={styles.heading}>Message one person</Text>
              {teammates.map((person) => (
                <Pressable key={person.id} onPress={() => void openDirect(person.id)} style={styles.person}>
                  <Text style={styles.personText}>{personName(person)}</Text>
                </Pressable>
              ))}
              {blocked.length > 0 ? <Text style={styles.heading}>Blocked</Text> : null}
              {blocked.map((person) => (
                <Pressable key={person.id} onPress={() => void unblockPerson(person)} style={styles.person}>
                  <Text style={styles.personText}>{personName(person)}</Text>
                  <Text style={styles.unblock}>Unblock</Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      ) : (
        <View style={styles.thread}>
          <Pressable onPress={() => setSelectedId(null)} style={styles.backBar}>
            <Text style={styles.backText}>‹ All chats</Text>
            <Text style={styles.channelTitle} numberOfLines={1}>{selected?.title || 'Chat'}</Text>
          </Pressable>
          <FlatList
            ref={listRef}
            style={styles.messageList}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}>
                {!item.mine ? <Text style={styles.author}>{personName(item.author)}</Text> : null}
                <Text style={[styles.body, item.mine && styles.mineText]}>{item.body}</Text>
                {!item.mine ? (
                  <View style={styles.actions}>
                    <Pressable onPress={() => void reportMessage(item)}>
                      <Text style={styles.action}>Report</Text>
                    </Pressable>
                    <Pressable onPress={() => void blockPerson(item.author)}>
                      <Text style={styles.action}>Block</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )}
          />
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={selected ? `Message ${selected.title}` : 'Message'}
              style={styles.input}
            />
            <Pressable onPress={() => void send()} disabled={sending || !draft.trim()} style={styles.send}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  error: { color: '#b91c1c', padding: 12 },
  empty: { color: '#6b7280', padding: 16 },
  listTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 8 },
  people: { padding: 16, gap: 8 },
  person: { backgroundColor: '#fff', borderRadius: 10, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  personText: { color: '#111827', fontWeight: '600' },
  unblock: { color: '#1e40af', fontWeight: '600', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  action: { color: '#1e3a8a', fontSize: 12, fontWeight: '700' },
  channel: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  channelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  channelTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  unread: { backgroundColor: '#fef3c7', color: '#92400e', overflow: 'hidden', borderRadius: 10, paddingHorizontal: 8, fontWeight: '700' },
  preview: { color: '#6b7280', marginTop: 2 },
  thread: { flex: 1 },
  messageList: { flex: 1 },
  backBar: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 2 },
  backText: { color: '#1e40af', fontWeight: '700', fontSize: 17 },
  messages: { padding: 12, gap: 8 },
  bubble: { maxWidth: '80%', borderRadius: 12, padding: 10 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#1e40af' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb' },
  author: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 2 },
  body: { color: '#111827', fontSize: 15 },
  mineText: { color: '#fff' },
  composer: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff' },
  input: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  send: { minHeight: 44, minWidth: 72, borderRadius: 8, backgroundColor: '#1e40af', alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700' },
});
