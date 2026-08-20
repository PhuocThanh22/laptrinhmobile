import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Countdown } from '@/components/Countdown';
import { ErrorState } from '@/components/ErrorState';
import { ImageCarousel } from '@/components/ImageCarousel';
import { ProductVideo } from '@/components/ProductVideo';
import { DetailSkeleton } from '@/components/Skeleton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { getCategoryLabel, getConditionLabel } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getBidsForProduct, placeBid, endAuction, endExpiredAuctions } from '@/services/auctionService';
import { deleteProduct, getProductById, markProductAsSold } from '@/services/productService';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { getMinNextBid, isAuctionActive, shortName } from '@/utils/auction';
import { validateBid } from '@/utils/validation';
import type { Bid, Product } from '@/types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidInput, setBidInput] = useState('');
  const [placing, setPlacing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [, setTick] = useState(0);

  // tick mỗi giây để cập nhật countdown/trạng thái đấu giá.
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      await endExpiredAuctions();
      const p = await getProductById(id);
      if (!p) {
        setError('Không tìm thấy sản phẩm.');
        setLoading(false);
        return;
      }
      setProduct(p);
      if (p.saleType === 'auction') {
        const b = await getBidsForProduct(id);
        setBids(b);
      }
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePlaceBid = async () => {
    if (!user) {
      Toast.show({ type: 'error', text1: 'Vui lòng đăng nhập để đấu giá.' });
      return;
    }
    if (!product) return;
    const current = product.currentPrice ?? product.startingPrice ?? 0;
    const increment = product.bidIncrement ?? 0;
    const validation = validateBid(current, increment, bidInput);
    if (validation) {
      Toast.show({ type: 'error', text1: validation });
      return;
    }
    setPlacing(true);
    try {
      await placeBid({
        productId: product.id,
        bidderId: user.uid,
        amount: Number(bidInput.replace(/[^\d]/g, '')),
      });
      Toast.show({ type: 'success', text1: 'Đặt giá thành công!' });
      setBidInput('');
      await load();
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
      await load();
    } finally {
      setPlacing(false);
    }
  };

  const handleEndNow = () => {
    if (!product) return;
    Alert.alert('Kết thúc đấu giá', 'Xác nhận kết thúc phiên đấu giá ngay bây giờ?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Kết thúc',
        style: 'destructive',
        onPress: async () => {
          try {
            await endAuction(product.id);
            Toast.show({ type: 'success', text1: 'Đã kết thúc đấu giá.' });
            await load();
          } catch (e) {
            Toast.show({ type: 'error', text1: getErrorMessage(e) });
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!product) return;
    Alert.alert('Xoá sản phẩm', 'Bạn chắc chắn muốn xoá sản phẩm này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(product.id);
            Toast.show({ type: 'success', text1: 'Đã xoá sản phẩm.' });
            router.back();
          } catch (e) {
            Toast.show({ type: 'error', text1: getErrorMessage(e) });
          }
        },
      },
    ]);
  };

  const handleMarkSold = () => {
    if (!product) return;
    Alert.alert('Đánh dấu đã bán', 'Xác nhận sản phẩm này đã được bán?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            await markProductAsSold(product.id);
            Toast.show({ type: 'success', text1: 'Đã đánh dấu sản phẩm đã bán.' });
            await load();
          } catch (e) {
            Toast.show({ type: 'error', text1: getErrorMessage(e) });
          }
        },
      },
    ]);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      await addItem(product);
      Toast.show({ type: 'success', text1: 'Đã thêm vào giỏ hàng' });
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Sản phẩm" onBack={() => router.back()} />
        <DetailSkeleton />
      </Screen>
    );
  }

  if (error || !product) {
    return (
      <Screen>
        <AppHeader title="Sản phẩm" onBack={() => router.back()} />
        <ErrorState message={error ?? 'Không tìm thấy sản phẩm.'} onRetry={load} />
      </Screen>
    );
  }

  const isOwner = user?.uid === product.sellerId;
  const isAuction = product.saleType === 'auction';
  const active = isAuctionActive(product);
  const sold = product.status === 'sold';
  const isWinner = !!user && user.uid === product.winnerId;
  const ended = isAuction && !active;
  const currentPrice = product.currentPrice ?? product.startingPrice ?? 0;
  const minNextBid = getMinNextBid(product);
  const fixedPrice = product.price ?? 0;

  return (
    <Screen>
      <AppHeader title={isAuction ? 'Chi tiết đấu giá' : 'Chi tiết sản phẩm'} onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ImageCarousel images={product.images} />
        {product.video ? <ProductVideo uri={product.video} /> : null}

        <View style={styles.content}>
          {/* Badges */}
          <View style={styles.badgesRow}>
            <Badge label={isAuction ? 'ĐẤU GIÁ' : 'GIÁ CỐ ĐỊNH'} backgroundColor={isAuction ? Colors.accent : Colors.primary} />
            <Badge label={getConditionLabel(product.condition)} backgroundColor={Colors.infoSoft} color={Colors.info} />
            <Badge label={getCategoryLabel(product.category)} backgroundColor={Colors.border} color={Colors.textMuted} />
          </View>

          <Text style={styles.name}>{product.name}</Text>

          {/* Price */}
          {!isAuction ? (
            <View style={styles.priceBlock}>
              <Text style={styles.price}>{formatCurrency(fixedPrice)}</Text>
              {sold ? <Badge label="Đã bán" backgroundColor={Colors.textMuted} /> : null}
            </View>
          ) : (
            <View style={[styles.auctionPanel, active && styles.auctionPanelActive]}>
              <View style={styles.auctionHeader}>
                <Text style={styles.auctionHeaderTitle}>Đấu giá</Text>
                {active && product.endTime ? (
                  <View style={styles.countdownRow}>
                    <MaterialIcons name="timer" size={16} color={Colors.accent} />
                    <Countdown endTime={product.endTime} onEnd={load} />
                  </View>
                ) : (
                  <Badge label="ĐÃ KẾT THÚC" backgroundColor={Colors.textMuted} />
                )}
              </View>

              <View style={styles.auctionStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatCurrency(product.startingPrice ?? 0)}</Text>
                  <Text style={styles.statLabel}>Giá khởi điểm</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, styles.statValueHighlight]}>{formatCurrency(currentPrice)}</Text>
                  <Text style={styles.statLabel}>Giá hiện tại</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatCurrency(product.bidIncrement ?? 0)}</Text>
                  <Text style={styles.statLabel}>Bước giá</Text>
                </View>
              </View>

              <View style={styles.auctionMetaRow}>
                <Text style={styles.auctionMeta}>{bids.length} lượt đấu</Text>
                <Text style={styles.auctionMeta}>
                  Kết thúc: {formatDateTime(product.endTime)}
                </Text>
              </View>
            </View>
          )}

          {/* Bid / action area */}
          {isAuction && active ? (
            <View style={styles.bidSection}>
              {isOwner ? (
                <Button title="Kết thúc đấu giá ngay" variant="danger" icon="stop-circle" onPress={handleEndNow} />
              ) : (
                <>
                  <Text style={styles.minBidHint}>
                    Giá tối thiểu cho lượt tiếp theo: <Text style={styles.minBidValue}>{formatCurrency(minNextBid)}</Text>
                  </Text>
                  <View style={styles.quickBids}>
                    {[0, 1, 2].map((mult) => (
                      <Pressable
                        key={mult}
                        style={styles.quickBid}
                        onPress={() => setBidInput(String(minNextBid + mult * (product.bidIncrement ?? 0)))}>
                        <Text style={styles.quickBidText}>
                          {mult === 0 ? 'Min' : `+${mult}x`} · {formatCurrency(minNextBid + mult * (product.bidIncrement ?? 0))}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.bidInputRow}>
                    <View style={styles.bidInputWrap}>
                      <TextField
                        value={bidInput}
                        onChangeText={(t) => setBidInput(t.replace(/[^\d]/g, ''))}
                        placeholder={`Nhập giá tối thiểu ${formatCurrency(minNextBid)}`}
                        keyboardType="number-pad"
                      />
                    </View>
                    <Button
                      title="Đặt giá"
                      icon="gavel"
                      loading={placing}
                      onPress={handlePlaceBid}
                      style={styles.bidButton}
                    />
                  </View>
                </>
              )}
            </View>
          ) : null}

          {isAuction && ended ? (
            <View style={styles.winnerSection}>
              <Text style={styles.winnerTitle}>Kết quả đấu giá</Text>
              {product.winnerId ? (
                <>
                  <Text style={styles.winnerText}>
                    Người thắng cuộc: <Text style={styles.winnerName}>{product.winnerName ?? 'Đã xác định'}</Text>
                  </Text>
                  <Text style={styles.winnerPrice}>Giá chốt: {formatCurrency(currentPrice)}</Text>
                  {isWinner ? (
                    <Button
                      title="Đặt hàng ngay"
                      icon="payment"
                      style={styles.winnerButton}
                      onPress={() => router.push(`/orders/checkout?mode=auctionWin&productId=${product.id}`)}
                    />
                  ) : null}
                </>
              ) : (
                <Text style={styles.winnerText}>Kết thúc không có người thắng cuộc.</Text>
              )}
            </View>
          ) : null}

          {/* Description */}
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.description}>{product.description || 'Chưa có mô tả.'}</Text>

          {/* Seller */}
          <Text style={styles.sectionTitle}>Người bán</Text>
          <View style={styles.sellerCard}>
            <Avatar name={product.sellerName} uri={product.sellerAvatar} size={44} />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.sellerName}</Text>
              <Text style={styles.sellerDate}>Đăng lúc {formatDateTime(product.createdAt)}</Text>
            </View>
            {isOwner ? <Badge label="Bạn" backgroundColor={Colors.primarySoft} color={Colors.primary} /> : null}
          </View>

          {/* Bid history */}
          {isAuction && bids.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Lịch sử đấu giá</Text>
              <View style={styles.bidList}>
                {bids.map((bid, index) => (
                  <View key={bid.id} style={[styles.bidRow, index === 0 && styles.bidRowTop]}>
                    <Avatar name={bid.bidderName} size={30} />
                    <View style={styles.bidInfo}>
                      <Text style={styles.bidName}>
                        {bid.bidderId === user?.uid ? 'Bạn' : shortName(bid.bidderName)}
                        {index === 0 ? ' · đang dẫn đầu' : ''}
                      </Text>
                      <Text style={styles.bidTime}>{formatDateTime(bid.createdAt)}</Text>
                    </View>
                    <Text style={styles.bidAmount}>{formatCurrency(bid.amount)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Owner actions */}
          {isOwner && !isAuction ? (
            <View style={styles.ownerActions}>
              <Button
                title={sold ? 'Đã bán' : 'Đánh dấu đã bán'}
                variant={sold ? 'ghost' : 'success'}
                icon="check-circle"
                disabled={sold}
                onPress={handleMarkSold}
                style={styles.ownerAction}
              />
              <Button
                title="Chỉnh sửa"
                variant="outline"
                icon="edit"
                onPress={() => router.push(`/product/edit/${product.id}`)}
                style={styles.ownerAction}
              />
              <Button title="Xoá" variant="danger" icon="delete" onPress={handleDelete} style={styles.ownerAction} />
            </View>
          ) : null}

          {isOwner && isAuction && ended ? (
            <Button
              title="Chỉnh sửa sản phẩm"
              variant="outline"
              icon="edit"
              onPress={() => router.push(`/product/edit/${product.id}`)}
              style={styles.ownerAction}
            />
          ) : null}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom actions - fixed price */}
      {!isAuction ? (
        <View style={styles.bottomBar}>
          {isOwner ? (
            <View style={styles.bottomBarInner} />
          ) : sold ? (
            <View style={styles.bottomBarInner}>
              <Badge label="Sản phẩm đã bán" backgroundColor={Colors.textMuted} />
            </View>
          ) : (
            <View style={styles.bottomBarInner}>
              <Button
                title="Mua ngay"
                variant="outline"
                icon="flash-on"
                onPress={() => router.push(`/orders/checkout?mode=buyNow&productId=${product.id}`)}
                style={styles.buyNow}
              />
              <Button
                title="Thêm vào giỏ"
                icon="add-shopping-cart"
                loading={actionLoading}
                onPress={handleAddToCart}
                style={styles.addCart}
              />
            </View>
          )}
        </View>
      ) : null}
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 28,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  price: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primary,
  },
  auctionPanel: {
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  auctionPanelActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  auctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  auctionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  auctionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  statValueHighlight: {
    color: Colors.primary,
    fontSize: 18,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  auctionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  auctionMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  bidSection: {
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  minBidHint: {
    fontSize: 13,
    color: Colors.text,
  },
  minBidValue: {
    fontWeight: '900',
    color: Colors.primary,
  },
  quickBids: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickBid: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  quickBidText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  bidInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  bidInputWrap: {
    flex: 1,
  },
  bidButton: {
    marginBottom: 14,
  },
  winnerSection: {
    marginTop: 12,
    backgroundColor: Colors.successSoft,
    borderRadius: 16,
    padding: 14,
  },
  winnerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.success,
  },
  winnerText: {
    fontSize: 13,
    color: Colors.text,
    marginTop: 6,
  },
  winnerName: {
    fontWeight: '800',
    color: Colors.text,
  },
  winnerPrice: {
    fontSize: 13,
    color: Colors.text,
    marginTop: 2,
  },
  winnerButton: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 18,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  sellerDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bidList: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  bidRowTop: {
    backgroundColor: Colors.accentSoft,
  },
  bidInfo: {
    flex: 1,
  },
  bidName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  bidTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  bidAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  ownerActions: {
    marginTop: 18,
    gap: 10,
  },
  ownerAction: {
    marginTop: 18,
  },
  bottomBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomBarInner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  buyNow: {
    flex: 1,
  },
  addCart: {
    flex: 1,
  },
});