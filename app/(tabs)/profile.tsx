import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getProductsBySeller } from '@/services/productService';
import { getMyOrders } from '@/services/orderService';
import { getMyBids } from '@/services/auctionService';

interface MenuItem {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  href: string;
}

const MENU: MenuItem[] = [
  { key: 'products', label: 'Sản phẩm của tôi', icon: 'inventory-2', href: '/profile/my-products' },
  { key: 'orders', label: 'Đơn hàng của tôi', icon: 'receipt-long', href: '/orders/my-orders' },
  { key: 'bids', label: 'Phiếu đấu giá của tôi', icon: 'gavel', href: '/profile/my-bids' },
  { key: 'account', label: 'Thông tin tài khoản', icon: 'account-circle', href: '/profile/account' },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, bids: 0 });

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const [products, orders, bids] = await Promise.all([
        getProductsBySeller(user.uid),
        getMyOrders(user.uid),
        getMyBids(user.uid),
      ]);
      setStats({ products: products.length, orders: orders.length, bids: bids.length });
    } catch {
      // Không cấu hình Firebase thì bỏ qua
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleLogout = async () => {
    try {
      await signOut();
      Toast.show({ type: 'success', text1: 'Đã đăng xuất' });
    } catch (e) {
      Toast.show({ type: 'error', text1: e instanceof Error ? e.message : 'Đăng xuất thất bại' });
    }
  };

  const statsItems = [
    { label: 'Sản phẩm', value: stats.products },
    { label: 'Đơn hàng', value: stats.orders },
    { label: 'Đấu giá', value: stats.bids },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar name={user?.name} uri={user?.avatar} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name ?? 'Người dùng'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {statsItems.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              onPress={() => router.push(item.href as never)}>
              <View style={styles.menuIcon}>
                <MaterialIcons name={item.icon} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
          onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color={Colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>

        <Text style={styles.version}>MiniShop v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    margin: 16,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
  },
  email: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  menu: {
    margin: 16,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  pressed: {
    opacity: 0.7,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    backgroundColor: Colors.dangerSoft,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
  },
  version: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 24,
    marginBottom: 16,
  },
});