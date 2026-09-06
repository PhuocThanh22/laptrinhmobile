/**
 * Truy vấn thông tin người dùng từ collection `users` trên Firestore.
 * Chỉ đọc (không ghi) — mọi thao tác cập nhật profile nằm ở `authService`.
 */
import { doc, getDoc } from 'firebase/firestore';

import { requireFirebase } from './firebase';
import type { AppUser } from '@/types';

/**
 * Lấy nhiều user cùng lúc theo danh sách uid.
 * - Bỏ qua uid trống/trùng để giảm số request.
 * - Trả về object map `{ [uid]: AppUser }` — user nào không tồn tại sẽ không có key.
 */
export async function getUsersByIds(ids: string[]): Promise<Record<string, AppUser>> {
  const { db } = requireFirebase();
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const result: Record<string, AppUser> = {};
  await Promise.all(
    uniqueIds.map(async (uid) => {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data() as Omit<AppUser, 'uid'>;
        result[uid] = { uid, ...data };
      }
    }),
  );
  return result;
}

/**
 * Lấy một user theo uid. Trả về `null` nếu uid rỗng hoặc document không tồn tại.
 */
export async function getSingleUser(uid: string): Promise<AppUser | null> {
  if (!uid) return null;
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<AppUser, 'uid'>) };
}