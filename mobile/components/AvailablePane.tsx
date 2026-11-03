import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fetchHome, type WorkItem } from '@/lib/home';

export function AvailablePane() {
  const { apiBase, token, signOut } = useAuth();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await fetchHome(apiBase, token);
      setItems(body.available || []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load available work. Try again in a moment.');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function claim(id: string) {
    if (!token || busyId) return;
    setBusyId(id);
    setError('');
    try {
      await apiRequest(apiBase, `/api/v1/mobile/work/${id}/claim`, {
        method: 'POST',
        token,
        action: 'Could not claim the work',
      });
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not claim the work. Try again in a moment.');
    } finally {
      setBusyId('');
    }
  }

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
      <Text style={styles.intro}>Claimable work that no one has taken yet.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items.length === 0 && !error ? <Text style={styles.empty}>No work is waiting to be claimed.</Text> : null}
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          {item.timing ? <Text style={styles.timing}>{item.timing}</Text> : null}
          {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
          <Pressable onPress={() => void claim(item.id)} disabled={Boolean(busyId)} style={styles.claim}>
            {busyId === item.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.claimText}>Claim</Text>}
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  intro: { color: '#4b5563', lineHeight: 20 },
  empty: { color: '#6b7280' },
  error: { color: '#b91c1c' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  timing: { color: '#1e40af', fontSize: 13, fontWeight: '600' },
  detail: { color: '#4b5563', fontSize: 15 },
  claim: {
    marginTop: 8,
    backgroundColor: '#1e40af',
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
