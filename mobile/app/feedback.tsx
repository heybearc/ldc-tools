import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Choice, Field, PrimaryButton } from '@/components/fields';

type Item = {
  id: string;
  feedbackNumber: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  resolutionComment: string | null;
};

const TYPES = [
  { value: 'BUG', label: 'Bug' },
  { value: 'ENHANCEMENT', label: 'Enhancement' },
  { value: 'FEATURE', label: 'Feature' },
];

export default function FeedbackScreen() {
  const { apiBase, token, signOut } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [type, setType] = useState('BUG');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const body = await apiRequest<{ feedback: Item[] }>(apiBase, '/api/v1/mobile/feedback', {
        token,
        action: 'Could not load your feedback',
      });
      setItems(body.feedback || []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load your feedback');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function submit() {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, '/api/v1/mobile/feedback', {
        method: 'POST',
        token,
        action: 'Could not send feedback',
        body: { type, title, description, priority: 'MEDIUM' },
      });
      setTitle('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send feedback');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Send feedback</Text>
        <View style={styles.row}>
          {TYPES.map((item) => (
            <Choice key={item.value} label={item.label} selected={type === item.value} onPress={() => setType(item.value)} />
          ))}
        </View>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={busy ? 'Sending…' : 'Send'} onPress={() => void submit()} disabled={busy} />
      </View>
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.kicker}>{item.feedbackNumber} · {item.status.replace('_', ' ')}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.detail}>{item.description}</Text>
          {item.resolutionComment ? <Text style={styles.detail}>{item.resolutionComment}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kicker: { color: '#1e40af', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  detail: { color: '#374151' },
  error: { color: '#b91c1c' },
});
