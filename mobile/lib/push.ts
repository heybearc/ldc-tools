import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { apiRequest } from './api';
import { workAlertPath } from './work-alert';

const PROJECT_ID = '0f13d876-0af3-470b-ae8d-5a4592ecd75a';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPhoneNotifications(apiBase: string, token: string) {
  if (!Device.isDevice) return null;
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  if (!permission.granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'LDC Tools',
      importance: Notifications.AndroidImportance.HIGH,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
    });
  }

  const expo = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
  await apiRequest(apiBase, '/api/v1/mobile/push', {
    method: 'POST',
    token,
    body: { token: expo.data },
    action: 'Could not turn on phone notifications',
  });
  return expo.data;
}

const WORK_ALERT_KEY = 'ldc-work-alert';
const openedWorkAlerts = new Set<string>();

export function watchWorkAlerts(open: (path: string) => void) {
  let active = true;
  async function follow(response: Notifications.NotificationResponse | null) {
    if (!active || !response) return;
    const path = workAlertPath(response.notification.request.content.data);
    if (!path) return;
    const id = response.notification.request.identifier;
    if (openedWorkAlerts.has(id)) return;
    openedWorkAlerts.add(id);
    const seen = await SecureStore.getItemAsync(WORK_ALERT_KEY).catch(() => null);
    if (seen === id) return;
    await SecureStore.setItemAsync(WORK_ALERT_KEY, id).catch(() => undefined);
    open(path);
  }
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    void follow(response);
  });
  void Notifications.getLastNotificationResponseAsync().then((response) => follow(response)).catch(() => undefined);
  return () => {
    active = false;
    subscription.remove();
  };
}

export async function setAppBadge(count: number) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // This device does not show an app icon badge.
  }
}
