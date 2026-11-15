import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Section = { heading: string; paragraphs: string[] };
type Article = { id: string; title: string; summary: string; sections: Section[] };

const ARTICLES: Article[] = [
  {
    id: 'my-work',
    title: 'My Work',
    summary: 'Tasks assigned to you',
    sections: [
      {
        heading: 'What is on My Work',
        paragraphs: [
          'My Work lists open tasks assigned to you in this construction group. It does not list someone else’s tasks or another group’s work.',
          'Each task shows when it was published, the timing, and how many steps are done.',
        ],
      },
      {
        heading: 'Open a task',
        paragraphs: [
          'Tap a task to see its steps and notes. Check off a step as you finish it. Mark the whole task Done when the work is finished.',
          'Return it to the pool when you cannot get to it. It becomes claimable again on Available.',
        ],
      },
    ],
  },
  {
    id: 'available',
    title: 'Available work',
    summary: 'Tasks you can claim',
    sections: [
      {
        heading: 'Claim a task',
        paragraphs: [
          'Available lists claimable work that no one has taken. Claim assigns that task to you and moves it to My Work.',
          'A published process can appear here as one claimable item. Its tasks stay inside that item.',
        ],
      },
    ],
  },
  {
    id: 'processes',
    title: 'Processes',
    summary: 'Reusable checklists',
    sections: [
      {
        heading: 'Draft and published',
        paragraphs: [
          'A process is a template of tasks. Personnel can add one from Processes. It stays a draft until you publish it.',
          'A published process shows the date it was published. The list can be sorted newest or oldest by that date.',
          'Saving an edit does not publish or unpublish it. Work already started keeps the tasks it copied.',
        ],
      },
      {
        heading: 'Start one',
        paragraphs: [
          'Standalone work is not tied to a project. Project work asks for the project when you start it.',
          'Starting a published process puts one work item on the list. Finishing that item marks the whole process done.',
        ],
      },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    summary: 'Dates and who is assigned',
    sections: [
      {
        heading: 'What you can see',
        paragraphs: [
          'Projects shows this construction group’s projects, their dates, and the personnel assigned to them.',
          'A project process is started from Processes after you choose the project.',
        ],
      },
    ],
  },
  {
    id: 'directory',
    title: 'Directory',
    summary: 'People, phones, and photos',
    sections: [
      {
        heading: 'Find a person',
        paragraphs: [
          'Directory starts with the construction group, Personnel, ancillary people, or a trade team. Open a crew under a team to see who serves there.',
          'Open a person for the photo, email, and phone. A trade or crew contact is not a sign-in account.',
        ],
      },
      {
        heading: 'Replace a photo',
        paragraphs: [
          'Edit the person and choose a new photo, then save. Saving a photo, name, or phone does not change their role.',
          'A crew can have one overseer. If that crew already has an overseer on record, you can still replace the photo as long as you leave the role and crew as they are.',
        ],
      },
    ],
  },
  {
    id: 'chat',
    title: 'Chat',
    summary: 'Messages in this group',
    sections: [
      {
        heading: 'Conversations',
        paragraphs: [
          'Chat opens on the list. A number on a conversation is how many messages you have not opened. All chats returns to that list.',
          'New chat searches or lists the Personnel team so you can start a direct conversation.',
        ],
      },
    ],
  },
  {
    id: 'alerts',
    title: 'Alerts',
    summary: 'Chat and announcements',
    sections: [
      {
        heading: 'Allow alerts',
        paragraphs: [
          'Allow alerts when the phone asks. The app can show an alert, a badge, and a sound for a chat message or an announcement.',
          'If alerts stay off, open the phone’s settings for LDC Tools and allow notifications.',
        ],
      },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback',
    summary: 'Report a problem',
    sections: [
      {
        heading: 'Send feedback',
        paragraphs: [
          'Use Feedback to report a bug or ask for a change. Include what you were doing and what you expected.',
          'You can read replies on the website under My Feedback. The item number, such as FB-016, is on that page.',
        ],
      },
    ],
  },
  {
    id: 'admin',
    title: 'Admin',
    summary: 'Accounts, announcements, and feedback',
    sections: [
      {
        heading: 'Accounts',
        paragraphs: [
          'Admin lists sign-in accounts for this construction group. The blue role button is the access that person has now: Admin, User, or Read only.',
          'A super admin is shown as Admin. Tap a different role only when you mean to change their access.',
        ],
      },
      {
        heading: 'Open feedback',
        paragraphs: [
          'Each open item shows its number and status. In progress is blue when that is the current status.',
          'To resolve an item, write a resolution note on that item, then tap Resolved. It leaves the open list.',
        ],
      },
    ],
  },
];

export default function HelpScreen() {
  const [articleId, setArticleId] = useState<string | null>(null);
  const article = ARTICLES.find((item) => item.id === articleId) || null;

  return (
    <ScrollView testID="screen-help" style={styles.screen} contentContainerStyle={styles.content}>
      {article ? (
        <View style={styles.article}>
          <Pressable onPress={() => setArticleId(null)} style={styles.back}>
            <Text style={styles.backText}>Help</Text>
          </Pressable>
          <Text style={styles.articleTitle}>{article.title}</Text>
          {article.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.heading}>{section.heading}</Text>
              {section.paragraphs.map((paragraph) => (
                <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.index}>
          <Text style={styles.intro}>Choose a topic.</Text>
          {ARTICLES.map((item) => (
            <Pressable key={item.id} onPress={() => setArticleId(item.id)} style={styles.topic}>
              <View style={styles.topicText}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.summary}>{item.summary}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  index: { gap: 8 },
  intro: { color: '#374151', fontSize: 15, lineHeight: 22, marginBottom: 4 },
  topic: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topicText: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  summary: { color: '#6b7280', fontSize: 14 },
  chevron: { color: '#9ca3af', fontSize: 22, fontWeight: '600' },
  article: { gap: 16 },
  back: { alignSelf: 'flex-start' },
  backText: { color: '#1e40af', fontSize: 16, fontWeight: '600' },
  articleTitle: { fontSize: 28, fontWeight: '700', color: '#111827' },
  section: { gap: 8 },
  heading: { fontSize: 18, fontWeight: '700', color: '#111827' },
  paragraph: { color: '#374151', fontSize: 16, lineHeight: 24 },
});
