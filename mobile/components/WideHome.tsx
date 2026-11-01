import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DirectoryPane } from './DirectoryPane';
import { MyWorkPane } from './MyWorkPane';

export function WideHome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.row, { paddingTop: insets.top }]}>
      <View style={styles.work}>
        <Text style={styles.heading}>My Work</Text>
        <MyWorkPane />
      </View>
      <View style={styles.directory}>
        <Text style={styles.heading}>Directory</Text>
        <DirectoryPane />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', backgroundColor: '#f9fafb' },
  work: { flex: 1, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  directory: { flex: 1.2 },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#f9fafb',
  },
});
