import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useWideLayout } from '@/lib/useWideLayout';

export default function TabLayout() {
  const wide = useWideLayout();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e40af',
        headerShown: !wide,
        tabBarStyle: wide ? { display: 'none' } : undefined,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Work',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'list.bullet', android: 'list', web: 'list' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="available"
        options={{
          title: 'Available',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'tray', android: 'inbox', web: 'inbox' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Directory',
          href: wide ? null : undefined,
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person.2', android: 'group', web: 'group' }} tintColor={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
