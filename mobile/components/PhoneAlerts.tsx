import { useEffect } from 'react';
import { AppState } from 'react-native';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { subscribeChatUnread, unreadTotal } from '@/lib/chat-badge';
import { registerPhoneNotifications, setAppBadge } from '@/lib/push';

export function PhoneAlerts({ onUnread }: { onUnread: (count: number) => void }) {
  const { apiBase, token } = useAuth();

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
        if (cancelled) return;
        onUnread(unread);
        await setAppBadge(unread);
      } catch {
        // Keep the last badge when chat cannot be reached.
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
  }, [apiBase, token, onUnread]);

  return null;
}
