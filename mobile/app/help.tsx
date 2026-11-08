import { ScrollView, StyleSheet, Text, View } from 'react-native';

const GUIDES = [
  {
    title: 'My Work',
    body: 'My Work lists tasks assigned to you. Available is work you can claim. Open a task to check its steps, mark it done, or return it to the pool.',
  },
  {
    title: 'Processes',
    body: 'A process is a template of steps. Start one to put that work on the list. The form to add a process is at the top of Processes.',
  },
  {
    title: 'Projects and trade teams',
    body: 'Projects shows this group’s projects, dates, and personnel. Trade teams lists the crews under each team.',
  },
  {
    title: 'Directory',
    body: 'Directory starts with the construction group, Personnel, ancillary people, or a trade team. Open a person for the photo, email, and phone. A trade or crew contact is not a sign-in account.',
  },
  {
    title: 'Chat',
    body: 'Chat opens on the list. A number on a conversation is how many messages you have not opened. All chats returns to that list. Message one person starts a direct conversation.',
  },
  {
    title: 'Alerts',
    body: 'Allow alerts when the phone asks. The app can show an alert, a badge, and a sound for a chat message or an announcement.',
  },
];

export default function HelpScreen() {
  return (
    <ScrollView testID="screen-help" style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>These guides stay in the app. You do not need to sign in on the website.</Text>
      {GUIDES.map((guide) => (
        <View key={guide.title} style={styles.card}>
          <Text style={styles.title}>{guide.title}</Text>
          <Text style={styles.body}>{guide.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  intro: { color: '#374151', fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 6 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  body: { color: '#374151', fontSize: 15, lineHeight: 22 },
});
