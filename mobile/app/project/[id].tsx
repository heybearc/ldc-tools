import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fetchProjects, type PersonnelChoice, type Project } from '@/lib/projects';
import { Choice, Field, PrimaryButton } from '@/components/fields';

const STATUSES = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const creating = id === 'new';
  const { apiBase, token, signOut } = useAuth();
  const router = useRouter();
  const [canManage, setCanManage] = useState(false);
  const [canAssign, setCanAssign] = useState(false);
  const [personnel, setPersonnel] = useState<PersonnelChoice[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('PLANNING');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateTitle, setDateTitle] = useState('');
  const [dateDetail, setDateDetail] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setError('');
    try {
      const body = await fetchProjects(apiBase, token);
      setCanManage(Boolean(body.canManage));
      setCanAssign(Boolean(body.canAssign));
      setPersonnel(body.personnel || []);
      if (creating) return;
      const found = (body.projects || []).find((item) => item.id === id) || null;
      setProject(found);
      if (found) {
        setName(found.name);
        setNumber(found.number || '');
        setLocation(found.location || '');
        setStatus(found.statusCode || 'PLANNING');
        setStartDate(found.startDate || '');
        setEndDate(found.endDate || '');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load the project');
    }
  }, [apiBase, creating, id, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function save() {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      const body = { name, number, location, status, startDate, endDate };
      if (creating) {
        const created = await apiRequest<{ id: string }>(apiBase, '/api/v1/mobile/projects', {
          method: 'POST',
          token,
          body,
          action: 'Could not add the project',
        });
        router.replace(`/project/${created.id}`);
      } else {
        await apiRequest(apiBase, `/api/v1/mobile/projects/${id}`, {
          method: 'PATCH',
          token,
          body,
          action: 'Could not save the project',
        });
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the project');
    } finally {
      setBusy(false);
    }
  }

  async function addDate() {
    if (!token || busy || creating) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, `/api/v1/mobile/projects/${id}/dates`, {
        method: 'POST',
        token,
        body: { title: dateTitle, detail: dateDetail, date },
        action: 'Could not add the date',
      });
      setDateTitle('');
      setDateDetail('');
      setDate('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the date');
    } finally {
      setBusy(false);
    }
  }

  async function assign(userId: string, remove: boolean) {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, `/api/v1/mobile/projects/${id}/personnel`, {
        method: 'POST',
        token,
        body: { userId, remove },
        action: 'Could not update personnel',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update personnel');
    } finally {
      setBusy(false);
    }
  }

  if (!creating && project === null && !error) {
    return <View style={styles.screen} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!creating && !project && error ? <Text style={styles.empty}>That project is no longer here.</Text> : null}
      {canManage || creating ? (
        <View style={styles.card}>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field label="Number" value={number} onChangeText={setNumber} />
          <Field label="Location" value={location} onChangeText={setLocation} />
          <Field label="Start" value={startDate} onChangeText={setStartDate} />
          <Field label="End" value={endDate} onChangeText={setEndDate} />
          <View style={styles.row}>
            {STATUSES.map((item) => (
              <Choice key={item.value} label={item.label} selected={status === item.value} onPress={() => setStatus(item.value)} />
            ))}
          </View>
          <PrimaryButton label={busy ? 'Saving…' : creating ? 'Add project' : 'Save project'} onPress={() => void save()} disabled={busy} />
        </View>
      ) : project ? (
        <View style={styles.card}>
          <Text style={styles.title}>{project.name}</Text>
          <Text style={styles.detail}>{project.status}</Text>
        </View>
      ) : null}
      {!creating && project ? (
        <View style={styles.card}>
          <Text style={styles.title}>Schedule</Text>
          {project.schedule.length === 0 ? <Text style={styles.detail}>No dated work yet.</Text> : null}
          {project.schedule.map((item) => (
            <Text key={item.id} style={styles.detail}>{[item.date, item.title].filter(Boolean).join(' · ')}</Text>
          ))}
          {canManage ? (
            <>
              <Field label="Date title" value={dateTitle} onChangeText={setDateTitle} />
              <Field label="Detail" value={dateDetail} onChangeText={setDateDetail} />
              <Field label="Date" value={date} onChangeText={setDate} />
              <PrimaryButton label="Add date" onPress={() => void addDate()} disabled={busy} />
            </>
          ) : null}
        </View>
      ) : null}
      {!creating && project ? (
        <View style={styles.card}>
          <Text style={styles.title}>Personnel</Text>
          {project.personnel.length === 0 ? <Text style={styles.detail}>No one assigned.</Text> : null}
          {project.personnel.map((person) => (
            <View key={person.id} style={styles.row}>
              <Text style={styles.detail}>{person.name}</Text>
              {canAssign ? <Choice label="Remove" selected={false} onPress={() => void assign(person.id, true)} /> : null}
            </View>
          ))}
          {canAssign ? personnel.filter((person) => !project.personnel.some((row) => row.id === person.id)).map((person) => (
            <Choice key={person.id} label={`Add ${person.name}`} selected={false} onPress={() => void assign(person.id, false)} />
          )) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  detail: { color: '#374151', flex: 1 },
  error: { color: '#b91c1c' },
  empty: { color: '#6b7280' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
