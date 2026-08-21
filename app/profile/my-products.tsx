import { CircleCheck, CircleStop, Package, SquarePen, Timer, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Countdown } from '@/components/Countdown';
import { EmptyState } from '@/components/EmptyState';
import { ListRowSkeleton } from '@/components/Skeleton';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { DEFAULT_PRODUCT_IMAGE } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { endAuction } from '@/services/auctionService';
import { deleteProduct, getProductsBySeller, markProductAsSold } from '@/services/productService';
import { getUsersByIds } from '@/services/userService';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency } from '@/utils/format';
import { isAuctionActive } from '@/utils/auction';
import type { Product } from '@/types';

import { safeBack } from '@/utils/navigation';
function statusBadge(p: Product) {
  switch (p.status) {
    case 'active':
      return <Badge label="Đang bán" backgroundColor={Colors.success} small />;
    case 'sold':
      return <Badge label="Đã bán" backgroundColor={Colors.textMuted} small />;
    case 'auction_active':
      return <Badge label="Đang đấu giá" backgroundColor={Colors.accent} small />;
    case 'auction_ended':
      return <Badge label="Đã kết thúc" backgroundColor={Colors.info} small />;
    default:
      return null;
  }
}

export default function MyProductsScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [winnerNames, setWinnerNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getProductsBySeller(user.uid);
      setProducts(data);

      const winnerIds = data
        .filter((p) => p.saleType === 'auction' && p.winnerId)
        .map((p) => p.winnerId!)
        .filter(Boolean);
      if (winnerIds.length) {
        const users = await getUsersByIds(winnerIds);
        setWinnerNames(Object.fromEntries(Object.entries(users).map(([k, v]) => [k, v.name])));
      } else {
        setWinnerNames({});
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmAction = (title: string, message: string, onConfirm: () => Promise<void>) => {
    Alert.alert(title, message, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            await onConfirm();
            Toast.show({ type: 'success', text1: 'Đã cập nhật.' });
            load();
          } catch (e) {
            Toast.show({ type: 'error', text1: getErrorMessage(e) });
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <AppHeader title="Sản phẩm của tôi" onBack={safeBack} />

      {loading ? (
        <ListRowSkeleton rows={4} imageSize={92} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <EmptyState
              icon={Package}
              title="Chưa có sản phẩm nào"
              message="Hãy đăng bán sản phẩm đầu tiên của bạn."
              actionLabel="Đăng bán"
              onAction={() => router.push('/(tabs)/sell')}
            />
          }
          renderItem={({ item }) => {
            const isAuction = item.saleType === 'auction';
            const active = isAuctionActive(item);
            const price = isAuction
              ? item.currentPrice ?? item.startingPrice ?? 0
              : item.price ?? 0;

            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => router.push(`/product/${item.id}`)}>
                <Image
                  source={{ uri: item.images?.[0] || DEFAULT_PRODUCT_IMAGE }}
                  style={styles.image}
                  contentFit="cover"
                />
                <View style={styles.info}>
                  <View style={styles.badgeRow}>
                    {statusBadge(item)}
                    {isAuction ? (
                      <Badge label="Đấu giá" backgroundColor={Colors.accentSoft} color={Colors.accent} small />
                    ) : (
                      <Badge label="Giá cố định" backgroundColor={Colors.primarySoft} color={Colors.primary} small />
                    )}
                  </View>
                  <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.price}>{formatCurrency(price)}</Text>

                  {isAuction ? (
                    <View style={styles.auctionMeta}>
                      <Text style={styles.auctionMetaText}>{item.bidsCount ?? 0} lượt đấu</Text>
                      {active && item.endTime ? (
                        <View style={styles.timeRow}>
                          <Timer size={12} color={Colors.accent} />
                          <Countdown endTime={item.endTime} compact />
                        </View>
                      ) : null}
                      {item.status === 'auction_ended' ? (
                        <Text style={styles.winnerText}>
                          Người thắng: {item.winnerId ? winnerNames[item.winnerId] ?? 'Đã xác định' : 'Không có'}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={styles.actions}>
                    <Button
                      title="Sửa"
                      variant="outline"
                      small
                      icon={SquarePen}
                      onPress={() => router.push(`/product/edit/${item.id}`)}
                      style={styles.actionBtn}
                    />
                    {item.saleType === 'fixed' && item.status === 'active' ? (
                      <Button
                        title="Đã bán"
                        variant="success"
                        small
                        icon={CircleCheck}
                        onPress={() =>
                          confirmAction('Đánh dấu đã bán', 'Xác nhận sản phẩm này đã bán?', () =>
                            markProductAsSold(item.id),
                          )
                        }
                        style={styles.actionBtn}
                      />
                    ) : null}
                    {isAuction && active ? (
                      <Button
                        title="Kết thúc"
                        variant="success"
                        small
                        icon={CircleStop}
                        onPress={() =>
                          confirmAction('Kết thúc đấu giá', 'Kết thúc phiên đấu giá ngay?', () =>
                            endAuction(item.id),
                          )
                        }
                        style={styles.actionBtn}
                      />
                    ) : null}
                    <Button
                      title="Xoá"
                      variant="danger"
                      small
                      icon={Trash2}
                      onPress={() =>
                        confirmAction('Xoá sản phẩm', 'Bạn chắc chắn muốn xoá?', () =>
                          deleteProduct(item.id),
                        )
                      }
                      style={styles.actionBtn}
                    />
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  info: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 5,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 3,
  },
  auctionMeta: {
    marginTop: 4,
    gap: 2,
  },
  auctionMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  winnerText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});