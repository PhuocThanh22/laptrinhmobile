import { ReceiptText } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { showMessage } from '@/components/MessageCenter';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { CartButton } from '@/components/CartButton';
import { EmptyState } from '@/components/EmptyState';
import { OrderCardSkeleton } from '@/components/Skeleton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { ORDER_STATUS_LABELS } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getMyOrders, getOrdersBySeller, updateOrderStatus } from '@/services/orderService';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import type { Order, OrderStatus } from '@/types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: Colors.accent,
  confirmed: Colors.info,
  shipping: Colors.primary,
  completed: Colors.success,
  cancelled: Colors.textMuted,
};

const SELLER_ACTIONS: { status: OrderStatus; label: string; next: OrderStatus }[] = [
  { status: 'pending', label: 'Xác nhận', next: 'confirmed' },
  { status: 'confirmed', label: 'Bắt đầu giao', next: 'shipping' },
  { status: 'shipping', label: 'Hoàn thành', next: 'completed' },
];

export default function OrdersTabScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data =
        tab === 'buy' ? await getMyOrders(user.uid) : await getOrdersBySeller(user.uid);
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = (order: Order, status: OrderStatus) => {
    Alert.alert('Cập nhật đơn hàng', `Chuyển trạng thái sang "${ORDER_STATUS_LABELS[status]}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            await updateOrderStatus(order.id, status);
            showMessage({ type: 'success', text1: 'Đã cập nhật trạng thái.' });
            load();
          } catch (e) {
            showMessage({ type: 'error', text1: getErrorMessage(e) });
          }
        },
      },
    ]);
  };

  const handleReceive = (order: Order) => {
    Alert.alert('Đã nhận hàng', 'Xác nhận bạn đã nhận được hàng để hoàn thành đơn?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            await updateOrderStatus(order.id, 'completed');
            showMessage({ type: 'success', text1: 'Đã nhận hàng, đơn hoàn thành.' });
            load();
          } catch (e) {
            showMessage({ type: 'error', text1: getErrorMessage(e) });
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Đơn hàng của tôi</Text>
          <Text style={styles.subtitle}>{orders.length} đơn hàng</Text>
        </View>
        <CartButton size={40} />
      </View>
      <View style={styles.segmentWrap}>
        <Segmented
          options={[
            { key: 'buy', label: 'Đơn tôi mua' },
            { key: 'sell', label: 'Đơn tôi bán' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {loading ? (
        <OrderCardSkeleton rows={3} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <EmptyState
              icon={ReceiptText}
              title="Chưa có đơn hàng"
              message={tab === 'buy' ? 'Bạn chưa đặt đơn hàng nào.' : 'Chưa có ai đặt hàng sản phẩm của bạn.'}
            />
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/orders/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
                <Badge
                  label={ORDER_STATUS_LABELS[item.status] ?? item.status}
                  backgroundColor={STATUS_COLORS[item.status]}
                  small
                />
              </View>
              <Text style={styles.orderDate}>{formatDateTime(item.createdAt)}</Text>

              {item.items.map((it, i) => (
                <View key={`${it.productId}-${i}`} style={styles.item}>
                  <Image source={{ uri: it.image }} style={styles.itemImage} contentFit="cover" />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                    <Text style={styles.itemMeta}>x{it.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>{formatCurrency(it.price * it.quantity)}</Text>
                </View>
              ))}

              <View style={styles.divider} />
              <View style={styles.footer}>
                <View style={styles.footerInfo}>
                  <Text style={styles.receiver}>{item.receiverName} · {item.phone}</Text>
                  <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
                </View>
                <Text style={styles.total}>{formatCurrency(item.totalAmount)}</Text>
              </View>

              {tab === 'buy' && item.status === 'shipping' ? (
                <View style={styles.actions}>
                  <Button title="Đã nhận hàng" onPress={() => handleReceive(item)} />
                </View>
              ) : null}
              {tab === 'sell' && item.status !== 'completed' && item.status !== 'cancelled' ? (
                <View style={styles.actions}>
                  {SELLER_ACTIONS.filter((a) => a.status === item.status).map((a) => (
                    <Button
                      key={a.status}
                      title={a.label}
                      small
                      onPress={() => handleStatusChange(item, a.next)}
                    />
                  ))}
                  <Button
                    title="Huỷ đơn"
                    variant="ghost"
                    small
                    onPress={() => handleStatusChange(item, 'cancelled')}
                  />
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  itemImage: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  itemMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  footerInfo: {
    flex: 1,
  },
  receiver: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  address: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  total: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});