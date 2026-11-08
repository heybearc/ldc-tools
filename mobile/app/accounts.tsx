import { ScrollView, StyleSheet } from 'react-native';
import { AccountList } from '@/components/AccountList';

export default function AccountsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AccountList />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
});
