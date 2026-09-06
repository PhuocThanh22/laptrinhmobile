/**
 * Chức năng đấu giá nhẹ.
 *
 * Quy tắc:
 *  1. Phải đăng nhập mới được đấu giá (kiểm tra ở tầng UI/service gọi).
 *  2. Người bán không được đấu giá sản phẩm của mình.
 *  3. Giá đặt >= giá hiện tại + bước giá.
 *  4. Không được đấu giá sau khi hết thời gian.
 *  5. Mỗi lượt đấu lưu: bidderId, productId, amount, createdAt.
 *  6. Hết thời gian -> tìm bid cao nhất -> xác định winner.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';

import { requireFirebase } from './firebase';
import { sendAuctionWinEmail } from './mailService';
import { getUsersByIds } from './userService';
import { formatCurrency } from '@/utils/format';
import type { Bid, Product } from '@/types';

/** Winner phải hoàn tất đơn trong 24 giờ kể từ khi thắng — quá hạn chuyển quyền mua. */
export const WINNER_ORDER_WINDOW_MS = 24 * 3600_000;

/** Gửi email thông báo thắng cho winner (fire-and-forget, lỗi bỏ qua). */
async function notifyAuctionWinner(input: {
  productName: string;
  winnerId: string;
  amount: number;
}): Promise<void> {
  try {
    const users = await getUsersByIds([input.winnerId]);
    const winner = users[input.winnerId];
    if (!winner?.email) return;
    await sendAuctionWinEmail({
      email: winner.email,
      name: winner.name,
      productName: input.productName,
      amount: formatCurrency(input.amount),
    });
  } catch {
    // Gửi mail thất bại không ảnh hưởng nghiệp vụ đấu giá.
  }
}

/** Thực hiện một lượt đấu giá. Ném Error với thông báo tiếng Việt nếu không hợp lệ. */
export async function placeBid(input: {
  productId: string;
  bidderId: string;
  amount: number;
}): Promise<void> {
  const { db } = requireFirebase();

  // Nếu phiên đã hết giờ, kết thúc luôn để xác định winner (best-effort).
  const preCheck = await getDoc(doc(db, 'products', input.productId));
  if (preCheck.exists()) {
    const p = { id: input.productId, ...preCheck.data() } as Product;
    if (p.status === 'auction_active' && p.endTime && p.endTime <= Date.now()) {
      await endAuction(input.productId);
    }
  }

  // Transaction để "đọc - kiểm tra - ghi" là nguyên tử:
  // 2 người cùng đặt giá một lúc sẽ không cùng vượt qua kiểm tra
  // (giá hiện tại được đọc lại trong transaction, người ghi trước thắng).
  const bidRef = doc(collection(db, 'bids'));

  try {
    await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(doc(db, 'products', input.productId));
      if (!productSnap.exists()) throw new Error('Sản phẩm không tồn tại.');
      const product = { id: input.productId, ...productSnap.data() } as Product;

      // Quy tắc 2
      if (product.sellerId === input.bidderId) {
        throw new Error('Bạn không thể đấu giá sản phẩm của chính mình.');
      }

      // Quy tắc 4
      if (product.endTime && product.endTime <= Date.now()) {
        throw new Error('Đấu giá đã kết thúc.');
      }

      if (product.status !== 'auction_active') {
        throw new Error('Sản phẩm này không còn nhận đấu giá.');
      }

      // Quy tắc 3
      const current = product.currentPrice ?? product.startingPrice ?? 0;
      const increment = product.bidIncrement ?? 0;
      const minBid = current + increment;
      if (input.amount < minBid) {
        throw new Error(`Giá đấu tối thiểu là ${minBid.toLocaleString('vi-VN')}đ (giá hiện tại + bước giá).`);
      }
      if (input.amount <= current) {
        throw new Error('Giá đấu phải cao hơn giá hiện tại.');
      }

      // Quy tắc 5
      transaction.set(bidRef, {
        productId: input.productId,
        bidderId: input.bidderId,
        amount: input.amount,
        createdAt: Date.now(),
      });

      transaction.update(doc(db, 'products', input.productId), {
        currentPrice: input.amount,
        bidsCount: (product.bidsCount ?? 0) + 1,
      });
    });
  } catch (e) {
    // Ném lại lỗi nghiệp vụ (sản phẩm đã bán, giá không hợp lệ, ...).
    throw e;
  }
}

/** Kết thúc đấu giá: xác định người thắng (bid cao nhất, ai đặt trước thì thắng). */
export async function endAuction(productId: string): Promise<void> {
  const { db } = requireFirebase();

  const productSnap = await getDoc(doc(db, 'products', productId));
  if (!productSnap.exists()) return;
  const product = { id: productId, ...productSnap.data() } as Product;
  if (product.status !== 'auction_active') return;

  const bids = await getBidsForProduct(productId);
  const highest = bids.length
    ? bids.reduce((best, b) => (b.amount > best.amount ? b : best), bids[0])
    : null;

  const now = Date.now();
  await updateDoc(doc(db, 'products', productId), {
    status: 'auction_ended',
    winnerId: highest ? highest.bidderId : null,
    currentPrice: highest ? highest.amount : product.currentPrice ?? product.startingPrice ?? 0,
    // Winner có 24h để đặt hàng; quá hạn quyền mua chuyển cho người kế tiếp.
    winnerDeadline: highest ? now + WINNER_ORDER_WINDOW_MS : null,
    pastWinners: [],
  });

  // Email thông báo thắng cho winner (bắt buộc vào app điền thông tin nhận hàng).
  if (highest) {
    await notifyAuctionWinner({
      productName: product.name,
      winnerId: highest.bidderId,
      amount: highest.amount,
    });
  }
}

