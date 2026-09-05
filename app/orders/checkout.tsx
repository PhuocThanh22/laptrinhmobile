import { Check, Circle, CircleDot, QrCode, Truck } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showMessage } from '@/components/MessageCenter';

import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { DEFAULT_PRODUCT_IMAGE, vietQRConfig } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getProductById } from '@/services/productService';
import { createOrder } from '@/services/orderService';
import { buildVietQRUrl } from '@/services/paymentService';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency } from '@/utils/format';
import { validateOrder } from '@/utils/validation';
import type { OrderItem, PaymentMethod, Product } from '@/types';

import { safeBack } from '@/utils/navigation';
type Mode = 'cart' | 'buyNow' | 'auctionWin';

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ mode?: string; productId?: string }>();
  const mode = (params.mode ?? 'cart') as Mode;
  const { items, clear } = useCart();
  const { user } = useAuth();

  const [directProduct, setDirectProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(mode !== 'cart');
  const [error, setError] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'cart' || !params.productId) return;
    setLoading(true);
    getProductById(params.productId)
      .then((p) => {
        if (!p) throw new Error('Không tìm thấy sản phẩm.');
        setDirectProduct(p);
        setError(null);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [mode, params.productId]);

  const orderItems: OrderItem[] =
    mode === 'cart'
      ? items.map((it) => ({
          productId: it.product.id,
          name: it.product.name,
          image: it.product.images?.[0] || DEFAULT_PRODUCT_IMAGE,
          price: it.product.price ?? 0,
          quantity: it.quantity,
          saleType: it.product.saleType,
        }))
      : directProduct
        ? [
            {
              productId: directProduct.id,
              name: directProduct.name,
              image: directProduct.images?.[0] || DEFAULT_PRODUCT_IMAGE,
              price:
                mode === 'auctionWin'
                  ? (directProduct.currentPrice ?? directProduct.startingPrice ?? 0)
                  : (directProduct.price ?? 0),
              quantity: 1,
              saleType: directProduct.saleType,
            },
          ]
        : [];

  const totalAmount = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      showMessage({ type: 'error', text1: 'Vui lòng đăng nhập.' });
      return;
    }
    const validation = validateOrder({ receiverName, phone, address });
    if (validation) {
      showMessage({ type: 'error', text1: validation });
      return;
    }
    if (!orderItems.length) {
      showMessage({ type: 'error', text1: 'Đơn hàng trống.' });
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        buyerId: user.uid,
        items: orderItems,
        receiverName,
        phone,
        address,
        note,
        paymentMethod,
      });
      if (mode === 'cart') await clear();
      if (paymentMethod === 'vietqr') {
        router.replace(`/orders/payment?orderId=${order.id}`);
      } else {
        router.replace(
          `/orders/success?orderId=${order.id}&total=${order.totalAmount}&count=${orderItems.length}`,
        );
      }
    } catch (e) {
      showMessage({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Thanh toán" onBack={safeBack} />

      {loading ? (
        <Loading text="Đang tải thông tin..." />
      ) : error ? (
        <ErrorState message={error} onRetry={safeBack} />
      ) : orderItems.length === 0 ? (
        <ErrorState message="Đơn hàng trống." />
      ) : (
<KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Receiver info */}
            <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
            <View style={styles.card}>
              <TextField label="Họ tên người nhận" value={receiverName} onChangeText={setReceiverName} placeholder="Nguyễn Văn A" />
              <TextField
                label="Số điện thoại"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/[^0-9+]/g, ''))}
                placeholder="0901234567"
                keyboardType="phone-pad"
                maxLength={12}
              />
              <TextField label="Địa chỉ" value={address} onChangeText={setAddress} placeholder="Số nhà, đường, quận, TP..." multiline />
              <TextField label="Ghi chú (không bắt buộc)" value={note} onChangeText={setNote} placeholder="Ghi chú cho người bán" />
            </View>

            {/* Payment */}
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <Pressable
              onPress={() => setPaymentMethod('cod')}
              style={[styles.paymentCard, paymentMethod === 'cod' && styles.paymentCardActive]}>
              <Truck size={24} color={Colors.primary} />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>COD - Thanh toán khi nhận hàng</Text>
                <Text style={styles.paymentDesc}>Trả tiền mặt khi nhận được hàng</Text>
              </View>
              {paymentMethod === 'cod' ? (
                <CircleDot size={22} color={Colors.primary} />
              ) : (
                <Circle size={22} color={Colors.textMuted} />
              )}
            </Pressable>
            <Pressable
              onPress={() => setPaymentMethod('vietqr')}
              style={[styles.paymentCard, paymentMethod === 'vietqr' && styles.paymentCardActive]}>
              <QrCode size={24} color={Colors.primary} />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>VietQR - Chuyển khoản ngân hàng</Text>
                <Text style={styles.paymentDesc}>
                  Quét mã QR {vietQRConfig.bankId} · {vietQRConfig.accountNo} · {formatCurrency(totalAmount)}
                </Text>
              </View>
{paymentMethod === 'vietqr' ? (
                <CircleDot size={22} color={Colors.primary} />
              ) : (
                <Circle size={22} color={Colors.textMuted} />
              )}
            </Pressable>

            {paymentMethod === 'vietqr' ? (
              <View style={styles.qrPreviewCard}>
                <Image
                  source={{ uri: buildVietQRUrl(totalAmount, 'MINISHOP') }}
                  style={styles.qrPreview}
                  contentFit="contain"
                />
                <Text style={styles.qrPreviewTitle}>
                  Chuyển khoản {formatCurrency(totalAmount)} đến
                </Text>
                <Text style={styles.qrPreviewAccount}>
                  {vietQRConfig.bankId} · {vietQRConfig.accountNo}
                </Text>
                <Text style={styles.qrPreviewHint}>
                  Mở app ngân hàng → Quét mã trên → Bấm &quot;Đặt hàng&quot; để xác nhận và thanh toán.
                </Text>
              </View>
            ) : null}

            {/* Order summary */}
            <Text style={styles.sectionTitle}>Đơn hàng</Text>
            <View style={styles.card}>
              {orderItems.map((it, i) => (
                <View key={it.productId + i} style={styles.orderItem}>
                  <Image source={{ uri: it.image }} style={styles.itemImage} contentFit="cover" />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{it.name}</Text>
                    <Text style={styles.itemMeta}>x{it.quantity} · {it.saleType === 'auction' ? 'Đấu giá' : 'Giá cố định'}</Text>
                  </View>
                  <Text style={styles.itemPrice}>{formatCurrency(it.price * it.quantity)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>

            <Button
              title={submitting ? 'Đang đặt hàng...' : 'Đặt hàng'}
              icon={Check}
              loading={submitting}
              onPress={handlePlaceOrder}
              style={styles.submit}
            />
            <View style={styles.bottomSpace} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 16,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  paymentCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
paymentDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  qrPreviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  qrPreview: {
    width: 220,
    height: 220,
    backgroundColor: Colors.card,
  },
  qrPreviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 6,
  },
  qrPreviewAccount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  qrPreviewHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  itemMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  submit: {
    marginTop: 4,
  },
  bottomSpace: {
    height: 24,
  },
});