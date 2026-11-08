import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/lib/auth';
import { PRIVACY_URL, SUPPORT_URL } from '@/lib/support';
import { useWideLayout } from '@/lib/useWideLayout';

export default function LoginScreen() {
  const { apiBase, signIn } = useAuth();
  const wide = useWideLayout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, wide && styles.wideContent]} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Image source={require('../assets/images/icon.png')} style={styles.logo} accessibilityLabel="LDC Tools" />
          <Text style={styles.kicker}>LDC Tools</Text>
          <Text style={styles.tagline}>Work, projects, and directory for your construction group</Text>
        </View>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.help}>
          This app is invite-only. Sign in with the email and password your construction group gave you.
          Downloading the app does not create an account.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          testID="sign-in-email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          testID="sign-in-password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable testID="sign-in-submit" onPress={submit} disabled={busy || !apiBase.trim() || !email.trim() || !password} style={styles.button}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
        </Pressable>

        <View style={styles.links}>
          <Pressable onPress={() => void Linking.openURL(SUPPORT_URL)}>
            <Text style={styles.link}>Request access</Text>
          </Pressable>
          <Pressable onPress={() => void Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.link}>Privacy policy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 24, paddingTop: 48, gap: 8 },
  wideContent: { maxWidth: 480, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', gap: 8, marginBottom: 12 },
  logo: { width: 96, height: 96, borderRadius: 22 },
  kicker: { color: '#1e3a8a', fontWeight: '800', fontSize: 22, letterSpacing: 0.3 },
  tagline: { color: '#4b5563', textAlign: 'center', lineHeight: 20 },
  title: { fontSize: 32, fontWeight: '700', color: '#111827', marginBottom: 8 },
  help: { color: '#4b5563', marginBottom: 8, lineHeight: 20 },
  links: { marginTop: 16, gap: 4 },
  link: { color: '#1e40af', fontWeight: '600', paddingVertical: 8 },
  label: { color: '#374151', fontWeight: '600', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { color: '#b91c1c', marginTop: 8 },
  button: {
    marginTop: 20,
    backgroundColor: '#1e40af',
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
