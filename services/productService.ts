/**
 * Quản lý sản phẩm trên Cloud Firestore.
 *
 * - Sản phẩm giá cố định: status `active` -> `sold`.
 * - Sản phẩm đấu giá: status `auction_active` -> `auction_ended`.
 *
 * Các query chỉ dùng 1 trường để KHÔNG cần tạo composite index phức tạp;
 * việc sắp xếp/lọc thêm được thực hiện ở client.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { requireFirebase } from './firebase';
import { getSingleUser, getUsersByIds } from './userService';
import type { Bid, Product, SaleType } from '@/types';

export interface NewProductInput {
  name: string;
  description: string;
  category: string;
  images: string[];
  video?: string | null;
  condition: string;
  saleType: SaleType;
  price?: number;
  startingPrice?: number;
  bidIncrement?: number;
  endTime?: number;
}

function hydrate(products: Product[]): Promise<Product[]> {
  return enrichWithSellers(products);
}

async function enrichWithSellers(products: Product[]): Promise<Product[]> {
  const sellerIds = products.map((p) => p.sellerId);
  const users = await getUsersByIds(sellerIds);
  return products.map((p) => ({
    ...p,
    sellerName: users[p.sellerId]?.name ?? 'Người bán',
    sellerAvatar: users[p.sellerId]?.avatar ?? '',
  }));
}

/** Lấy tất cả sản phẩm, mới nhất trước. Lọc/sắp xếp tiếp ở client. */
export async function getAllProducts(): Promise<Product[]> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
  return hydrate(products);
}

/**
 * Lấy một sản phẩm theo id. Trả về `null` nếu không tồn tại.
 * Kèm thông tin người bán (sellerName, sellerAvatar) để hiển thị.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, 'products', id));
  if (!snap.exists()) return null;
  const [hydrated] = await hydrate([{ id: snap.id, ...snap.data() } as Product]);
  return hydrated;
}

/** Sản phẩm do một người bán cụ thể đăng. */
export async function getProductsBySeller(sellerId: string): Promise<Product[]> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'products'), where('sellerId', '==', sellerId));
  const snap = await getDocs(q);
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
  products.sort((a, b) => b.createdAt - a.createdAt);
  return hydrate(products);
}

/**
 * Tạo sản phẩm mới.
 * - Sản phẩm giá cố định: status = `active`, lưu `price`.
 * - Sản phẩm đấu giá: status = `auction_active`, lưu startingPrice/currentPrice/bidIncrement/
 *   startTime/endTime/bidsCount/winnerId.
 * - Gắn sellerLocation lấy từ profile người bán (nếu có) để hiển thị vị trí.
 */
export async function createProduct(sellerId: string, input: NewProductInput): Promise<Product> {
  const { db } = requireFirebase();
  const now = Date.now();

  // Lấy vị trí từ profile người bán (nếu có) để hiển thị trên sản phẩm.
  let sellerLocation: Product['sellerLocation'];
  try {
    const user = await getSingleUser(sellerId);
    sellerLocation = user?.location;
  } catch {
    sellerLocation = undefined;
  }

  const base = {
    sellerId,
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category,
    images: input.images,
    video: input.video ?? null,
    condition: input.condition,
    saleType: input.saleType,
    sellerLocation: sellerLocation ?? null,
    createdAt: now,
  };

  const docRef =
    input.saleType === 'auction'
      ? await addDoc(collection(db, 'products'), {
          ...base,
          startingPrice: input.startingPrice,
          currentPrice: input.startingPrice,
          bidIncrement: input.bidIncrement,
          startTime: now,
          endTime: input.endTime,
          bidsCount: 0,
          winnerId: null,
          status: 'auction_active',
        })
      : await addDoc(collection(db, 'products'), {
          ...base,
          price: input.price,
          status: 'active',
        });

  const snap = await getDoc(doc(db, 'products', docRef.id));
  return { id: docRef.id, ...snap.data() } as Product;
}

/**
 * Cập nhật một/một số trường sản phẩm (name/description được trim trước khi lưu).
 */
export async function updateProduct(id: string, input: Partial<NewProductInput>): Promise<void> {
  const { db } = requireFirebase();
  const patch: Record<string, unknown> = { ...input };
  if ('name' in patch && patch.name) patch.name = String(patch.name).trim();
  if ('description' in patch && patch.description) patch.description = String(patch.description).trim();
  await updateDoc(doc(db, 'products', id), patch);
}

/** Xoá vĩnh viễn một sản phẩm khỏi Firestore. */
export async function deleteProduct(id: string): Promise<void> {
  const { db } = requireFirebase();
  await deleteDoc(doc(db, 'products', id));
}

/** Đánh dấu sản phẩm giá cố định đã bán. */
export async function markProductAsSold(id: string): Promise<void> {
  const { db } = requireFirebase();
  await updateDoc(doc(db, 'products', id), { status: 'sold' });
}

/** Lịch sử đấu giá của một sản phẩm (mới nhất trước). */
export async function getBidsForProduct(productId: string): Promise<Bid[]> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'bids'), where('productId', '==', productId));
  const snap = await getDocs(q);
  const bids = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Bid);
  bids.sort((a, b) => b.amount - a.amount || b.createdAt - a.createdAt);

  const users = await getUsersByIds(bids.map((b) => b.bidderId));
  return bids.map((b) => ({ ...b, bidderName: users[b.bidderId]?.name ?? 'Ẩn danh' }));
}