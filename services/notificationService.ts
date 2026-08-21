/**
 * Local push notification - chỉ dùng trên dev build, tự tắt trên Expo Go / web.
 * Warning của expo-notifications trên Expo Go SDK 53 đã được LogBox.ignoreLogs ở _layout.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

// lazy import để không trigger warning khi chạy Expo Go (warn phát ra lúc import)
let Notifications: typeof import('expo-notifications') | null = null;
async function getNotifications() {
  if (Notifications) return Notifications;
  if (isExpoGo() || Platform.OS === 'web') return null;
  try {
    Notifications = await import('expo-notifications');
    return Notifications;
  } catch {
    return null;
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web' || isExpoGo()) return false;
  const N = await getNotifications();
  if (!N) return false;
  const settings = (await N.getPermissionsAsync()) as unknown as {
    granted?: boolean;
    status?: string;
    ios?: { status: number };
  };
  const granted = settings.granted ?? settings.status === 'granted';
  if (granted || settings.ios?.status === N.IosAuthorizationStatus.PROVISIONAL) return true;
  const req = (await N.requestPermissionsAsync()) as unknown as { granted?: boolean; status?: string };
  return (req.granted ?? req.status === 'granted') as boolean;
}

export async function setupNotificationChannel() {
  if (Platform.OS === 'android' && !isExpoGo()) {
    try {
      const N = await getNotifications();
      if (!N) return;
      await N.setNotificationChannelAsync('default', {
        name: 'MiniShop',
        importance: N.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
      });
    } catch {
      // Expo Go SDK 53+ không hỗ trợ channel — bỏ qua
    }
  }
}

export async function sendLocalNotification(title: string, body: string, data?: Record<string, unknown>) {
  if (Platform.OS === 'web' || isExpoGo()) return;
  try {
    const N = await getNotifications();
    if (!N) return;
    const hasPerm = await ensureNotificationPermission();
    if (!hasPerm) return;
    await N.scheduleNotificationAsync({
      content: { title, body, data, sound: 'default' },
      trigger: null,
    });
  } catch {
    // Expo Go hạn chế — fallback im lặng
  }
}

// cấu hình handler: khi app foreground vẫn hiện notification
export async function configureNotificationHandler() {
  if (isExpoGo() || Platform.OS === 'web') return;
  try {
    const N = await getNotifications();
    if (!N) return;
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Expo Go không hỗ trợ — bỏ qua
  }
}
