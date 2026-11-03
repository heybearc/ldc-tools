import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Step = {
  id: string;
  title: string;
  detail: string;
  explanation: string | null;
  referenceUrl: string | null;
  done: boolean;
};

type WorkDetail = {
  id: string;
  title: string;
  detail: string;
  explanation: string | null;
  referenceUrl: string | null;
  timing: string;
  status: 'OPEN' | 'DONE';
  mine: boolean;
  steps: Step[];
};

export function WorkDetail({ id }: { id: string }) {
  const { apiBase, token, signOut } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState<WorkDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await apiRequest<WorkDetail>(apiBase, `/api/v1/mobile/work/${id}`, {
        token,
        action: 'Could not open the work',
      });
      setItem(body);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not open the work. Try again in a moment.');
    }
  }, [apiBase, id, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function run(action: string, path: string, options: { method: string; body?: unknown }) {
    if (!token || busy) return;
    setBusy(action);
    setError('');
    try {
      await apiRequest(apiBase, path, { ...options, token, action });
      if (action === 'Could not return the work to the pool' || action === 'Could not mark the work done') {
        router.back();
        return;
      }
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : `${action}. Try again in a moment.`);
    } finally {
      setBusy('');
    }
  }

  if (!item && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const open = item?.status === 'OPEN' && item.mine;
  const doneCount = item?.steps.filter((step) => step.done).length || 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {item ? (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          {item.timing ? <Text style={styles.timing}>{item.timing}</Text> : null}
          {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
          {item.explanation ? <Text style={styles.detail}>{item.explanation}</Text> : null}
          {item.referenceUrl ? (
            <Pressable onPress={() => Linking.openURL(item.referenceUrl || '')}>
              <Text style={styles.link}>Reference</Text>
            </Pressable>
          ) : null}
          {item.steps.length > 0 ? (
            <View style={styles.steps}>
              <Text style={styles.stepHeading}>Steps ({doneCount} of {item.steps.length})</Text>
              {item.steps.map((step) => (
                <View key={step.id} style={styles.step}>
                  <Pressable
                    disabled={!open || Boolean(busy)}
                    onPress={() => void run('Could not update the step', `/api/v1/mobile/work/${id}/steps/${step.id}`, {
                      method: 'PATCH',
                      body: { done: !step.done },
                    })}
                    style={styles.stepToggle}
                  >
                    <View style={[styles.box, step.done && styles.boxOn]}>
                      {step.done ? <Text style={styles.check}>✓</Text> : null}
                    </View>
                    <View style={styles.stepBody}>
                      <Text style={[styles.stepTitle, step.done && styles.doneText]}>{step.title}</Text>
                      {step.detail ? <Text style={styles.detail}>{step.detail}</Text> : null}
                      {step.explanation ? <Text style={styles.detail}>{step.explanation}</Text> : null}
                    </View>
                  </Pressable>
                  {step.referenceUrl ? (
                    <Pressable onPress={() => Linking.openURL(step.referenceUrl || '')} style={styles.reference}>
                      <Text style={styles.link}>Reference</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
          {open ? (
            <View style={styles.actions}>
              <Pressable
                disabled={Boolean(busy)}
                onPress={() => void run('Could not mark the work done', `/api/v1/mobile/work/${id}`, {
                  method: 'PATCH',
                  body: { status: 'DONE' },
                })}
                style={styles.primary}
              >
                {busy.startsWith('Could not mark') ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Done</Text>}
              </Pressable>
              <Pressable
                disabled={Boolean(busy)}
                onPress={() => void run('Could not return the work to the pool', `/api/v1/mobile/work/${id}/release`, {
                  method: 'POST',
                })}
                style={styles.secondary}
              >
                <Text style={styles.secondaryText}>Return to pool</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.detail}>{item.status === 'DONE' ? 'This work is done.' : 'This work is not assigned to you.'}</Text>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  timing: { color: '#1e40af', fontSize: 13, fontWeight: '600' },
  detail: { color: '#4b5563', fontSize: 15, lineHeight: 21 },
  error: { color: '#b91c1c', marginBottom: 8 },
  link: { color: '#1e40af', fontWeight: '600' },
  steps: { gap: 10, marginTop: 8 },
  stepHeading: { fontSize: 15, fontWeight: '700', color: '#111827' },
  step: { gap: 2, minHeight: 44 },
  stepToggle: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepBody: { flex: 1, gap: 2 },
  reference: { marginLeft: 34, minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  stepTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  doneText: { color: '#6b7280', textDecorationLine: 'line-through' },
  box: {
    width: 24,
    height: 24,
    marginTop: 2,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: '#1e40af' },
  check: { color: '#fff', fontWeight: '700' },
  actions: { gap: 8, marginTop: 8 },
  primary: {
    backgroundColor: '#1e40af',
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#111827', fontWeight: '600', fontSize: 16 },
});
