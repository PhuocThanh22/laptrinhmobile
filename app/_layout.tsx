import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';

import { LoadingFullScreen } from '@/components/Loading';
import { MessageCenter } from '@/components/MessageCenter';
import { Colors } from '@/constants/colors';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Expo Go SDK 53+ đã gỡ remote push — warning này chỉ spam log, đã tự tắt push khi chạy Expo Go
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { user, emailVerified, initializing } = useAuth();
  usePushNotifications();

  if (initializing) return <LoadingFullScreen />;

  const loggedIn = !!user;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Protected guard={loggedIn && emailVerified}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="product/search" />
        <Stack.Screen name="product/edit/[id]" />
        <Stack.Screen name="orders/checkout" />
        <Stack.Screen name="orders/payment" />
        <Stack.Screen name="orders/review" />
        <Stack.Screen name="orders/success" />
        <Stack.Screen name="orders/my-orders" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="chat/index" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="profile/my-products" />
        <Stack.Screen name="profile/my-bids" />
        <Stack.Screen name="profile/account" />
      </Stack.Protected>

      <Stack.Protected guard={!loggedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={loggedIn && !emailVerified}>
        <Stack.Screen name="verify-email" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootNavigator />
        <StatusBar style="dark" />
        <MessageCenter />
      </CartProvider>
    </AuthProvider>
  );
}