import { doc, getDoc } from 'firebase/firestore';

import { requireFirebase } from './firebase';
import type { AppUser } from '@/types';

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

export async function getSingleUser(uid: string): Promise<AppUser | null> {
  if (!uid) return null;
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<AppUser, 'uid'>) };
}