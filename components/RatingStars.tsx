import { Star } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

export function RatingStars({
  rating,
  size = 18,
  onChange,
  readonly,
}: {
  rating: number;
  size?: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((v) => (
        <Pressable
          key={v}
          disabled={readonly || !onChange}
          onPress={() => onChange?.(v)}
          hitSlop={8}
          style={styles.star}>
          <Star
            size={size}
            color={v <= rating ? Colors.accent : Colors.textMuted}
            fill={v <= rating ? Colors.accent : 'transparent'}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function RatingSummary({ avg, count }: { avg: number; count: number }) {
  if (!count) return <Text style={styles.noReview}>Chưa có đánh giá</Text>;
  return (
    <View style={styles.summaryRow}>
      <RatingStars rating={Math.round(avg)} size={16} readonly />
      <Text style={styles.summaryText}>
        {avg.toFixed(1)} · {count} đánh giá
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  star: { padding: 2 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  noReview: { fontSize: 11, color: Colors.textMuted },
});
