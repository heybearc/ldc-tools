import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { ready, token } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const onLogin = segments[0] === 'login';
    if (!token && !onLogin) router.replace('/login');
    if (token && onLogin) router.replace('/');
  }, [ready, token, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="person" options={{ title: 'Profile', headerBackTitle: 'Directory' }} />
      <Stack.Screen name="work/[id]" options={{ title: 'Work', headerBackTitle: 'Back' }} />
      <Stack.Screen name="processes" options={{ title: 'Processes', headerBackTitle: 'More' }} />
      <Stack.Screen name="trade-teams" options={{ title: 'Trade teams', headerBackTitle: 'More' }} />
      <Stack.Screen name="feedback" options={{ title: 'Feedback', headerBackTitle: 'More' }} />
      <Stack.Screen name="help" options={{ title: 'Help', headerBackTitle: 'More' }} />
      <Stack.Screen name="admin" options={{ title: 'Admin', headerBackTitle: 'More' }} />
      <Stack.Screen name="accounts" options={{ title: 'Accounts', headerBackTitle: 'Admin' }} />
      <Stack.Screen name="project/[id]" options={{ title: 'Project', headerBackTitle: 'Projects' }} />
    </Stack>
  );
}
