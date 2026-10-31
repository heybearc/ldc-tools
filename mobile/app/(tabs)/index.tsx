import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Home = {
  user: { name: string | null; email: string };
  work: Array<{ id: string; title: string; detail: string; timing: string }>;
};

export default function MyWorkScreen() {
  const { apiBase, token, user, signOut } = useAuth();
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await apiRequest<Home>(apiBase, '/api/v1/mobile/home', { token });
      setHome(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load work');
    }
  }, [apiBase, token]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

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
      {(home?.work || []).length === 0 && !error ? (
        <Text style={styles.empty}>No open work is assigned to you.</Text>
      ) : null}
      {(home?.work || []).map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          {item.timing ? <Text style={styles.timing}>{item.timing}</Text> : null}
          {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
        </View>
      ))}
      <Pressable onPress={() => void signOut()} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  hello: { fontSize: 16, color: '#374151', marginBottom: 4 },
  empty: { color: '#6b7280' },
  error: { color: '#b91c1c' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  timing: { color: '#1e40af', fontSize: 13, fontWeight: '600' },
  detail: { color: '#4b5563', fontSize: 15 },
  signOut: { marginTop: 12, minHeight: 44, justifyContent: 'center' },
  signOutText: { color: '#1e40af', fontWeight: '600' },
});
