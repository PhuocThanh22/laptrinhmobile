import { CircleAlert, MessageCircle, Package, Send } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { showMessage } from '@/components/MessageCenter';

import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getConversationById, sendMessage, subscribeMessages, type ChatMessage, type Conversation } from '@/services/chatService';
import { getSingleUser } from '@/services/userService';
import { formatDateTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import type { AppUser } from '@/types';

import { safeBack } from '@/utils/navigation';
export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [other, setOther] = useState<AppUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    getConversationById(id).then(async (c) => {
      if (!c) return;
      setConv(c);
      const otherId = c.participants.find((p) => p !== user?.uid);
      if (otherId) setOther(await getSingleUser(otherId));
    });
  }, [id, user]);

  const [msgError, setMsgError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeMessages(
      id,
      (msgs) => {
        setMessages(msgs);
        setMsgError(null);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      },
      (e) => setMsgError(getErrorMessage(e)),
    );
    return () => unsub();
  }, [id]);

  const handleSend = async () => {
    if (!id || !user || !input.trim()) return;
    setSending(true);
    try {
      await sendMessage(id, user.uid, input);
      setInput('');
    } catch (e) {
      showMessage({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setSending(false);
    }
  };

  if (!conv) {
    return (
      <Screen>
        <AppHeader title="Chat" onBack={safeBack} />
        <Loading text="Đang tải..." />
      </Screen>
    );
  }

  const title = other?.name ?? 'Cuộc trò chuyện';
  const subtitle = conv.productName ? `Về: ${conv.productName}` : 'Tin nhắn trực tiếp';

  return (
    <Screen>
      <AppHeader title={title} subtitle={subtitle} onBack={safeBack} />
      {conv.productName ? (
        <View style={styles.productBar}>
          <Package size={16} color={Colors.primary} />
          <Text style={styles.productBarText} numberOfLines={1}>
            {conv.productName}
          </Text>
        </View>
      ) : null}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {msgError ? (
          <View style={styles.errorBox}>
            <CircleAlert size={24} color={Colors.danger} />
            <Text style={styles.errorText}>{msgError}</Text>
          </View>
        ) : null}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.uid;
            return (
              <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowOther]}>
                {!isMe ? <Avatar name={other?.name} uri={other?.avatar} size={28} /> : null}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>{item.text}</Text>
                  <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>{formatDateTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !msgError ? (
              <View style={styles.empty}>
                <MessageCircle size={36} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Chưa có tin nhắn. Hãy chào nhau!</Text>
              </View>
            ) : null
          }
        />
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhập tin nhắn..."
            multiline
            style={styles.input}
            maxLength={1000}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !input.trim()}
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}>
            <Send size={20} color={Colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  productBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productBarText: { fontSize: 12, color: Colors.text, flex: 1 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  bubbleRowMe: { alignSelf: 'flex-end' },
  bubbleRowOther: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 280 },
  bubbleMe: { backgroundColor: Colors.primary },
  bubbleOther: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: Colors.white },
  bubbleTextOther: { color: Colors.text },
  time: { fontSize: 10, marginTop: 4 },
  timeMe: { color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  timeOther: { color: Colors.textMuted },
  empty: { alignItems: 'center', padding: 32, gap: 8, marginTop: 40 },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.dangerSoft, padding: 10, margin: 12, borderRadius: 10 },
  errorText: { color: Colors.danger, fontSize: 12, flex: 1 },
});
