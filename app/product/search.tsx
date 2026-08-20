import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ProductGridSkeleton } from '@/components/Skeleton';
import { ProductCard } from '@/components/ProductCard';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { getAllProducts } from '@/services/productService';
import { getErrorMessage } from '@/utils/errors';
import type { Product, SaleType } from '@/types';

type FilterKey = 'all' | SaleType;

const SALE_FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'fixed', label: 'Giá cố định' },
  { key: 'auction', label: 'Đấu giá' },
];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState(params.q ?? '');
  const [category, setCategory] = useState<string>(params.category ?? '');
  const [saleFilter, setSaleFilter] = useState<FilterKey>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (p.status === 'sold') return false;
      if (category && p.category !== category) return false;
      if (saleFilter !== 'all' && p.saleType !== saleFilter) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, category, saleFilter]);

  const cardWidth = (width - 32 - 12) / 2;

  return (
    <Screen>
      <AppHeader title="Tìm kiếm" onBack={() => router.back()} />
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      {/* Category chips */}
      <View style={styles.chipsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {[{ key: '', label: 'Tất cả' }, ...CATEGORIES].map((item) => {
            const active = category === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setCategory(item.key)}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Sale type filter */}
      <View style={styles.saleFilters}>
        {SALE_FILTERS.map((f) => {
          const active = saleFilter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setSaleFilter(f.key)}
              style={[styles.saleChip, active && styles.saleChipActive]}>
              <Text style={[styles.saleChipText, active && styles.saleChipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{results.length} sản phẩm</Text>
      </View>

      {loading ? (
        <ProductGridSkeleton count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-off"
              title="Không tìm thấy sản phẩm"
              message="Thử từ khoá hoặc danh mục khác nhé."
            />
          }
          renderItem={({ item }) => (
            <ProductCard product={item} width={cardWidth} onPress={() => router.push(`/product/${item.id}`)} />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chipsRow: {
    flexGrow: 0,
    height: 48,
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.white,
  },
  saleFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  saleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.accentSoft,
  },
  saleChipActive: {
    backgroundColor: Colors.accent,
  },
  saleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  saleChipTextActive: {
    color: Colors.white,
  },
  countRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  countText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  gridRow: {
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  gridContent: {
    paddingBottom: 24,
  },
});