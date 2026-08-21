import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { requireFirebase } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  configureNotificationHandler,
  ensureNotificationPermission,
  sendLocalNotification,
  setupNotificationChannel,
} from '@/services/notificationService';

/**
 * Hook bắn local notification cho: tin nhắn mới, đơn đổi trạng thái, bị vượt giá.
 * Chỉ chạy trên native, web bỏ qua.
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function usePushNotifications() {
  const { user } = useAuth();
  const lastMessageAtRef = useRef<Record<string, number>>({});
  const lastOrderStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGo() || !user) return;
    try {
      void configureNotificationHandler();
      void ensureNotificationPermission().then((ok) => {
        if (ok) void setupNotificationChannel();
      });
    } catch {
      // Expo Go SDK 53+ hạn chế notifications — bỏ qua
    }
  }, [user]);

  // 1) Tin nhắn mới: lắng nghe conversations của user
  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGo() || !user) return;
    let unsubConv: (() => void) | undefined;
    let messageUnsubs: Array<() => void> = [];

    const { db } = (() => {
      try {
        return requireFirebase();
      } catch {
        return { db: null } as never;
      }
    })();
    if (!db) return;

    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
    unsubConv = onSnapshot(
      q,
      (snap) => {
        // cleanup cũ
        messageUnsubs.forEach((u) => u());
        messageUnsubs = [];

        snap.docs.forEach((d) => {
          const convId = d.id;
          const data = d.data() as { participants: string[]; productName?: string | null };
          // subscribe messages của từng conversation
          const mq = query(collection(db, 'conversations', convId, 'messages'));
          const unsubMsg = onSnapshot(
            mq,
            (msgSnap) => {
              msgSnap.docChanges().forEach((chg) => {
                if (chg.type !== 'added') return;
                const msg = chg.doc.data() as { senderId: string; text: string; createdAt: number };
                if (msg.senderId === user.uid) return;
                const key = `${convId}_${chg.doc.id}`;
                if (lastMessageAtRef.current[key]) return;
                lastMessageAtRef.current[key] = msg.createdAt;
                if (Date.now() - msg.createdAt > 60000) return;
                const title = data.productName ? `Tin nhắn về ${data.productName}` : 'Tin nhắn mới';
                void sendLocalNotification(title, msg.text.slice(0, 80));
              });
            },
            () => {
              // ignore permission error for messages subcollection — đã xử lý ở list
            },
          );
          messageUnsubs.push(unsubMsg);
        });
      },
      () => {
        // Lỗi Missing permissions ở đây thường do rules chưa deploy hoặc user chưa đăng nhập — nuốt để không crash
      },
    );

    return () => {
      unsubConv?.();
      messageUnsubs.forEach((u) => u());
    };
  }, [user]);

  // 2) Đơn hàng: lắng nghe orders mua/bán, khi status đổi thì báo
  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGo() || !user) return;
    let unsubs: Array<() => void> = [];
    const { db } = (() => {
      try {
        return requireFirebase();
      } catch {
        return { db: null } as never;
      }
    })();
    if (!db) return;

    const q1 = query(collection(db, 'orders'), where('buyerId', '==', user.uid));
    const q2 = query(collection(db, 'orders'), where('sellerIds', 'array-contains', user.uid));

    const handleSnap = (snap: FirebaseFirestoreTypesSnapshot) => {
      // generic: check docChanges
      snap.docChanges().forEach((chg: { type: string; doc: { id: string; data: () => { status: string; buyerId: string } } }) => {
        if (chg.type === 'modified') {
          const id = chg.doc.id;
          const status = chg.doc.data().status;
          const prev = lastOrderStatusRef.current[id];
          if (prev && prev !== status) {
            const isBuyer = chg.doc.data().buyerId === user.uid;
            const title = isBuyer ? 'Đơn hàng cập nhật' : 'Có đơn cần xử lý';
            sendLocalNotification(title, `Đơn #${id.slice(0, 6)} chuyển sang ${status}`);
          }
          lastOrderStatusRef.current[id] = status;
        } else if (chg.type === 'added') {
          lastOrderStatusRef.current[chg.doc.id] = chg.doc.data().status;
        }
      });
    };

    const u1 = onSnapshot(q1 as never, handleSnap as never, () => {});
    const u2 = onSnapshot(q2 as never, handleSnap as never, () => {});
    unsubs = [u1, u2];
    return () => unsubs.forEach((u) => u());
  }, [user]);

  // 3) Bị vượt giá: nếu user từng đấu mà có người khác đấu cao hơn
  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGo() || !user) return;
    let unsubBids: (() => void) | undefined;
    let productIds: string[] = [];
    const { db } = (() => {
      try {
        return requireFirebase();
      } catch {
        return { db: null } as never;
      }
    })();
    if (!db) return;

    // lấy productIds user từng bid — sau đó chỉ lắng nghe bids của các product đó (tránh query toàn bộ bids)
    const seen = new Set<string>();
    let unsubAll: (() => void) | undefined;
    const qMine = query(collection(db, 'bids'), where('bidderId', '==', user.uid));
    unsubBids = onSnapshot(
      qMine,
      (snap) => {
        const ids = Array.from(new Set(snap.docs.map((d) => (d.data() as { productId: string }).productId)));
        if (ids.length === productIds.length && ids.every((v, i) => v === productIds[i])) return;
        productIds = ids;
        unsubAll?.();
        if (!productIds.length) return;
        const chunk = productIds.slice(0, 10);
        const qChunk = query(collection(db, 'bids'), where('productId', 'in', chunk));
        unsubAll = onSnapshot(
          qChunk,
          (snap2) => {
            snap2.docChanges().forEach((chg) => {
              if (chg.type !== 'added') return;
              const data = chg.doc.data() as { productId: string; bidderId: string; amount: number; createdAt: number };
              if (data.bidderId === user.uid) return;
              if (seen.has(chg.doc.id)) return;
              seen.add(chg.doc.id);
              if (Date.now() - data.createdAt > 60000) return;
              void sendLocalNotification('Bị vượt giá!', `Có người vừa đặt ${data.amount.toLocaleString('vi-VN')}đ cao hơn bạn.`);
            });
          },
          () => {},
        );
      },
      () => {},
    );

    return () => {
      unsubBids?.();
      unsubAll?.();
    };
  }, [user]);

  // lắng nghe sự kiện click notification để điều hướng (tuỳ chọn)
  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGo()) return;
    let sub: { remove: () => void } | undefined;
    void (async () => {
      const N = await import('expo-notifications');
      sub = N.addNotificationResponseReceivedListener((resp) => {
        void resp;
      });
    })();
    return () => sub?.remove();
  }, []);
}

// helper type fallback
type FirebaseFirestoreTypesSnapshot = {
  docChanges: () => Array<{
    type: string;
    doc: { id: string; data: () => { status: string; buyerId: string } };
  }>;
};
