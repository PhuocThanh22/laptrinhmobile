/**
 * Giỏ hàng. Lưu document `carts/{userId}` trong Firestore.
 *
 * Mỗi item chỉ gồm { productId, quantity }. Thông tin sản phẩm được lấy
 * động để hiển thị (luôn cập nhật theo giá hiện tại).
 */
import {
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { requireFirebase } from './firebase';
import { getProductById } from './productService';
import type { CartDocument, CartItem, Product } from '@/types';

/**
 * Đọc document giỏ hàng của user. Nếu chưa tồn tại thì tạo mới giỏ rỗng.
 */
async function getCartDoc(userId: string): Promise<CartDocument> {
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, 'carts', userId));
  if (!snap.exists()) {
    const empty: CartDocument = { userId, items: [], updatedAt: Date.now() };
    await setDoc(doc(db, 'carts', userId), empty);
    return empty;
  }
  return snap.data() as CartDocument;
}

/** Lấy danh sách item trong giỏ (chỉ productId + quantity). */
export async function getCart(userId: string): Promise<CartItem[]> {
  const cart = await getCartDoc(userId);
  return cart.items ?? [];
}

/** Lấy giỏ hàng kèm thông tin sản phẩm (để hiển thị). */
export async function getCartWithProducts(userId: string): Promise<(CartItem & { product: Product })[]> {
  const items = await getCart(userId);
  const result: (CartItem & { product: Product })[] = [];
  for (const item of items) {
    const product = await getProductById(item.productId);
    if (product) result.push({ ...item, product });
  }
  return result;
}

/**
 * Thêm sản phẩm vào giỏ.
 * - Không cho thêm: sản phẩm đấu giá đang diễn ra, sản phẩm đã bán, đấu giá đã kết thúc.
 * - Nếu sản phẩm đã có trong giỏ thì tăng số lượng, ngược lại thêm item mới.
 */
export async function addToCart(userId: string, productId: string, quantity = 1): Promise<void> {
  const { db } = requireFirebase();
  const product = await getProductById(productId);
  if (!product) throw new Error('Sản phẩm không tồn tại.');

  // Không cho thêm sản phẩm đấu giá đang diễn ra vào giỏ.
  if (product.saleType === 'auction' && product.status === 'auction_active') {
    throw new Error('Sản phẩm đấu giá không thể thêm vào giỏ hàng.');
  }
  if (product.status === 'sold') throw new Error('Sản phẩm đã được bán.');
  if (product.status === 'auction_ended') {
    throw new Error('Vui lòng đặt hàng từ màn hình đấu giá nếu bạn là người thắng.');
  }

  const ref = doc(db, 'carts', userId);
  const cart = await getCartDoc(userId);
  const existing = (cart.items ?? []).find((i) => i.productId === productId);

  if (existing) {
    await updateDoc(ref, {
      items: (cart.items ?? []).map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i,
      ),
      updatedAt: Date.now(),
    });
  } else {
    await updateDoc(ref, {
      items: arrayUnion({ productId, quantity }),
      updatedAt: Date.now(),
    });
  }
}

/**
 * Đổi số lượng một item trong giỏ. Nếu quantity <= 0 thì item bị loại bỏ.
 */
export async function updateCartQuantity(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const { db } = requireFirebase();
  const cart = await getCartDoc(userId);
  const items = (cart.items ?? [])
    .map((i) => (i.productId === productId ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  await updateDoc(doc(db, 'carts', userId), { items, updatedAt: Date.now() });
}

/** Xoá một sản phẩm khỏi giỏ. */
export async function removeFromCart(userId: string, productId: string): Promise<void> {
  const { db } = requireFirebase();
  const cart = await getCartDoc(userId);
  const items = (cart.items ?? []).filter((i) => i.productId !== productId);
  await updateDoc(doc(db, 'carts', userId), { items, updatedAt: Date.now() });
}

/** Xoá sạch toàn bộ items trong giỏ (dùng sau khi đặt hàng thành công). */
export async function clearCart(userId: string): Promise<void> {
  const { db } = requireFirebase();
  await updateDoc(doc(db, 'carts', userId), { items: [], updatedAt: Date.now() });
}