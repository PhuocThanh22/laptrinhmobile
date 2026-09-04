import { useEffect, type ReactNode } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';

function Skeleton({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.block, style]} />;
}

/** Skeleton lưới sản phẩm 2 cột (Home, tìm kiếm). */
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 32 - 12) / 2;

  return (
    <Skeleton style={styles.flex}>
      <View style={styles.grid}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={[styles.productCard, { width: cardWidth }]}>
            <SkeletonBlock style={styles.squareImage} />
            <View style={styles.cardBody}>
              <SkeletonBlock style={styles.lineSmall} />
              <SkeletonBlock style={[styles.line, { marginTop: 8 }]} />
              <SkeletonBlock style={[styles.lineShort, { marginTop: 6 }]} />
            </View>
          </View>
        ))}
      </View>
    </Skeleton>
  );
}

/** Skeleton dòng ngang (sản phẩm của tôi, phiếu đấu, giỏ hàng). */
export function ListRowSkeleton({ rows = 4, imageSize = 84 }: { rows?: number; imageSize?: number }) {
  return (
    <Skeleton style={styles.flex}>
      <View style={styles.list}>
        {Array.from({ length: rows }).map((_, i) => (
          <View key={i} style={styles.rowCard}>
            <SkeletonBlock style={{ width: imageSize, height: imageSize, borderRadius: 12 }} />
            <View style={styles.rowBody}>
              <SkeletonBlock style={styles.line} />
              <SkeletonBlock style={[styles.lineSmall, { marginTop: 8 }]} />
              <SkeletonBlock style={[styles.lineShort, { marginTop: 8 }]} />
            </View>
          </View>
        ))}
      </View>
    </Skeleton>
  );
}

/** Skeleton thẻ đơn hàng (Đơn hàng của tôi). */
export function OrderCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Skeleton style={styles.flex}>
      <View style={styles.list}>
        {Array.from({ length: rows }).map((_, i) => (
          <View key={i} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <SkeletonBlock style={{ width: '35%', height: 14 }} />
              <SkeletonBlock style={{ width: 64, height: 20, borderRadius: 10 }} />
            </View>
            <SkeletonBlock style={{ width: '25%', height: 11, marginTop: 6 }} />
            <View style={styles.orderItemRow}>
              <SkeletonBlock style={{ width: 46, height: 46, borderRadius: 10 }} />
              <SkeletonBlock style={{ flex: 1, height: 13, marginLeft: 10 }} />
              <SkeletonBlock style={{ width: 48, height: 13 }} />
            </View>
            <SkeletonBlock style={styles.divider} />
            <View style={styles.orderFooter}>
              <View style={styles.flex}>
                <SkeletonBlock style={{ width: '60%', height: 12 }} />
                <SkeletonBlock style={{ width: '85%', height: 11, marginTop: 5 }} />
              </View>
              <SkeletonBlock style={{ width: 70, height: 16 }} />
            </View>
          </View>
        ))}
      </View>
    </Skeleton>
  );
}

/** Skeleton chi tiết sản phẩm. */
export function DetailSkeleton() {
  return (
    <Skeleton style={styles.flex}>
      <SkeletonBlock style={styles.detailImage} />
      <View style={styles.detailBody}>
        <SkeletonBlock style={{ width: '70%', height: 18 }} />
        <SkeletonBlock style={{ width: '45%', height: 22, marginTop: 10 }} />
        <SkeletonBlock style={styles.line} />
        <SkeletonBlock style={[styles.line, { width: '92%' }]} />
        <SkeletonBlock style={[styles.lineShort, { width: '85%' }]} />
        <SkeletonBlock style={{ height: 50, borderRadius: 14, marginTop: 24 }} />
      </View>
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  block: {
    backgroundColor: Colors.border,
    borderRadius: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  productCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  squareImage: {
    aspectRatio: 1,
  },
  cardBody: {
    padding: 10,
  },
  line: {
    width: '90%',
    height: 13,
  },
  lineShort: {
    width: '70%',
    height: 13,
  },
  lineSmall: {
    width: '55%',
    height: 14,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  rowCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  rowBody: {
    flex: 1,
    justifyContent: 'center',
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailImage: {
    width: '100%',
    aspectRatio: 1,
  },
  detailBody: {
    padding: 16,
  },
});