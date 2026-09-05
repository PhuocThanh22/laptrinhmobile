import { MapPin, Timer } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Badge } from './Badge';
import { Countdown } from './Countdown';
import { Colors } from '@/constants/colors';
import { DEFAULT_PRODUCT_IMAGE } from '@/constants/config';
import { getCategoryLabel, getConditionLabel } from '@/constants/categories';
import { formatCurrency } from '@/utils/format';
import { isAuctionActive } from '@/utils/auction';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  width: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ProductCard({ product, width, onPress, style }: ProductCardProps) {
  const isAuction = product.saleType === 'auction';
  const active = isAuctionActive(product);
  const sold = product.status === 'sold';

  const price = isAuction
    ? product.currentPrice ?? product.startingPrice ?? 0
    : product.price ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed, style]}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.images?.[0] || DEFAULT_PRODUCT_IMAGE }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.topRow}>
          <Badge
            label={isAuction ? (active ? 'ĐANG ĐẤU GIÁ' : 'KHÔNG CÒN ĐẤU GIÁ') : 'BÁN'}
            backgroundColor={isAuction ? (active ? Colors.accent : Colors.textMuted) : Colors.primary}
            small
          />
        </View>
        {sold ? (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>Đã bán</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.price} numberOfLines={1}>
          {formatCurrency(price)}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {getCategoryLabel(product.category)} · {getConditionLabel(product.condition)}
        </Text>
        <Text style={styles.seller} numberOfLines={1}>
          {product.sellerName}
        </Text>
        {product.sellerLocation?.address ? (
          <View style={styles.locationRow}>
            <MapPin size={11} color={Colors.textMuted} />
            <Text style={styles.location} numberOfLines={1}>
              {product.sellerLocation.address}
            </Text>
          </View>
        ) : null}
        {isAuction && active && product.endTime ? (
          <View style={styles.timeRow}>
            <Timer size={13} color={Colors.accent} />
            <Countdown endTime={product.endTime} compact />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: Colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  body: {
    padding: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    minHeight: 36,
  },
  meta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  seller: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  location: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: Colors.accentSoft,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});