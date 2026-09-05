import { House, LayoutGrid, PackagePlus, ReceiptText, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/colors';
import type { LucideIcon } from 'lucide-react-native';
import type { ColorValue } from 'react-native';

function TabIcon({
  icon: Icon,
  color,
  size,
}: {
  icon: LucideIcon;
  color: ColorValue;
  size: number;
}) {
  return <Icon color={String(color)} size={size} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          height: 82,
          paddingBottom: 22,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <TabIcon icon={House} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Danh mục',
          tabBarIcon: ({ color, size }) => <TabIcon icon={LayoutGrid} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Đăng bán',
          tabBarIcon: ({ color, size }) => <TabIcon icon={PackagePlus} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size }) => <TabIcon icon={ReceiptText} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, size }) => <TabIcon icon={User} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}