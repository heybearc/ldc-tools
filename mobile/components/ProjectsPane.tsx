import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fetchProjects, projectFacts, type Project } from '@/lib/projects';

export function ProjectsPane() {
  const { apiBase, token, signOut } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await fetchProjects(apiBase, token);
      setProjects(body.projects || []);
      setCanManage(Boolean(body.canCreate ?? body.canManage));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load projects. Try again in a moment.');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  return (
    <ScrollView
      testID="screen-projects"
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }} />}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {canManage ? (
        <Pressable onPress={() => router.push('/project/new')} style={styles.add}>
          <Text style={styles.addText}>Add project</Text>
        </Pressable>
      ) : null}
      {projects.length === 0 && !error ? (
        <Text style={styles.empty}>No projects for this construction group.</Text>
      ) : null}
      {projects.map((project) => {
        const facts = projectFacts(project);
        return (
          <Pressable key={project.id} onPress={() => router.push(`/project/${project.id}`)} style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{project.name}</Text>
              <Text style={styles.status}>{project.status}</Text>
            </View>
            <Text style={styles.meta}>{facts || 'No number, location, or dates yet'}</Text>
            <Text style={styles.section}>Personnel</Text>
            <Text style={styles.body}>
              {project.personnel.length === 0 ? 'No one assigned' : project.personnel.map((person) => person.name).join(', ')}
            </Text>
            <Text style={styles.section}>Schedule</Text>
            {project.schedule.length === 0 ? <Text style={styles.body}>No dated work on this project.</Text> : null}
            {project.schedule.map((item) => (
              <Text key={item.id} style={styles.body}>
                {[item.date, item.title].filter(Boolean).join(' · ')}
                {item.status === 'DONE' ? ' · Done' : ''}
                {item.detail ? `\n${item.detail}` : ''}
              </Text>
            ))}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  empty: { color: '#6b7280' },
  error: { color: '#b91c1c' },
  add: { backgroundColor: '#1e40af', minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827' },
  status: { color: '#1e40af', fontSize: 13, fontWeight: '700' },
  meta: { color: '#4b5563', fontSize: 14 },
  section: { marginTop: 6, color: '#111827', fontSize: 14, fontWeight: '700' },
  body: { color: '#374151', fontSize: 15 },
});
