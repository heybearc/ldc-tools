import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Choice, Field, PrimaryButton } from '@/components/fields';

type Step = { id: string; title: string; detail: string };
type Template = {
  id: string;
  name: string;
  purpose?: string | null;
  appliesTo?: 'TEAM' | 'PROJECT';
  cadence?: 'ONCE' | 'WEEKLY' | 'MONTHLY';
  steps: Step[];
};
type Project = { id: string; name: string };

export default function ProcessesScreen() {
  const { apiBase, token, signOut } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [appliesTo, setAppliesTo] = useState<'TEAM' | 'PROJECT'>('TEAM');
  const [cadence, setCadence] = useState<'ONCE' | 'WEEKLY'>('ONCE');
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
      const template = templates.find((item) => item.id === id);
      const forProject = template?.appliesTo === 'PROJECT';
      if (forProject && !projectId) {
        setError('Choose a project for this process');
        setBusy('');
        return;
      }
      const body = await apiRequest<{ id: string }>(apiBase, `/api/v1/mobile/processes/${id}/start`, {
        method: 'POST',
        token,
        body: { projectId: forProject ? projectId : null },
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
        body: {
          name,
          appliesTo,
          cadence: appliesTo === 'TEAM' ? 'MONTHLY' : cadence,
          steps: [{ title: stepTitle, detail: stepDetail, explanation: '', referenceUrl: '' }],
        },
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
    <ScrollView testID="screen-processes" style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {canManage ? (
        <View style={styles.card}>
          <Text style={styles.title}>New process</Text>
          <Field label="Name" value={name} onChangeText={setName} />
          <View style={styles.row}>
            <Choice label="Team · Monthly" selected={appliesTo === 'TEAM'} onPress={() => setAppliesTo('TEAM')} />
            <Choice label="Project" selected={appliesTo === 'PROJECT'} onPress={() => setAppliesTo('PROJECT')} />
          </View>
          {appliesTo === 'PROJECT' ? (
            <View style={styles.row}>
              <Choice label="Once" selected={cadence === 'ONCE'} onPress={() => setCadence('ONCE')} />
              <Choice label="Weekly" selected={cadence === 'WEEKLY'} onPress={() => setCadence('WEEKLY')} />
            </View>
          ) : null}
          <Field label="Task" value={stepTitle} onChangeText={setStepTitle} />
          <Field label="Instructions" value={stepDetail} onChangeText={setStepDetail} multiline />
          <PrimaryButton label={busy === 'create' ? 'Saving…' : 'Add process'} onPress={() => void create()} disabled={Boolean(busy)} />
        </View>
      ) : null}
      {templates.length === 0 && !error ? <Text style={styles.empty}>No processes yet.</Text> : null}
      {canManage && projects.length > 0 && templates.some((template) => template.appliesTo === 'PROJECT') ? (
        <View style={styles.row}>
          {projects.map((project) => (
            <Choice key={project.id} label={project.name} selected={projectId === project.id} onPress={() => setProjectId(project.id)} />
          ))}
        </View>
      ) : null}
      {templates.map((template) => (
        <View key={template.id} style={styles.card}>
          <Text style={styles.title}>{template.name}</Text>
          <Text style={styles.detail}>
            {template.appliesTo === 'PROJECT'
              ? (template.cadence === 'WEEKLY' ? 'Project · Weekly' : 'Project · Once')
              : 'Team · Monthly'}
          </Text>
          {template.steps.map((step) => (
            <Text key={step.id} style={styles.detail}>{step.title}{step.detail ? ` — ${step.detail}` : ''}</Text>
          ))}
          {canManage ? (
            <PrimaryButton
              label={busy === template.id ? 'Starting…' : template.appliesTo === 'PROJECT' ? 'Add to project' : 'Add to work'}
              onPress={() => void start(template.id)}
              disabled={Boolean(busy)}
            />
          ) : null}
        </View>
      ))}
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
