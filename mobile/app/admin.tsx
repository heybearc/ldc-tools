import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AccountList } from '@/components/AccountList';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Choice, Field, PrimaryButton } from '@/components/fields';

type Notice = { id: string; title: string; message: string; type: string; isActive: boolean };
type FeedbackRow = {
  id: string;
  feedbackNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  user: { name: string | null; email: string };
};
type AuditRow = { id: string; action: string; resource: string; at: string; who: string };

export default function AdminScreen() {
  const { apiBase, token, signOut } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await apiRequest<{
        activeUsers: number;
        announcements: Notice[];
        feedback: FeedbackRow[];
        audit: AuditRow[];
      }>(apiBase, '/api/v1/mobile/admin', { token, action: 'Could not load admin tools' });
      setActiveUsers(body.activeUsers);
      setNotices(body.announcements || []);
      setFeedback(body.feedback || []);
      setAudit(body.audit || []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load admin tools');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function post(body: Record<string, unknown>, action: string) {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, '/api/v1/mobile/admin', { method: 'POST', token, body, action });
      setTitle('');
      setMessage('');
      setNote('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : action);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.block}>
        <Text style={styles.title}>Accounts</Text>
        <Text style={styles.detail}>{activeUsers} personnel and admin sign-ins. Change a role here.</Text>
        <AccountList />
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Announcement</Text>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Message" value={message} onChangeText={setMessage} multiline />
        <PrimaryButton
          label={busy ? 'Saving…' : 'Post announcement'}
          onPress={() => void post({ action: 'announcement', title, message, type: 'INFO' }, 'Could not post the announcement')}
          disabled={busy}
        />
        {notices.map((item) => (
          <Text key={item.id} style={styles.detail}>{item.title}{item.isActive ? '' : ' · hidden'}</Text>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Open feedback</Text>
        <Field label="Resolution note" value={note} onChangeText={setNote} />
        {feedback.length === 0 ? <Text style={styles.detail}>No open feedback.</Text> : null}
        {feedback.map((item) => (
          <View key={item.id} style={styles.block}>
            <Text style={styles.detail}>{item.feedbackNumber} · {item.title}</Text>
            <Text style={styles.detail}>{item.user.name || item.user.email}</Text>
            <View style={styles.row}>
              <Choice label="In progress" selected={false} onPress={() => void post({ action: 'feedback', feedbackId: item.id, status: 'IN_PROGRESS' }, 'Could not update feedback')} />
              <Choice label="Resolved" selected={false} onPress={() => void post({ action: 'feedback', feedbackId: item.id, status: 'RESOLVED', resolutionComment: note }, 'Could not update feedback')} />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Recent activity</Text>
        {audit.map((row) => (
          <Text key={row.id} style={styles.detail}>{row.who} · {row.action} · {row.resource}</Text>
        ))}
        <Text style={styles.detail}>Mail settings and backups stay on the website admin pages.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  block: { gap: 6, paddingTop: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  detail: { color: '#374151' },
  error: { color: '#b91c1c' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
