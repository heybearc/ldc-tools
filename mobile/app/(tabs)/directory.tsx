import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Person = {
  name: string;
  email: string;
  phone: string | null;
  role: string;
  place: string;
};

export default function DirectoryScreen() {
  const { apiBase, token } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await apiRequest<{ people: Person[] }>(apiBase, '/api/v1/mobile/home', { token });
      setPeople(body.people || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the directory');
    }
  }, [apiBase, token]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((person) =>
      `${person.name} ${person.email} ${person.role} ${person.place}`.toLowerCase().includes(needle),
    );
  }, [people, query]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }} />}
    >
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search name, trade, or role"
        autoCapitalize="none"
        style={styles.search}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {shown.map((person, index) => (
        <View key={`${person.email}-${person.role}-${person.place}-${index}`} style={styles.card}>
          <Text style={styles.name}>{person.name || person.email}</Text>
          <Text style={styles.meta}>{person.role} · {person.place}</Text>
          {person.email ? <Text style={styles.meta}>{person.email}</Text> : null}
          {person.phone ? <Text style={styles.meta}>{person.phone}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 10 },
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  error: { color: '#b91c1c' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 2 },
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  meta: { color: '#4b5563', fontSize: 14 },
});
