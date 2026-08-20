import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import { LoadingFullScreen } from '@/components/Loading';
import { Colors } from '@/constants/colors';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { user, emailVerified, initializing } = useAuth();

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
        <Stack.Screen name="orders/success" />
        <Stack.Screen name="orders/my-orders" />
        <Stack.Screen name="cart" />
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
        <Toast />
      </CartProvider>
    </AuthProvider>
  );
}