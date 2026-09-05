import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/Badge';
import { OrderCardSkeleton } from '@/components/Skeleton';
import { Screen } from '@/components/Screen';
import { ORDER_STATUS_LABELS } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { getOrderById } from '@/services/orderService';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { safeBack } from '@/utils/navigation';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: Colors.accent,
  confirmed: Colors.info,
  shipping: Colors.primary,
  completed: Colors.success,
  cancelled: Colors.textMuted,
};

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

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setOrder(await getOrderById(id));
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Chi tiết đơn hàng" onBack={safeBack} />
        <OrderCardSkeleton rows={1} />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <AppHeader title="Chi tiết đơn hàng" onBack={safeBack} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Không tìm thấy đơn hàng.</Text>
        </View>
      </Screen>
    );
  }

  const totalQuantity = order.items.reduce((sum, it) => sum + it.quantity, 0);
  const payLabel = `${order.paymentMethod === 'vietqr' ? 'VietQR' : 'COD'} · ${PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}`;

  return (
    <Screen>
      <AppHeader title="Chi tiết đơn hàng" onBack={safeBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
              <Text style={styles.orderDate}>{formatDateTime(order.createdAt)}</Text>
            </View>
            <Badge
              label={ORDER_STATUS_LABELS[order.status] ?? order.status}
              backgroundColor={STATUS_COLORS[order.status]}
            />
          </View>
          <View style={styles.badgeRow}>
            <Badge label={payLabel} backgroundColor={PAYMENT_COLORS[order.paymentStatus] ?? Colors.textMuted} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Sản phẩm đã mua</Text>
        <View style={styles.card}>
          {order.items.map((it, i) => (
            <View key={`${it.productId}-${i}`} style={[styles.item, i < order.items.length - 1 && styles.itemBorder]}>
              <Image source={{ uri: it.image }} style={styles.itemImage} contentFit="cover" />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{it.name}</Text>
                <Text style={styles.itemUnit}>
                  {formatCurrency(it.price)} x {it.quantity}
                </Text>
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(it.price * it.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng ({totalQuantity} sản phẩm)</Text>
            <Text style={styles.totalAmount}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Thông tin nhận hàng</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Người nhận</Text>
            <Text style={styles.infoValue}>{order.receiverName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            <Text style={styles.infoValue}>{order.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ</Text>
            <Text style={styles.infoValue}>{order.address}</Text>
          </View>
          {order.note ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chú</Text>
              <Text style={styles.infoValue}>{order.note}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Thanh toán</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phương thức</Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod === 'vietqr' ? 'Chuyển khoản VietQR' : 'Thanh toán khi nhận hàng (COD)'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái</Text>
            <Text style={styles.infoValue}>{PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}</Text>
          </View>
          {order.paidAt ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Đã thanh toán lúc</Text>
              <Text style={styles.infoValue}>{formatDateTime(order.paidAt)}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
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
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  orderDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  itemUnit: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    minWidth: 90,
  },
  infoValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});