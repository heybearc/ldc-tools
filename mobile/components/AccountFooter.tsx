import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PRIVACY_URL, SUPPORT_URL } from '@/lib/support';

export function AccountFooter() {
  const { apiBase, token, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function deleteAccount() {
    Alert.alert(
      'Delete account?',
      'This turns off your sign-in and removes your password. Your construction group keeps the crew records it already has. You would need a new invite to use the app again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            void confirmDelete();
          },
        },
      ],
    );
  }

  async function confirmDelete() {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, '/api/v1/auth/mobile/delete-account', {
        method: 'POST',
        token,
        action: 'Could not delete the account',
      });
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the account. Try again in a moment.');
      setBusy(false);
    }
  }

  return (
    <View style={styles.box}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={() => void Linking.openURL(PRIVACY_URL)} style={styles.row}>
        <Text style={styles.link}>Privacy policy</Text>
      </Pressable>
      <Pressable onPress={() => void Linking.openURL(SUPPORT_URL)} style={styles.row}>
        <Text style={styles.link}>Support</Text>
      </Pressable>
      <Pressable onPress={deleteAccount} disabled={busy} style={styles.row}>
        <Text style={styles.delete}>{busy ? 'Deleting account…' : 'Delete account'}</Text>
      </Pressable>
      <Pressable onPress={() => void signOut()} style={styles.row}>
        <Text style={styles.link}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 12, gap: 4 },
  row: { minHeight: 44, justifyContent: 'center' },
  link: { color: '#1e40af', fontWeight: '600' },
  delete: { color: '#b91c1c', fontWeight: '600' },
  error: { color: '#b91c1c' },
});
