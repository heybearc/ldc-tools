import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Field, PrimaryButton } from '@/components/fields';

type Team = {
  id: string;
  name: string;
  description: string | null;
  roles: { overseer: number; assistant: number; support: number };
  crews: Array<{ id: string; name: string }>;
};

export default function TradeTeamsScreen() {
  const { apiBase, token, signOut } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [name, setName] = useState('');
  const [crewName, setCrewName] = useState('');
  const [crewTeam, setCrewTeam] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await apiRequest<{ canManage: boolean; teams: Team[] }>(apiBase, '/api/v1/mobile/trade-teams', {
        token,
        action: 'Could not load trade teams',
      });
      setCanManage(body.canManage);
      setTeams(body.teams || []);
      setCrewTeam((current) => current || body.teams?.[0]?.id || '');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load trade teams');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function addTeam() {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, '/api/v1/mobile/trade-teams', {
        method: 'POST',
        token,
        body: { name },
        action: 'Could not add the trade team',
      });
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the trade team');
    } finally {
      setBusy(false);
    }
  }

  async function addCrew() {
    if (!token || busy || !crewTeam) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, `/api/v1/mobile/trade-teams/${crewTeam}/crews`, {
        method: 'POST',
        token,
        body: { name: crewName },
        action: 'Could not add the crew',
      });
      setCrewName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the crew');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView testID="screen-trade-teams" style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {teams.map((team) => (
        <View key={team.id} style={styles.card}>
          <Text style={styles.title}>{team.name}</Text>
          {team.description ? <Text style={styles.detail}>{team.description}</Text> : null}
          <Text style={styles.detail}>
            Overseer {team.roles.overseer} · Assistant {team.roles.assistant} · Support {team.roles.support}
          </Text>
          <Text style={styles.detail}>
            {team.crews.length === 0 ? 'No crews' : team.crews.map((crew) => crew.name).join(', ')}
          </Text>
        </View>
      ))}
      {canManage ? (
        <View style={styles.card}>
          <Text style={styles.title}>Add a trade team</Text>
          <Field label="Name" value={name} onChangeText={setName} />
          <PrimaryButton label={busy ? 'Saving…' : 'Add team'} onPress={() => void addTeam()} disabled={busy} />
          <Text style={styles.title}>Add a crew</Text>
          <Field label="Crew name" value={crewName} onChangeText={setCrewName} />
          <View style={styles.row}>
            {teams.map((team) => (
              <Text
                key={team.id}
                onPress={() => setCrewTeam(team.id)}
                style={[styles.chip, crewTeam === team.id && styles.chipOn]}
              >
                {team.name}
              </Text>
            ))}
          </View>
          <PrimaryButton label="Add crew" onPress={() => void addCrew()} disabled={busy} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  error: { color: '#b91c1c' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  detail: { color: '#374151' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 8, color: '#111827' },
  chipOn: { backgroundColor: '#1e40af', color: '#fff' },
});
