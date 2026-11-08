import { useCallback, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PRIVACY_URL, SUPPORT_URL } from '@/lib/support';

type Notice = { id: string; title: string; message: string; type: string };

const LINKS = [
  { title: 'Processes', detail: 'Templates and starting work', href: '/processes' },
  { title: 'Trade teams', detail: 'Teams and crews', href: '/trade-teams' },
  { title: 'Feedback', detail: 'Send a note and see your items', href: '/feedback' },
];

export default function MoreScreen() {
  const { apiBase, token, user, signOut } = useAuth();
  const router = useRouter();
  const [admin, setAdmin] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await apiRequest<{ announcements: Notice[]; admin: boolean }>(apiBase, '/api/v1/mobile/announcements', {
        token,
        action: 'Could not load announcements',
      });
      setNotices(body.announcements || []);
      setAdmin(Boolean(body.admin));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load this section');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const items = admin
    ? [...LINKS, { title: 'Admin', detail: 'People, announcements, and feedback', href: '/admin' }]
    : LINKS;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }} />}
    >
      <Text style={styles.hello}>{user?.name || user?.email}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notices.map((notice) => (
        <View key={notice.id} style={styles.card}>
          <Text style={styles.kicker}>{notice.type === 'URGENT' ? 'Urgent' : notice.type === 'WARNING' ? 'Warning' : 'Announcement'}</Text>
          <Text style={styles.title}>{notice.title}</Text>
          <Text style={styles.detail}>{notice.message}</Text>
        </View>
      ))}
      {items.map((item) => (
        <Pressable key={item.href} onPress={() => router.push(item.href as '/processes')} style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.detail}>{item.detail}</Text>
        </Pressable>
      ))}
      <Pressable onPress={() => void Linking.openURL('https://ldctools.com/help')} style={styles.card}>
        <Text style={styles.title}>Help</Text>
        <Text style={styles.detail}>Guides from the website</Text>
      </Pressable>
      <Pressable onPress={() => void Linking.openURL('https://ldctools.com/release-notes')} style={styles.card}>
        <Text style={styles.title}>Release notes</Text>
      </Pressable>
      <Pressable onPress={() => void Linking.openURL(SUPPORT_URL)} style={styles.card}>
        <Text style={styles.title}>Support</Text>
      </Pressable>
      <Pressable onPress={() => void Linking.openURL(PRIVACY_URL)} style={styles.card}>
        <Text style={styles.title}>Privacy policy</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  hello: { fontSize: 16, color: '#374151' },
  error: { color: '#b91c1c' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 4 },
  kicker: { color: '#1e40af', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  detail: { color: '#4b5563', fontSize: 15 },
});
