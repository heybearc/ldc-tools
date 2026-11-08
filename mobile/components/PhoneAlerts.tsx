import { useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { registerPhoneNotifications, setAppBadge } from '@/lib/push';

export function PhoneAlerts({ onUnread }: { onUnread: (count: number) => void }) {
  const { apiBase, token } = useAuth();

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function refresh() {
      if (!token) return;
      try {
        await registerPhoneNotifications(apiBase, token);
        const body = await apiRequest<{ channels?: Array<{ unread?: number }> }>(apiBase, '/api/v1/mobile/chat', {
          token,
          action: 'Could not load chat',
        });
        const unread = (body.channels || []).reduce((sum, channel) => sum + (channel.unread || 0), 0);
        if (cancelled) return;
        onUnread(unread);
        await setAppBadge(unread);
      } catch {
        if (!cancelled) onUnread(0);
      }
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [apiBase, token, onUnread]);

  return null;
}
