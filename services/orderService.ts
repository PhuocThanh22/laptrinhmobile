/**
 * Quản lý đơn hàng trên Cloud Firestore.
 *
 * - Checkout từ giỏ hàng: các sản phẩm giá cố định.
 * - Checkout từ đấu giá: chỉ người thắng cuộc mới được đặt hàng
 *   (server-side-ish kiểm tra ngay trong service).
 * - Thanh toán mặc định: COD.
 */
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';

import { requireFirebase } from './firebase';
import { getSingleUser } from './userService';
import type { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus, Product } from '@/types';

export interface CreateOrderInput {
  buyerId: string;
  items: OrderItem[];
  receiverName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod?: PaymentMethod;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { db } = requireFirebase();

  if (!input.items.length) throw new Error('Đơn hàng trống.');

  const totalAmount = input.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const buyer = await getSingleUser(input.buyerId);

  const orderRef = doc(collection(db, 'orders'));
  const paymentMethod: PaymentMethod = input.paymentMethod ?? 'cod';
  const paymentStatus: PaymentStatus = paymentMethod === 'vietqr' ? 'pending' : 'paid';
  const orderData: Omit<Order, 'id'> = {
    buyerId: input.buyerId,
    buyerName: buyer?.name ?? '',
    sellerIds: [],
    items: input.items,
    totalAmount,
    receiverName: input.receiverName.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    note: input.note?.trim() ?? '',
    paymentMethod,
    paymentStatus,
    status: 'pending',
    createdAt: Date.now(),
    paidAt: paymentStatus === 'paid' ? Date.now() : null,
  };

  // Dùng transaction để "đọc - kiểm tra - ghi" là một thao tác nguyên tử:
  // nếu 2 người cùng mua 1 sản phẩm (số lượng = 1), chỉ người ghi thành công
  // trước mới tạo được đơn; người kia đọc lại thấy status = 'sold' -> bị chặn.
  try {
    await runTransaction(db, async (transaction) => {
      const sellerIds: string[] = [];

      for (const item of input.items) {
        const snap = await transaction.get(doc(db, 'products', item.productId));
        if (!snap.exists()) throw new Error(`Sản phẩm "${item.name}" không tồn tại.`);
        const product = { id: item.productId, ...snap.data() } as Product;

        if (product.status === 'sold') throw new Error(`Sản phẩm "${item.name}" đã được bán.`);

        if (item.saleType === 'auction') {
          // Chỉ người thắng đấu giá được checkout sản phẩm đấu giá.
          if (product.winnerId !== input.buyerId) {
            throw new Error('Bạn không phải người thắng cuộc của sản phẩm đấu giá này.');
          }
          if (product.status !== 'auction_ended') {
            throw new Error('Đấu giá chưa kết thúc, không thể đặt hàng.');
          }
          // Bắt buộc đặt hàng trong hạn 24h — quá hạn quyền mua đã/chuyển người khác.
          if (product.winnerDeadline && Date.now() > product.winnerDeadline) {
            throw new Error('Đã quá hạn 24 giờ đặt hàng sau khi thắng đấu giá.');
          }
          // Đánh dấu sold để ẩn khỏi danh sách (đấu giá đã kết thúc).
          transaction.update(doc(db, 'products', item.productId), { status: 'sold' });
        } else if (product.status === 'active') {
          transaction.update(doc(db, 'products', item.productId), { status: 'sold' });
        }

        if (!sellerIds.includes(product.sellerId)) sellerIds.push(product.sellerId);
      }

      orderData.sellerIds = sellerIds;
      transaction.set(orderRef, orderData);
    });
  } catch (e) {
    // Ném lại lỗi nghiệp vụ (sản phẩm đã bán, không phải người thắng cuộc, ...).
    throw e;
  }

  return { id: orderRef.id, ...orderData } as Order;
}

/** Đơn hàng tôi đã mua. */
export async function getMyOrders(buyerId: string): Promise<Order[]> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'orders'), where('buyerId', '==', buyerId));
  const snap = await getDocs(q);
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  orders.sort((a, b) => b.createdAt - a.createdAt);
  return orders;
}

/** Đơn hàng tôi nhận được (có chứa sản phẩm của tôi). */
export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'orders'), where('sellerIds', 'array-contains', sellerId));
  const snap = await getDocs(q);
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  orders.sort((a, b) => b.createdAt - a.createdAt);
  return orders;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { db } = requireFirebase();
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'orders', orderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { db } = requireFirebase();
  await updateDoc(doc(db, 'orders', orderId), { status });
}

export async function updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<void> {
  const { db } = requireFirebase();
  await updateDoc(doc(db, 'orders', orderId), {
    paymentStatus,
    paidAt: paymentStatus === 'paid' ? Date.now() : null,
  });
}