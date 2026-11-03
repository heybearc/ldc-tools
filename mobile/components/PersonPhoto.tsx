import { Image, StyleSheet, Text, View } from 'react-native';
import type { Person } from '@/lib/home';

export function photoUri(apiBase: string, photo: string | null) {
  if (!photo) return null;
  if (photo.startsWith('data:') || photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  return `${apiBase}${photo.startsWith('/') ? photo : `/${photo}`}`;
}

export function PersonPhoto({
  person,
  apiBase,
  token,
  size,
}: {
  person: Pick<Person, 'name' | 'photo'>;
  apiBase: string;
  token: string | null;
  size: number;
}) {
  const uri = photoUri(apiBase, person.photo);
  const needsAuth = Boolean(uri && token && uri.startsWith(apiBase));
  if (!uri) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.letter, { fontSize: size * 0.38 }]}>{person.name.slice(0, 1).toUpperCase()}</Text>
      </View>
    );
  }
  return (
    <Image
      source={needsAuth ? { uri, headers: { Authorization: `Bearer ${token}` } } : { uri }}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#e5e7eb' }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  letter: { color: '#1e40af', fontWeight: '700' },
});
