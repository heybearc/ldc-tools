import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProjectsPane } from '@/components/ProjectsPane';
import { useWideLayout } from '@/lib/useWideLayout';

export default function ProjectsScreen() {
  const wide = useWideLayout();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, wide ? { paddingTop: insets.top } : null]}>
      {wide ? <Text style={styles.heading}>Projects</Text> : null}
      <ProjectsPane />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
