import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { directoryFromHome, emptyDirectoryMessage, peopleForView, SECTIONS, type Section } from '@/lib/directory-view';
import { fetchHome, type Directory, type Team } from '@/lib/home';
import { selectPerson } from '@/lib/selected-person';
import { PersonPhoto } from './PersonPhoto';

const EMPTY_DIRECTORY: Directory = { constructionGroup: [], personnel: [], ancillary: [], teams: [] };

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function DirectoryPane() {
  const { apiBase, token, signOut } = useAuth();
  const router = useRouter();
  const [directory, setDirectory] = useState<Directory>(EMPTY_DIRECTORY);
  const [section, setSection] = useState<Section>('construction');
  const [teamId, setTeamId] = useState('');
  const [crewId, setCrewId] = useState('team');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await fetchHome(apiBase, token);
      const next = directoryFromHome(body);
      setDirectory(next);
      setTeamId((current) => current || next.teams[0]?.id || '');
      setCrewId((current) => {
        if (current !== 'team') return current;
        const team = next.teams[0];
        if (!team || team.people.length > 0 || team.crews.length === 0) return 'team';
        return team.crews[0].id;
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load the directory. Try again in a moment.');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const team = directory.teams.find((item) => item.id === teamId) || directory.teams[0];
  const shown = peopleForView(directory, section, team?.id || '', crewId, query);
  const crewName = crewId === 'team' ? team?.name || '' : team?.crews.find((crew) => crew.id === crewId)?.name || '';

  function chooseTeam(next: Team) {
    setTeamId(next.id);
    setCrewId(next.people.length > 0 || next.crews.length === 0 ? 'team' : next.crews[0].id);
  }

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
      <View style={styles.chips}>
        {SECTIONS.map((item) => (
          <Chip key={item.id} label={item.label} selected={!query.trim() && section === item.id} onPress={() => setSection(item.id)} />
        ))}
      </View>
      {section === 'trades' && !query.trim() && directory.teams.length > 0 ? (
        <View style={styles.chips}>
          {directory.teams.map((item) => (
            <Chip key={item.id} label={item.name} selected={team?.id === item.id} onPress={() => chooseTeam(item)} />
          ))}
        </View>
      ) : null}
      {section === 'trades' && !query.trim() && team ? (
        <View style={styles.chips}>
          {team.people.length > 0 ? (
            <Chip label="Team" selected={crewId === 'team'} onPress={() => setCrewId('team')} />
          ) : null}
          {team.crews.map((crew) => (
            <Chip key={crew.id} label={crew.name} selected={crewId === crew.id} onPress={() => setCrewId(crew.id)} />
          ))}
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {shown.length === 0 && !error ? (
        <Text style={styles.empty}>{emptyDirectoryMessage(section, query, team ? crewName : '')}</Text>
      ) : null}
      {shown.map((person, index) => (
        <Pressable
          key={`${person.id}-${person.role}-${person.place}-${index}`}
          style={styles.card}
          onPress={() => {
            selectPerson(person);
            router.push('/person');
          }}
        >
          <PersonPhoto person={person} apiBase={apiBase} token={token} size={44} />
          <View style={styles.cardText}>
            <Text style={styles.name}>{person.name || person.email}</Text>
            <Text style={styles.meta}>{person.role} · {person.place}</Text>
            {person.email ? <Text style={styles.meta}>{person.email}</Text> : null}
          </View>
        </Pressable>
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
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  chipText: { color: '#1f2937', fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  empty: { color: '#6b7280' },
  error: { color: '#b91c1c' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 12, flexDirection: 'row', alignItems: 'center' },
  cardText: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  meta: { color: '#4b5563', fontSize: 14 },
});
