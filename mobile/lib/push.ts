import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiRequest } from './api';

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

export async function setAppBadge(count: number) {
  await Notifications.setBadgeCountAsync(count);
}
