import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Choice } from '@/components/fields';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type UserRow = { id: string; name: string | null; email: string; role: string; status: string };

const ROLES = ['ADMIN', 'USER', 'READ_ONLY'];

export function AccountList() {
  const { apiBase, token, signOut } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const body = await apiRequest<{ users: UserRow[] }>(apiBase, '/api/v1/mobile/admin', {
        token,
        action: 'Could not load accounts',
      });
      setUsers(body.users || []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load accounts');
    }
  }, [apiBase, token, signOut]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function setRole(userId: string, role: string) {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, '/api/v1/mobile/admin', {
        method: 'POST',
        token,
        body: { action: 'role', userId, role },
        action: 'Could not change the role',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the role');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.list}>
      <Text style={styles.detail}>Personnel, admins, and people an admin invited. Directory contacts stay in the directory.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {users.length === 0 && !error ? <Text style={styles.detail}>No sign-in accounts yet.</Text> : null}
      {users.map((user) => (
        <View key={user.id} style={styles.card}>
          <Text style={styles.title}>{user.name || user.email}</Text>
          <Text style={styles.detail}>{user.email} · {user.status === 'ACTIVE' ? 'Active' : user.status === 'INVITED' ? 'Invited' : user.status}</Text>
          <View style={styles.row}>
            {ROLES.map((role) => (
              <Choice
                key={role}
                label={role === 'READ_ONLY' ? 'Read only' : role === 'ADMIN' ? 'Admin' : 'User'}
                selected={user.role === role}
                onPress={() => void setRole(user.id, role)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  detail: { color: '#374151' },
  error: { color: '#b91c1c' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
