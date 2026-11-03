import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import type { Person } from '@/lib/home';
import { loadSelectedPerson, selectedPerson } from '@/lib/selected-person';
import { PersonPhoto } from '@/components/PersonPhoto';

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.action}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

export default function PersonScreen() {
  const { apiBase, token } = useAuth();
  const [person, setPerson] = useState<Person | null>(selectedPerson());
  const [ready, setReady] = useState(selectedPerson() !== null);

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

  if (!ready) {
    return <View style={styles.emptyWrap} />;
  }

  if (!person) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.empty}>Choose a person from the directory.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <PersonPhoto person={person} apiBase={apiBase} token={token} size={96} />
      <Text style={styles.name}>{person.name || person.email}</Text>
      <Text style={styles.meta}>{person.role} · {person.place}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 12, alignItems: 'flex-start', backgroundColor: '#f9fafb', flexGrow: 1 },
  emptyWrap: { flex: 1, padding: 24, backgroundColor: '#f9fafb' },
  name: { fontSize: 28, fontWeight: '700', color: '#111827' },
  meta: { color: '#4b5563', fontSize: 16 },
  phone: { color: '#374151', fontSize: 16 },
  empty: { color: '#6b7280' },
  row: { flexDirection: 'row', gap: 8 },
  action: {
    backgroundColor: '#1e40af',
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
