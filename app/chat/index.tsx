import { ChevronRight, CircleAlert, MessageCircle, Package } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getUsersByIds } from '@/services/userService';
import { subscribeConversations, type Conversation } from '@/services/chatService';
import { formatDateTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import type { AppUser } from '@/types';

import { safeBack } from '@/utils/navigation';
export default function ChatListScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeConversations(
      user.uid,
      async (list) => {
        setConversations(list);
        const otherIds = list.map((c) => c.participants.find((p) => p !== user.uid)!).filter(Boolean);
        if (otherIds.length) {
          try {
            const map = await getUsersByIds(otherIds);
            setUsers(map);
          } catch {}
        }
        setLoading(false);
        setError(null);
      },
      (e: unknown) => {
        setError(getErrorMessage(e));
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Tin nhắn" onBack={safeBack} />
        <Loading text="Đang tải hội thoại..." />
      </Screen>
    );
  }

  if (error) {
    const isPermission = error.toLowerCase().includes('permission') || error.toLowerCase().includes('missing');
    return (
      <Screen>
        <AppHeader title="Tin nhắn" onBack={safeBack} />
        <View style={styles.errorWrap}>
          <CircleAlert size={40} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          {isPermission ? (
            <Text style={styles.errorHint}>
              Lỗi quyền Firestore: bạn chưa deploy `firestore.rules` mới (có conversations/reviews). Chạy: firebase deploy --only
              firestore:rules hoặc dán file firestore.rules lên Firebase Console.
            </Text>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Tin nhắn" onBack={safeBack} />
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <EmptyState icon={MessageCircle} title="Chưa có tin nhắn" message="Hãy vào chi tiết sản phẩm và bấm Nhắn tin để bắt đầu." />
        }
        renderItem={({ item }) => {
          const otherId = item.participants.find((p) => p !== user?.uid)!;
          const other = users[otherId];
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/chat/${item.id}`)}>
              <Image
                source={{ uri: other?.avatar || item.productImage || 'https://picsum.photos/seed/chat/200/200' }}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {other?.name ?? 'Người dùng'}
                </Text>
                {item.productName ? (
                  <Text style={styles.product} numberOfLines={1}>
                    <Package size={12} color={Colors.textMuted} /> {item.productName}
                  </Text>
                ) : (
                  <Text style={styles.product} numberOfLines={1}>
                    Tin nhắn trực tiếp
                  </Text>
                )}
                <Text style={styles.last} numberOfLines={1}>
                  {item.lastMessage || 'Chưa có tin nhắn'}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.time}>{item.lastMessageAt ? formatDateTime(item.lastMessageAt) : ''}</Text>
                <ChevronRight size={20} color={Colors.textMuted} />
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText: { color: Colors.danger, textAlign: 'center', fontSize: 12 },
  errorHint: { color: Colors.textMuted, textAlign: 'center', fontSize: 11, lineHeight: 18 },
  content: { padding: 16, paddingTop: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.border },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text },
  product: { fontSize: 10, color: Colors.textMuted },
  last: { fontSize: 12, color: Colors.text, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  time: { fontSize: 9, color: Colors.textMuted },
});
