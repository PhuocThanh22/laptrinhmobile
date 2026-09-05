import { MessageCircle, ReceiptText } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { showMessage } from '@/components/MessageCenter';

import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { OrderCardSkeleton } from '@/components/Skeleton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { ORDER_STATUS_LABELS } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getMyOrders, getOrdersBySeller, updateOrderStatus } from '@/services/orderService';
import { getOrCreateConversation } from '@/services/chatService';
import { getReviewsForOrders } from '@/services/reviewService';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import type { Order, OrderStatus, PaymentStatus, Review } from '@/types';

import { safeBack } from '@/utils/navigation';
const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  expired: 'Hết hạn',
};
const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  pending: Colors.accent,
  paid: Colors.success,
  failed: Colors.danger,
  expired: Colors.textMuted,
};

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

export default function MyOrdersScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviewedKeys, setReviewedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data =
        tab === 'buy' ? await getMyOrders(user.uid) : await getOrdersBySeller(user.uid);
      setOrders(data);
      if (tab === 'buy' && data.length) {
        const revs = await getReviewsForOrders(data.map((o) => o.id));
        setReviewedKeys(new Set(revs.map((r: Review) => `${r.orderId}_${r.productId}`)));
      } else {
        setReviewedKeys(new Set());
      }
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
      <AppHeader title="Đơn hàng của tôi" onBack={safeBack} />
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
              <View style={styles.badgeRow}>
                <Badge
                  label={`${item.paymentMethod === 'vietqr' ? 'VietQR' : 'COD'} · ${PAYMENT_LABELS[(item.paymentStatus as PaymentStatus) ?? 'paid'] ?? item.paymentStatus}`}
                  backgroundColor={PAYMENT_COLORS[(item.paymentStatus as PaymentStatus) ?? 'paid'] ?? Colors.textMuted}
                  small
                />
                {item.paymentMethod === 'vietqr' && item.paymentStatus === 'pending' && tab === 'buy' ? (
                  <Pressable onPress={() => router.push(`/orders/payment?orderId=${item.id}`)} style={styles.payLink}>
                    <Text style={styles.payLinkText}>Thanh toán ngay</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.orderDate}>{formatDateTime(item.createdAt)}</Text>

              {item.items.map((it, i) => {
                const key = `${item.id}_${it.productId}`;
                const already = reviewedKeys.has(key);
                const canReview = tab === 'buy' && item.status === 'completed' && !already;
return (
                  <View
                    key={`${it.productId}-${i}`}
                    style={styles.item}>
                    <Image source={{ uri: it.image }} style={styles.itemImage} contentFit="cover" />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                      <Text style={styles.itemMeta}>x{it.quantity}</Text>
                      {already ? <Text style={styles.reviewedLabel}>Đã đánh giá</Text> : null}
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemPrice}>{formatCurrency(it.price * it.quantity)}</Text>
                      {canReview ? (
                        <Pressable
                          onPress={() => router.push(`/orders/review?orderId=${item.id}&productId=${it.productId}`)}
                          style={styles.reviewBtn}>
                          <Text style={styles.reviewBtnText}>Đánh giá</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}

              <View style={styles.divider} />
              <View style={styles.footer}>
                <View>
                  <Text style={styles.receiver}>{item.receiverName} · {item.phone}</Text>
                  <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
                </View>
                <Text style={styles.total}>{formatCurrency(item.totalAmount)}</Text>
              </View>

              <View style={styles.actions}>
                {/* Nhắn tin với đối phương */}
                <Button
                  title="Nhắn tin"
                  variant="outline"
                  small
                  icon={MessageCircle}
                  onPress={async () => {
                    if (!user) return;
                    try {
                      const otherId = tab === 'buy' ? item.sellerIds[0] : item.buyerId;
                      if (!otherId || otherId === user.uid) {
                        showMessage({ type: 'error', text1: 'Không thể nhắn với chính mình.' });
                        return;
                      }
                      const convId = await getOrCreateConversation({
                        currentUserId: user.uid,
                        otherUserId: otherId,
                        productId: item.items[0]?.productId ?? null,
                        productName: item.items[0]?.name ?? null,
                        productImage: item.items[0]?.image ?? null,
                      });
                      router.push(`/chat/${convId}`);
                    } catch (e) {
                      showMessage({ type: 'error', text1: getErrorMessage(e) });
                    }
                  }}
                />
{tab === 'buy' && item.status === 'shipping' ? (
                  <Button title="Đã nhận hàng" onPress={() => handleReceive(item)} />
                ) : null}
                {tab === 'sell' && item.status !== 'completed' && item.status !== 'cancelled'
                  ? SELLER_ACTIONS.filter((a) => a.status === item.status).map((a) => (
                      <Button key={a.status} title={a.label} small onPress={() => handleStatusChange(item, a.next)} />
                    ))
                  : null}
{tab === 'sell' && item.status !== 'completed' && item.status !== 'cancelled' ? (
                  <Button title="Huỷ đơn" variant="ghost" small onPress={() => handleStatusChange(item, 'cancelled')} />
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  payLink: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  payLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  orderDate: {
    fontSize: 10,
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
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  itemMeta: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  reviewedLabel: { fontSize: 10, color: Colors.success, marginTop: 2 },
  reviewBtn: { backgroundColor: Colors.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: Colors.accent },
  reviewBtnText: { fontSize: 10, fontWeight: '700', color: Colors.text },
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
  receiver: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  address: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    maxWidth: 220,
  },
  total: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});