import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Field, PrimaryButton } from '@/components/fields';

type ReferenceLink = {
  id: string;
  title: string;
  url: string;
  note: string | null;
  category: string;
};

export default function ReferencesScreen() {
  const { apiBase, token, signOut } = useAuth();
  const [links, setLinks] = useState<ReferenceLink[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await apiRequest<{ canManage: boolean; links: ReferenceLink[] }>(apiBase, '/api/v1/mobile/references', {
        token,
        action: 'Could not load references',
      });
      setCanManage(Boolean(body.canManage));
      setLinks(body.links || []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load references');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return links;
    return links.filter((link) => [link.title, link.url, link.note || '', link.category].some((part) => part.toLowerCase().includes(needle)));
  }, [links, query]);

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setUrl('');
    setCategory('');
    setNote('');
  }

  async function save() {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, editingId ? `/api/v1/mobile/references/${editingId}` : '/api/v1/mobile/references', {
        method: editingId ? 'PATCH' : 'POST',
        token,
        body: { title, url, category, note },
        action: 'Could not save the reference',
      });
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the reference');
    } finally {
      setBusy(false);
    }
  }

  async function remove(link: ReferenceLink) {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, `/api/v1/mobile/references/${link.id}`, {
        method: 'DELETE',
        token,
        action: 'Could not remove the reference',
      });
      if (editingId === link.id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the reference');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView testID="screen-references" style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Shared links for this construction group. Search, then open one.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Field label="Search" value={query} onChangeText={setQuery} />
      {canManage ? (
        <View style={styles.form}>
          <Text style={styles.heading}>{editingId ? 'Edit link' : 'Add link'}</Text>
          <Field label="Title" value={title} onChangeText={setTitle} />
          <Field label="Web address" value={url} onChangeText={setUrl} />
          <Field label="Category" value={category} onChangeText={setCategory} />
          <Field label="Note" value={note} onChangeText={setNote} multiline />
          <PrimaryButton label={busy ? 'Saving' : editingId ? 'Save changes' : 'Save link'} onPress={() => { void save(); }} disabled={busy} />
          {editingId ? <Pressable onPress={resetForm}><Text style={styles.cancel}>Cancel</Text></Pressable> : null}
        </View>
      ) : null}
      {visible.length === 0 ? <Text style={styles.empty}>{links.length === 0 ? 'No links yet.' : 'No links match that search.'}</Text> : null}
      {visible.map((link) => (
        <View key={link.id} style={styles.card}>
          <Text style={styles.kicker}>{link.category}</Text>
          <Pressable onPress={() => { void Linking.openURL(link.url); }}>
            <Text style={styles.title}>{link.title}</Text>
          </Pressable>
          {link.note ? <Text style={styles.detail}>{link.note}</Text> : null}
          {canManage ? (
            <View style={styles.actions}>
              <Pressable onPress={() => {
                setEditingId(link.id);
                setTitle(link.title);
                setUrl(link.url);
                setCategory(link.category === 'General' ? '' : link.category);
                setNote(link.note || '');
              }}>
                <Text style={styles.action}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => { void remove(link); }}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  intro: { color: '#4b5563', fontSize: 15 },
  error: { color: '#b91c1c' },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  heading: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cancel: { color: '#1e40af', fontWeight: '700', marginTop: 8 },
  empty: { color: '#4b5563' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 4 },
  kicker: { color: '#6b7280', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 17, fontWeight: '700', color: '#1e40af' },
  detail: { color: '#374151', fontSize: 15 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  action: { color: '#1e40af', fontWeight: '700' },
  remove: { color: '#b91c1c', fontWeight: '700' },
});
