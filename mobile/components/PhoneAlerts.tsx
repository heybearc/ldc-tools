import { useEffect } from 'react';
import { AppState } from 'react-native';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { subscribeChatUnread, unreadTotal } from '@/lib/chat-badge';
import { registerPhoneNotifications, setAppBadge, watchWorkAlerts } from '@/lib/push';
import { useRouter } from 'expo-router';

export function PhoneAlerts({
  onUnread,
  onAvailable,
}: {
  onUnread: (count: number) => void;
  onAvailable: (count: number) => void;
}) {
  const { apiBase, token } = useAuth();
  const router = useRouter();

  useEffect(() => watchWorkAlerts((path) => router.push(path)), [router]);

  useEffect(() => {
    return subscribeChatUnread((count) => {
      onUnread(count);
      void setAppBadge(count);
    });
  }, [onUnread]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void registerPhoneNotifications(apiBase, token);
    async function refresh() {
      if (!token) return;
      try {
        const body = await apiRequest<{ channels?: Array<{ unread?: number }> }>(apiBase, '/api/v1/mobile/chat', {
          token,
          action: 'Could not load chat',
        });
        const unread = unreadTotal(body.channels || []);
        if (!cancelled) {
          onUnread(unread);
          await setAppBadge(unread);
        }
      } catch {
        // Keep the last badge when chat cannot be reached.
      }
      try {
        const available = await apiRequest<{ count?: number }>(apiBase, '/api/v1/mobile/work/available-count', {
          token,
          action: 'Could not load available work',
        });
        if (!cancelled) onAvailable(typeof available.count === 'number' ? available.count : 0);
      } catch {
        // Keep the last available count.
      }
    }
    void refresh();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, 15000);
    return () => {
      cancelled = true;
      subscription.remove();
      clearInterval(timer);
    };
  }, [apiBase, token, onUnread, onAvailable]);

  return null;
}