/**
 * Huỷ quyền mua của winner đã bỏ cuộc (quá hạn không đặt hàng) và chuyển
 * cho người đặt giá cao nhất tiếp theo (không tính các winner đã bỏ cuộc).
 * Không còn ứng viên -> sản phẩm kết thúc không có người thắng.
 */
export async function revokeExpiredWinner(productId: string): Promise<void> {
  const { db } = requireFirebase();

  const snap = await getDoc(doc(db, 'products', productId));
  if (!snap.exists()) return;
  const p = { id: productId, ...snap.data() } as Product;
  if (p.status !== 'auction_ended' || !p.winnerId) return;
  if ((p.winnerDeadline ?? Number.MAX_SAFE_INTEGER) > Date.now()) return;

  const pastWinners = [...(p.pastWinners ?? []), p.winnerId];
  const bids = await getBidsForProduct(productId);
  // bids đã sắp xếp giảm dần theo giá — người hợp lệ đầu tiên là người kế nhiệm.
  const next = bids.find((b) => !pastWinners.includes(b.bidderId)) ?? null;

  await updateDoc(doc(db, 'products', productId), {
    winnerId: next ? next.bidderId : null,
    currentPrice: next ? next.amount : p.currentPrice ?? p.startingPrice ?? 0,
    winnerDeadline: next ? Date.now() + WINNER_ORDER_WINDOW_MS : null,
    pastWinners,
  });

  if (next) {
    await notifyAuctionWinner({
      productName: p.name,
      winnerId: next.bidderId,
      amount: next.amount,
    });
  }
}

/** Quét và huỷ quyền mua của các winner đã quá hạn đặt hàng. */
export async function enforceWinnerDeadlines(): Promise<void> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'products'), where('status', '==', 'auction_ended'));
  const snap = await getDocs(q);
  const now = Date.now();
  const overdue = snap.docs.filter((d) => {
    const data = d.data() as Product;
    return !!data.winnerId && (data.winnerDeadline ?? Number.MAX_SAFE_INTEGER) <= now;
  });
  for (const d of overdue) {
    await revokeExpiredWinner(d.id);
  }
}

/** Quét và kết thúc các phiên đấu giá đã hết thời gian. */
export async function endExpiredAuctions(): Promise<void> {
  const { db } = requireFirebase();
  const productQuery = query(
    collection(db, 'products'),
    where('status', '==', 'auction_active'),
  );
  const snap = await getDocs(productQuery);
  const now = Date.now();
  const expired = snap.docs.filter((d) => (d.data().endTime ?? 0) <= now);
  for (const d of expired) {
    await endAuction(d.id);
  }

  // Sau khi chốt phiên, kiểm tra thêm các winner bỏ cuộc quá hạn.
  await enforceWinnerDeadlines();
}

/** Lịch sử đấu giá của một sản phẩm (theo giá giảm dần). */
/**
 * Lịch sử đấu giá của một sản phẩm (giá giảm dần, cùng giá thì ai đặt trước lên trước),
 * kèm tên người đấu (bidderName) để hiển thị.
 */
export async function getBidsForProduct(productId: string): Promise<Bid[]> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'bids'), where('productId', '==', productId));
  const snap = await getDocs(q);
  const bids = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Bid);
  bids.sort((a, b) => b.amount - a.amount || a.createdAt - b.createdAt);

  const users = await getUsersByIds(bids.map((b) => b.bidderId));
  return bids.map((b) => ({ ...b, bidderName: users[b.bidderId]?.name ?? 'Ẩn danh' }));
}

/** Các phiếu đấu của tôi (kèm thông tin sản phẩm). */
export async function getMyBids(userId: string): Promise<{ bid: Bid; product: Product }[]> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'bids'), where('bidderId', '==', userId));
  const snap = await getDocs(q);
  const bids = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Bid);
  bids.sort((a, b) => b.createdAt - a.createdAt);

  const productIds = Array.from(new Set(bids.map((b) => b.productId)));
  const products: Product[] = [];
  for (const id of productIds) {
    const ps = await getDoc(doc(db, 'products', id));
    if (ps.exists()) products.push({ id, ...ps.data() } as Product);
  }

  const users = await getUsersByIds(bids.map((b) => b.bidderId));
  return bids
    .filter((b) => products.some((p) => p.id === b.productId))
    .map((b) => ({
      bid: { ...b, bidderName: users[b.bidderId]?.name ?? 'Ẩn danh' },
      product: products.find((p) => p.id === b.productId)!,
    }));
}