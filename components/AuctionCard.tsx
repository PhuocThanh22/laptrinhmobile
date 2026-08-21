import { Gavel, Timer } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from './Badge';
import { Countdown } from './Countdown';
import { Colors } from '@/constants/colors';
import { DEFAULT_PRODUCT_IMAGE } from '@/constants/config';
import { formatCurrency } from '@/utils/format';
import { isAuctionActive } from '@/utils/auction';
import type { Product } from '@/types';

interface AuctionCardProps {
  product: Product;
  width?: number;
  onPress?: () => void;
}

export function AuctionCard({ product, width, onPress }: AuctionCardProps) {
  const active = isAuctionActive(product);
  const ended = product.status === 'auction_ended';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, width ? { width } : null, pressed && styles.pressed]}>
      <Image
        source={{ uri: product.images?.[0] || DEFAULT_PRODUCT_IMAGE }}
        style={styles.image}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price} numberOfLines={1}>
          {formatCurrency(product.currentPrice ?? product.startingPrice)}
        </Text>
        <View style={styles.row}>
          <Badge label="ĐẤU GIÁ" backgroundColor={Colors.accent} small />
          <View style={styles.bidsRow}>
            <Gavel size={13} color={Colors.textMuted} />
            <Text style={styles.bidsText}>{product.bidsCount ?? 0} lượt</Text>
          </View>
        </View>
        <View style={styles.timeWrap}>
          <Timer size={14} color={active ? Colors.accent : Colors.textMuted} />
          {active && product.endTime ? (
            <Countdown endTime={product.endTime} />
          ) : ended ? (
            <Text style={styles.endedText}>
              {product.winnerId ? 'Đã có người thắng' : 'Kết thúc không có người thắng'}
            </Text>
          ) : (
            <Text style={styles.endedText}>Chưa bắt đầu</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    marginHorizontal: 6,
  },
  pressed: {
    opacity: 0.9,
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  body: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  bidsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bidsText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  endedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
});