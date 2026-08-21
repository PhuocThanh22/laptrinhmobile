/**
 * Chat 1-1 + theo sản phẩm / đơn hàng.
 * Hỗ trợ cả 2 dạng: global DM (productId=null) và chat theo sản phẩm (productId set).
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { requireFirebase } from './firebase';

export interface Conversation {
  id: string;
  participants: string[]; // [uid1, uid2] sorted
  participantsKey: string; // uid1_uid2
  productId?: string | null;
  productName?: string | null;
  productImage?: string | null;
  lastMessage?: string;
  lastMessageAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

function sortedKey(a: string, b: string) {
  return [a, b].sort().join('_');
}

export async function getOrCreateConversation(input: {
  currentUserId: string;
  otherUserId: string;
  productId?: string | null;
  productName?: string | null;
  productImage?: string | null;
}): Promise<string> {
  const { db } = requireFirebase();
  if (input.currentUserId === input.otherUserId) throw new Error('Không thể nhắn với chính mình.');
  const participants = [input.currentUserId, input.otherUserId].sort();
  const key = sortedKey(input.currentUserId, input.otherUserId);
  const productId = input.productId ?? null;

  // tìm conversation trùng — chỉ dùng array-contains để khớp rule `request.auth.uid in resource.data.participants`
  // (query theo participantsKey + productId sẽ bị rules chặn vì không chứng minh được participants chứa auth.uid)
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', input.currentUserId));
  const snap = await getDocs(q);
  const found = snap.docs.find((d) => {
    const data = d.data() as Conversation;
    return data.participantsKey === key && (data.productId ?? null) === productId;
  });
  if (found) return found.id;

  // tạo mới
  const now = Date.now();
  const ref = await addDoc(collection(db, 'conversations'), {
    participants,
    participantsKey: key,
    productId,
    productName: input.productName ?? null,
    productImage: input.productImage ?? null,
    lastMessage: '',
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation);
  list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  return list;
}

export function subscribeConversations(
  userId: string,
  cb: (list: Conversation[]) => void,
  onError?: (e: unknown) => void,
): Unsubscribe {
  const { db } = requireFirebase();
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation);
      list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      cb(list);
    },
    (e) => onError?.(e),
  );
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, 'conversations', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Conversation;
}

export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<void> {
  const { db } = requireFirebase();
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Tin nhắn trống.');
  if (trimmed.length > 1000) throw new Error('Tin nhắn quá dài (tối đa 1000 ký tự).');
  const now = Date.now();
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId,
    text: trimmed,
    createdAt: now,
  });
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: trimmed.slice(0, 80),
    lastMessageAt: now,
    updatedAt: now,
  });
}

export function subscribeMessages(
  conversationId: string,
  cb: (msgs: ChatMessage[]) => void,
  onError?: (e: unknown) => void,
): Unsubscribe {
  const { db } = requireFirebase();
  const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage);
      cb(msgs);
    },
    (e) => onError?.(e),
  );
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { db } = requireFirebase();
  const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage);
}
