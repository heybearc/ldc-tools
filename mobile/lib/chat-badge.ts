type Listener = (count: number) => void;

const listeners = new Set<Listener>();

export function publishChatUnread(count: number) {
  listeners.forEach((listener) => listener(count));
}

export function subscribeChatUnread(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function unreadTotal(channels: Array<{ unread?: number }>) {
  return channels.reduce((sum, channel) => sum + (channel.unread || 0), 0);
}
