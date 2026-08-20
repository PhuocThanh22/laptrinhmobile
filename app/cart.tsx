import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Screen } from '@/components/Screen';
import { ListRowSkeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/colors';
import { DEFAULT_PRODUCT_IMAGE } from '@/constants/config';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/utils/format';

export default function CartScreen() {
  const { items, loading, totalAmount, totalItems, changeQuantity, removeItem } = useCart();

  return (
    <Screen>
      <AppHeader title="Giỏ hàng" subtitle={`${totalItems} sản phẩm`} onBack={() => router.back()} />

      {loading ? (
        <ListRowSkeleton rows={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="shopping-cart"
          title="Giỏ hàng trống"
          message="Hãy thêm sản phẩm giá cố định vào giỏ để đặt hàng. Sản phẩm đấu giá chỉ được đặt hàng khi bạn thắng cuộc."
          actionLabel="Xem sản phẩm"
          onAction={() => router.replace('/(tabs)')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.productId}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => {
            const price = item.product.saleType === 'auction'
              ? item.product.currentPrice ?? item.product.startingPrice ?? 0
              : item.product.price ?? 0;
            return (
              <View style={styles.item}>
                <Pressable onPress={() => router.push(`/product/${item.product.id}`)}>
                  <Image
                    source={{ uri: item.product.images?.[0] || DEFAULT_PRODUCT_IMAGE }}
                    style={styles.image}
                    contentFit="cover"
                  />
                </Pressable>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.price}>{formatCurrency(price)}</Text>
                  <View style={styles.row}>
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(q) => changeQuantity(item.productId, q)}
                    />
                    <Pressable onPress={() => removeItem(item.productId)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={22} color={Colors.danger} />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
              </View>
              <Button
                title="Thanh toán"
                icon="payment"
                disabled={items.length === 0}
                onPress={() => router.push('/orders/checkout?mode=cart')}
              />
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 10,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footer: {
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
});