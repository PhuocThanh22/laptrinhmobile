import { CircleAlert, CircleCheck, ReceiptText, RotateCw, Timer } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showMessage } from '@/components/MessageCenter';

import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/Button';
import { Countdown } from '@/components/Countdown';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { vietQRConfig } from '@/constants/config';
import { getOrderById } from '@/services/orderService';
import { buildVietQRUrl, confirmVietQRPayment } from '@/services/paymentService';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import type { Order } from '@/types';

import { safeBack } from '@/utils/navigation';
const PAY_TIMEOUT_MS = 15 * 60 * 1000; // 15 phút

export default function VietQRPaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    getOrderById(orderId)
      .then(setOrder)
      .catch((e) => showMessage({ type: 'error', text1: getErrorMessage(e) }))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Thanh toán VietQR" onBack={safeBack} />
        <Loading text="Đang tải đơn hàng..." />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <AppHeader title="Thanh toán VietQR" onBack={safeBack} />
        <View style={styles.empty}>
          <CircleAlert size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Không tìm thấy đơn hàng.</Text>
        </View>
      </Screen>
    );
  }

  // đã thanh toán rồi -> chuyển success
  if (order.paymentStatus === 'paid') {
    return (
      <Screen>
        <AppHeader title="Thanh toán VietQR" onBack={() => router.replace('/orders/my-orders')} />
        <View style={styles.successWrap}>
          <CircleCheck size={64} color={Colors.success} />
          <Text style={styles.successTitle}>Đã thanh toán!</Text>
          <Text style={styles.successDesc}>Đơn #{order.id.slice(0, 8)} đã được xác nhận.</Text>
          <Button title="Xem đơn hàng" icon={ReceiptText} onPress={() => router.replace('/orders/my-orders')} />
        </View>
      </Screen>
    );
  }

  const qrUrl = buildVietQRUrl(order.totalAmount, `MINISHOP ${order.id.slice(0, 6).toUpperCase()}`);
  const expireAt = order.createdAt + PAY_TIMEOUT_MS;
  const isExpired = Date.now() > expireAt;

  const handleConfirm = async () => {
    if (isExpired) {
      showMessage({ type: 'error', text1: 'QR đã hết hạn (15 phút). Vui lòng tạo lại đơn.' });
      return;
    }
    setConfirming(true);
    try {
      // giả lập kiểm tra: delay 1.5s
      await new Promise((r) => setTimeout(r, 1500));
      await confirmVietQRPayment(order.id);
      showMessage({ type: 'success', text1: 'Thanh toán thành công!' });
      router.replace(`/orders/success?orderId=${order.id}&total=${order.totalAmount}&count=${order.items.length}`);
    } catch (e) {
      showMessage({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setConfirming(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const fresh = await getOrderById(order.id);
      if (fresh?.paymentStatus === 'paid') {
        showMessage({ type: 'success', text1: 'Đơn đã được thanh toán!' });
        router.replace(`/orders/success?orderId=${fresh.id}&total=${fresh.totalAmount}&count=${fresh.items.length}`);
      } else {
        showMessage({ type: 'info', text1: 'Chưa ghi nhận thanh toán. Vui lòng thử lại sau.' });
      }
    } catch (e) {
      showMessage({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setChecking(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Huỷ thanh toán', 'Bạn muốn huỷ đơn này?', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Huỷ đơn', style: 'destructive', onPress: () => router.replace('/orders/my-orders') },
    ]);
  };

  return (
    <Screen>
      <AppHeader title="Thanh toán VietQR" onBack={safeBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.amount}>{formatCurrency(order.totalAmount)}</Text>
          <Text style={styles.orderId}>Đơn #{order.id.slice(0, 8)} · {formatDateTime(order.createdAt)}</Text>
          {!isExpired ? (
            <View style={styles.countdownRow}>
              <Timer size={16} color={Colors.danger} />
              <Text style={styles.countdownLabel}>Hết hạn sau</Text>
              <Countdown endTime={expireAt} />
            </View>
          ) : (
            <Text style={styles.expired}>QR đã hết hạn (15 phút)</Text>
          )}
        </View>

        <View style={styles.qrCard}>
          <Image source={{ uri: qrUrl }} style={styles.qr} contentFit="contain" />
          <Text style={styles.qrHint}>Mở app ngân hàng → Quét mã → Chuyển khoản đúng số tiền & nội dung</Text>
        </View>

        <View style={styles.infoCard}>
          <Row label="Ngân hàng" value={vietQRConfig.bankId} />
          <Row label="Số tài khoản" value={vietQRConfig.accountNo} />
          <Row label="Chủ TK" value={vietQRConfig.accountName} />
          <Row label="Số tiền" value={formatCurrency(order.totalAmount)} bold />
          <Row label="Nội dung" value={`MINISHOP ${order.id.slice(0, 6).toUpperCase()}`} bold />
        </View>

        <Text style={styles.note}>
          Lưu ý: Đây là VietQR giả lập cho đồ án. Sau khi bạn chuyển khoản (hoặc bấm demo), hãy bấm &quot;Tôi đã chuyển khoản&quot; để hệ thống xác nhận trong 1.5s.
        </Text>

        <Button
          title={confirming ? 'Đang xác nhận...' : 'Tôi đã chuyển khoản'}
          icon={CircleCheck}
          loading={confirming}
          disabled={isExpired}
          onPress={handleConfirm}
          style={styles.primaryBtn}
        />
        <Button
          title={checking ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán'}
          variant="outline"
          icon={RotateCw}
          loading={checking}
          onPress={handleCheck}
          style={styles.secondaryBtn}
        />
        <Button title="Huỷ" variant="ghost" onPress={handleCancel} />
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, bold && rowStyles.bold]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 12, color: Colors.textMuted },
  value: { fontSize: 12, color: Colors.text, fontWeight: '600', maxWidth: 180, textAlign: 'right' },
  bold: { fontWeight: '900', color: Colors.primary },
});

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 24 },
  headerCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  amount: { fontSize: 27, fontWeight: '900', color: Colors.primary },
  orderId: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  countdownLabel: { fontSize: 11, color: Colors.textMuted },
  expired: { marginTop: 10, color: Colors.danger, fontWeight: '700' },
  qrCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  qr: { width: 260, height: 260, backgroundColor: Colors.card },
  qrHint: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginTop: 16,
  },
  note: { fontSize: 11, color: Colors.textMuted, marginTop: 12, lineHeight: 18, textAlign: 'center' },
  primaryBtn: { marginTop: 16 },
  secondaryBtn: { marginTop: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyText: { color: Colors.textMuted },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  successTitle: { fontSize: 19, fontWeight: '900', color: Colors.success },
  successDesc: { fontSize: 12, color: Colors.textMuted },
});
