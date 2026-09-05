import { Star } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showMessage } from '@/components/MessageCenter';

import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/Button';
import { RatingStars } from '@/components/RatingStars';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getOrderById } from '@/services/orderService';
import { createReview } from '@/services/reviewService';
import { formatCurrency } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import type { Order } from '@/types';

import { safeBack } from '@/utils/navigation';
export default function ReviewScreen() {
  const { orderId, productId } = useLocalSearchParams<{ orderId: string; productId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    getOrderById(orderId).then(setOrder);
  }, [orderId]);

  const product = order?.items.find((it) => it.productId === productId);

  const handleSubmit = async () => {
    if (!user || !orderId || !productId) return;
    setSubmitting(true);
    try {
      await createReview({ productId, orderId, reviewerId: user.uid, rating, comment });
      showMessage({ type: 'success', text1: 'Cảm ơn bạn đã đánh giá!' });
      safeBack();
    } catch (e) {
      showMessage({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Đánh giá sản phẩm" onBack={safeBack} />
<KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {product ? (
            <View style={styles.productCard}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
            </View>
          ) : null}
          <Text style={styles.label}>Số sao</Text>
          <View style={styles.ratingWrap}>
            <RatingStars rating={rating} size={32} onChange={setRating} />
            <Text style={styles.ratingText}>{rating} / 5</Text>
          </View>
          <TextField
            label="Nhận xét"
            value={comment}
            onChangeText={setComment}
            placeholder="Chất lượng sản phẩm, thái độ người bán..."
            multiline
            maxLength={500}
          />
          <Text style={styles.hint}>{comment.length}/500 ký tự</Text>
          <Button title={submitting ? 'Đang gửi...' : 'Gửi đánh giá'} icon={Star} loading={submitting} onPress={handleSubmit} style={styles.btn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  productCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  productName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  productPrice: { fontSize: 13, color: Colors.primary, marginTop: 4, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 8 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border },
  ratingText: { fontSize: 16, fontWeight: '800', color: Colors.text },
  hint: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
  btn: { marginTop: 16 },
});
