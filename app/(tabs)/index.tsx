import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AuctionCard } from '@/components/AuctionCard';
import { Avatar } from '@/components/Avatar';
import { CategoryChip } from '@/components/CategoryChip';
import { Loading } from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { ProductCard } from '@/components/ProductCard';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { CATEGORIES } from '@/constants/categories';
import { APP_NAME } from '@/constants/config';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getAllProducts } from '@/services/productService';
import { endExpiredAuctions } from '@/services/auctionService';
import { getErrorMessage } from '@/utils/errors';
import type { Product } from '@/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      await endExpiredAuctions();
      const list = await getAllProducts();
      setProducts(list);
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cardWidth = (width - 32 - 12) / 2;

  const auctions = products.filter(
    (p) => p.saleType === 'auction' && (p.status === 'auction_active' || p.status === 'auction_ended'),
  );
  const newProducts = products.filter((p) => p.status === 'active' || p.status === 'auction_active');

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.tagline}>Sàn đồ cũ sinh viên · Đấu giá nhẹ</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn}>
          <Avatar name={user?.name} uri={user?.avatar} size={40} />
        </Pressable>
      </View>

      {loading ? (
        <Loading text="Đang tải sản phẩm..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }>
          {/* Search */}
          <View style={styles.searchWrap}>
            <SearchBar onSubmit={(text) => router.push({ pathname: '/product/search', params: { q: text } })} />
          </View>

          {/* Categories */}
          <SectionHeader title="Danh mục" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}>
            {CATEGORIES.map((item) => (
              <CategoryChip
                key={item.key}
                label={item.label}
                icon={item.icon}
                onPress={() => router.push({ pathname: '/product/search', params: { category: item.key } })}
              />
            ))}
          </ScrollView>

          {/* Auctions */}
          <SectionHeader title="Đang đấu giá" right="Xem thêm" onRightPress={() => router.push('/product/search')} />
          {auctions.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.auctionsRow}>
              {auctions.map((item) => (
                <AuctionCard
                  key={item.id}
                  product={item}
                  width={width - 64}
                  onPress={() => router.push(`/product/${item.id}`)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noData}>Chưa có phiên đấu giá nào.</Text>
          )}

          {/* New products */}
          <SectionHeader title="Sản phẩm mới" />
          {newProducts.length ? (
            <View style={styles.grid}>
              {newProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  width={cardWidth}
                  onPress={() => router.push(`/product/${product.id}`)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="storefront" size={48} color={Colors.textMuted} />
              <Text style={styles.noData}>Chưa có sản phẩm. Hãy là người đầu tiên đăng bán!</Text>
            </View>
          )}
          <View style={styles.bottomSpace} />
        </ScrollView>
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
    paddingBottom: 12,
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
  },
  tagline: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  avatarBtn: {
    borderRadius: 20,
  },
  searchWrap: {
    paddingHorizontal: 16,
  },
  categories: {
    paddingHorizontal: 16,
    gap: 10,
    paddingVertical: 4,
  },
  auctionsRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  noData: {
    paddingHorizontal: 16,
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  bottomSpace: {
    height: 24,
  },
});