import { Gavel } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { ListRowSkeleton } from '@/components/Skeleton';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { DEFAULT_PRODUCT_IMAGE } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { getMyBids } from '@/services/auctionService';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { isAuctionActive } from '@/utils/auction';
import type { Bid, Product } from '@/types';

import { safeBack } from '@/utils/navigation';
interface BidEntry {
  bid: Bid;
  product: Product;
}

export default function MyBidsScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<BidEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMyBids(user.uid);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const renderStatus = (product: Product) => {
    if (isAuctionActive(product)) {
      return <Badge label="Đang đấu giá" backgroundColor={Colors.accent} small />;
    }
    if (product.status === 'auction_ended') {
      const won = product.winnerId === user?.uid;
      return (
        <Badge
          label={won ? 'Bạn thắng' : 'Không thắng'}
          backgroundColor={won ? Colors.success : Colors.textMuted}
          small
        />
      );
    }
    return null;
  };

  return (
    <Screen>
      <AppHeader title="Phiếu đấu giá của tôi" onBack={safeBack} />

      {loading ? (
        <ListRowSkeleton rows={3} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.bid.id}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <EmptyState
              icon={Gavel}
              title="Chưa tham gia đấu giá nào"
              message="Hãy tham gia đấu giá những sản phẩm bạn quan tâm."
            />
          }
          renderItem={({ item }) => {
            const product = item.product;
            const currentPrice = product.currentPrice ?? product.startingPrice ?? 0;
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => router.push(`/product/${product.id}`)}>
                <Image
                  source={{ uri: product.images?.[0] || DEFAULT_PRODUCT_IMAGE }}
                  style={styles.image}
                  contentFit="cover"
                />
                <View style={styles.info}>
                  <View style={styles.topRow}>
                    <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
                    {renderStatus(product)}
                  </View>
                  <View style={styles.priceRow}>
                    <View>
                      <Text style={styles.priceLabel}>Giá bạn đặt</Text>
                      <Text style={styles.myBid}>{formatCurrency(item.bid.amount)}</Text>
                    </View>
                    <View>
                      <Text style={styles.priceLabel}>Giá hiện tại</Text>
                      <Text style={styles.currentPrice}>{formatCurrency(currentPrice)}</Text>
                    </View>
                  </View>
                  <Text style={styles.time}>Đặt lúc {formatDateTime(item.bid.createdAt)}</Text>
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
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  myBid: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.success,
  },
  currentPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  time: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 6,
  },
});