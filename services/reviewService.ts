/**
 * Đánh giá sản phẩm: chỉ cho phép khi đơn đã completed và là người mua.
 */
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';

import { requireFirebase } from './firebase';
import { getUsersByIds } from './userService';
import type { Review } from '@/types';

export async function createReview(input: {
  productId: string;
  orderId: string;
  reviewerId: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  const { db } = requireFirebase();
  if (input.rating < 1 || input.rating > 5) throw new Error('Đánh giá phải từ 1 đến 5 sao.');
  if (!input.comment.trim()) throw new Error('Vui lòng nhập nhận xét.');
  if (input.comment.trim().length > 500) throw new Error('Nhận xét tối đa 500 ký tự.');

  // kiểm tra đã review chưa (1 review / product+order+reviewer)
  const q = query(
    collection(db, 'reviews'),
    where('productId', '==', input.productId),
    where('orderId', '==', input.orderId),
    where('reviewerId', '==', input.reviewerId),
  );
  const snap = await getDocs(q);
  if (!snap.empty) throw new Error('Bạn đã đánh giá sản phẩm này trong đơn này rồi.');

  // kiểm tra order completed & chứa product (ở tầng app đã kiểm, nhưng check thêm)
  const { getOrderById } = await import('./orderService');
  const order = await getOrderById(input.orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng.');
  if (order.buyerId !== input.reviewerId) throw new Error('Chỉ người mua mới được đánh giá.');
  if (order.status !== 'completed') throw new Error('Chỉ đánh giá khi đơn đã hoàn thành.');
  if (!order.items.some((it) => it.productId === input.productId)) throw new Error('Sản phẩm không thuộc đơn này.');

  const ref = await addDoc(collection(db, 'reviews'), {
    productId: input.productId,
    orderId: input.orderId,
    reviewerId: input.reviewerId,
    rating: input.rating,
    comment: input.comment.trim(),
    createdAt: Date.now(),
  });
  return {
    id: ref.id,
    productId: input.productId,
    orderId: input.orderId,
    reviewerId: input.reviewerId,
    rating: input.rating,
    comment: input.comment.trim(),
    createdAt: Date.now(),
  };
}

export async function getReviewsForProduct(productId: string): Promise<Review[]> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'reviews'), where('productId', '==', productId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
  list.sort((a, b) => b.createdAt - a.createdAt);
  const users = await getUsersByIds(list.map((r) => r.reviewerId));
  return list.map((r) => ({
    ...r,
    reviewerName: users[r.reviewerId]?.name ?? 'Ẩn danh',
    reviewerAvatar: users[r.reviewerId]?.avatar ?? '',
  }));
}

export async function getReviewsForOrders(orderIds: string[]): Promise<Review[]> {
  if (!orderIds.length) return [];
  const { db } = requireFirebase();
  // Firestore whereIn max 10, chunk if needed (simple loop)
  const results: Review[] = [];
  for (const oid of orderIds) {
    const q = query(collection(db, 'reviews'), where('orderId', '==', oid));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => results.push({ id: d.id, ...d.data() } as Review));
  }
  return results;
}

export function calcRatingStats(reviews: Review[]): { avg: number; count: number } {
  if (!reviews.length) return { avg: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}
