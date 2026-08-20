import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { formatCurrency } from '@/utils/format';

export default function OrderSuccessScreen() {
  const params = useLocalSearchParams<{ orderId?: string; total?: string; count?: string }>();
  const total = Number(params.total ?? 0);
  const count = Number(params.count ?? 0);

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="check-circle" size={72} color={Colors.success} />
        </View>
        <Text style={styles.title}>Đặt hàng thành công!</Text>
        <Text style={styles.subtitle}>
          Mã đơn: <Text style={styles.highlight}>#{params.orderId ?? '--'}</Text>
        </Text>
        <Text style={styles.detail}>
          {count} sản phẩm · Tổng tiền <Text style={styles.highlight}>{formatCurrency(total)}</Text>
        </Text>
        <Text style={styles.note}>Người bán sẽ sớm liên hệ xác nhận đơn hàng của bạn.</Text>

        <View style={styles.actions}>
          <Button
            title="Xem đơn hàng của tôi"
            icon="receipt-long"
            onPress={() => router.replace('/orders/my-orders')}
          />
          <Button
            title="Về trang chủ"
            variant="outline"
            icon="home"
            onPress={() => router.dismissAll()}
            style={styles.secondary}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWrap: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },
  highlight: {
    fontWeight: '800',
    color: Colors.primary,
  },
  detail: {
    fontSize: 15,
    color: Colors.text,
    marginTop: 8,
    fontWeight: '600',
  },
  note: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 19,
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: 32,
    gap: 10,
  },
  secondary: {
    marginTop: 0,
  },
});