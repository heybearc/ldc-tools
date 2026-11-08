import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Choice, Field, PrimaryButton } from '@/components/fields';

type Step = { id: string; title: string; detail: string };
type Template = { id: string; name: string; steps: Step[] };
type Project = { id: string; name: string };

export default function ProcessesScreen() {
  const { apiBase, token, signOut } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [stepTitle, setStepTitle] = useState('');
  const [stepDetail, setStepDetail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await apiRequest<{ canManage: boolean; projects: Project[]; templates: Template[] }>(
        apiBase,
        '/api/v1/mobile/processes',
        { token, action: 'Could not load processes' },
      );
      setCanManage(body.canManage);
      setProjects(body.projects || []);
      setTemplates(body.templates || []);
      setProjectId((current) => current || body.projects?.[0]?.id || '');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load processes');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function start(id: string) {
    if (!token || busy) return;
    setBusy(id);
    setError('');
    try {
      const body = await apiRequest<{ id: string }>(apiBase, `/api/v1/mobile/processes/${id}/start`, {
        method: 'POST',
        token,
        body: { projectId: projectId || null },
        action: 'Could not start the process',
      });
      router.push(`/work/${body.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not start the process');
    } finally {
      setBusy('');
    }
  }

  async function create() {
    if (!token || busy) return;
    setBusy('create');
    setError('');
    try {
      await apiRequest(apiBase, '/api/v1/mobile/processes', {
        method: 'POST',
        token,
        action: 'Could not add the process',
        body: { name, steps: [{ title: stepTitle, detail: stepDetail, explanation: '', referenceUrl: '' }] },
      });
      setName('');
      setStepTitle('');
      setStepDetail('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the process');
    } finally {
      setBusy('');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {templates.length === 0 && !error ? <Text style={styles.empty}>No processes yet.</Text> : null}
      {canManage && projects.length > 0 ? (
        <View style={styles.row}>
          {projects.map((project) => (
            <Choice key={project.id} label={project.name} selected={projectId === project.id} onPress={() => setProjectId(project.id)} />
          ))}
        </View>
      ) : null}
      {templates.map((template) => (
        <View key={template.id} style={styles.card}>
          <Text style={styles.title}>{template.name}</Text>
          {template.steps.map((step) => (
            <Text key={step.id} style={styles.detail}>{step.title}{step.detail ? ` — ${step.detail}` : ''}</Text>
          ))}
          {canManage ? (
            <PrimaryButton label={busy === template.id ? 'Starting…' : 'Start'} onPress={() => void start(template.id)} disabled={Boolean(busy)} />
          ) : null}
        </View>
      ))}
      {canManage ? (
        <View style={styles.card}>
          <Text style={styles.title}>New process</Text>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field label="Step" value={stepTitle} onChangeText={setStepTitle} />
          <Field label="Detail" value={stepDetail} onChangeText={setStepDetail} multiline />
          <PrimaryButton label={busy === 'create' ? 'Saving…' : 'Add process'} onPress={() => void create()} disabled={Boolean(busy)} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  empty: { color: '#6b7280' },
  error: { color: '#b91c1c' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  detail: { color: '#374151' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
