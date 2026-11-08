import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Person } from '@/lib/home';
import { loadSelectedPerson, selectedPerson } from '@/lib/selected-person';
import { PersonPhoto } from '@/components/PersonPhoto';
import { Choice, Field, PrimaryButton } from '@/components/fields';

const CREW_ROLES = [
  { value: 'TCO', label: 'Overseer' },
  { value: 'TCOA', label: 'Assistant' },
  { value: 'TC_SUPPORT', label: 'Support' },
];
const TEAM_ROLES = [
  { value: 'TTO', label: 'Overseer' },
  { value: 'TTOA', label: 'Assistant' },
  { value: 'TT_SUPPORT', label: 'Support' },
];

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.action}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

export default function PersonScreen() {
  const { apiBase, token, signOut } = useAuth();
  const [person, setPerson] = useState<Person | null>(selectedPerson());
  const [ready, setReady] = useState(selectedPerson() !== null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void loadSelectedPerson().then((loaded) => {
      if (cancelled) return;
      setPerson(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function beginEdit() {
    if (!person) return;
    const name = splitName(person.name);
    setFirstName(name.firstName);
    setLastName(name.lastName);
    setEmail(person.email);
    setPhone(person.phone || '');
    setImage(person.photo);
    setRole(person.roleCode || '');
    setError('');
    setEditing(true);
  }

  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access', 'Allow photo library access to replace this picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.4,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;
    const next = `data:image/jpeg;base64,${asset.base64}`;
    if (next.length > 400_000) {
      setError('That photo is too large. Choose a smaller one.');
      return;
    }
    setImage(next);
    setError('');
  }

  async function save() {
    if (!token || !person || busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(apiBase, '/api/v1/mobile/directory/entry', {
        method: 'PATCH',
        token,
        action: 'Could not save this person',
        body: {
          userId: person.id,
          assignmentId: person.assignmentId,
          scope: person.crewId ? 'crew' : person.teamId ? 'team' : undefined,
          firstName,
          lastName,
          email,
          phone,
          image,
          role: role || undefined,
        },
      });
      setPerson({
        ...person,
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone: phone || null,
        photo: image,
        roleCode: role || person.roleCode,
      });
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not save this person');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <View style={styles.emptyWrap} />;

  if (!person) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.empty}>Choose a person from the directory.</Text>
      </View>
    );
  }

  const roles = person.crewId ? CREW_ROLES : person.teamId ? TEAM_ROLES : [];
  const shown = editing
    ? { ...person, name: `${firstName} ${lastName}`.trim() || person.name, photo: image }
    : person;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PersonPhoto person={shown} apiBase={apiBase} token={token} size={96} />
      {editing ? (
        <View style={styles.form}>
          <Field label="First name" value={firstName} onChangeText={setFirstName} />
          <Field label="Last name" value={lastName} onChangeText={setLastName} />
          <Field label="Email" value={email} onChangeText={setEmail} />
          <Field label="Phone" value={phone} onChangeText={setPhone} />
          {roles.length > 0 ? (
            <View style={styles.roles}>
              {roles.map((item) => (
                <Choice key={item.value} label={item.label} selected={role === item.value} onPress={() => setRole(item.value)} />
              ))}
            </View>
          ) : null}
          <PrimaryButton label="Replace photo" onPress={() => void choosePhoto()} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label={busy ? 'Saving…' : 'Save'} onPress={() => void save()} disabled={busy} />
          <Pressable onPress={() => setEditing(false)} style={styles.action}>
            <Text style={styles.actionText}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.name}>{person.name || person.email}</Text>
          <Text style={styles.meta}>{person.role} · {person.place}</Text>
          <PrimaryButton label="Edit" onPress={beginEdit} />
          {person.email ? (
            <Action label={person.email} onPress={() => void Linking.openURL(`mailto:${person.email}`)} />
          ) : (
            <Text style={styles.empty}>No email is listed.</Text>
          )}
          {person.phone ? (
            <View style={styles.row}>
              <Action label="Call" onPress={() => void Linking.openURL(`tel:${person.phone}`)} />
              <Action label="Text" onPress={() => void Linking.openURL(`sms:${person.phone}`)} />
            </View>
          ) : (
            <Text style={styles.empty}>No phone number is listed.</Text>
          )}
          {person.phone ? <Text style={styles.phone}>{person.phone}</Text> : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 12, alignItems: 'flex-start', backgroundColor: '#f9fafb', flexGrow: 1 },
  form: { alignSelf: 'stretch', gap: 12 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emptyWrap: { flex: 1, padding: 24, backgroundColor: '#f9fafb' },
  name: { fontSize: 28, fontWeight: '700', color: '#111827' },
  meta: { color: '#4b5563', fontSize: 16 },
  phone: { color: '#374151', fontSize: 16 },
  empty: { color: '#6b7280' },
  error: { color: '#b91c1c' },
  row: { flexDirection: 'row', gap: 8 },
  action: {
    backgroundColor: '#1e40af',
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: '#fff', fontWeight: '700' },
});
