import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AccountFooter } from '@/components/AccountFooter';
import { Choice } from '@/components/fields';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fetchHome, type Home } from '@/lib/home';
import { byTime, publishedOn } from '@/lib/published-date';

function stepLine(done?: number, total?: number) {
  if (!total) return '';
  return `${done || 0} of ${total} steps`;
}

export function MyWorkPane() {
  const { apiBase, token, user, signOut } = useAuth();
  const router = useRouter();
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [newestFirst, setNewestFirst] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await fetchHome(apiBase, token);
      setHome(body);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load your work. Try again in a moment.');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  return (
    <ScrollView
      testID="screen-my-work"
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
      <View style={styles.sort}>
        <Choice label="Newest" selected={newestFirst} onPress={() => setNewestFirst(true)} />
        <Choice label="Oldest" selected={!newestFirst} onPress={() => setNewestFirst(false)} />
      </View>
      {(home?.work || []).length === 0 && !error ? (
        <Text style={styles.empty}>No open work is assigned to you.</Text>
      ) : null}
      {byTime(home?.work || [], (item) => item.publishedAt, newestFirst).map((item) => (
        <Pressable key={item.id} onPress={() => router.push(`/work/${item.id}`)} style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          {publishedOn(item.publishedAt) ? <Text style={styles.timing}>Published {publishedOn(item.publishedAt)}</Text> : null}
          {item.timing ? <Text style={styles.timing}>{item.timing}</Text> : null}
          {stepLine(item.stepsDone, item.stepsTotal) ? <Text style={styles.timing}>{stepLine(item.stepsDone, item.stepsTotal)}</Text> : null}
          {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
        </Pressable>
      ))}
      <AccountFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  sort: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hello: { fontSize: 16, color: '#374151', marginBottom: 4 },
  empty: { color: '#6b7280' },
  error: { color: '#b91c1c' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  timing: { color: '#1e40af', fontSize: 13, fontWeight: '600' },
  detail: { color: '#4b5563', fontSize: 15 },
});
