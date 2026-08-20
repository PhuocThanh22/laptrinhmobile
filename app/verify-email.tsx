import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { APP_NAME } from '@/constants/config';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailScreen() {
  const { user, signOut, resendVerificationEmail, refreshEmailVerified } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      Toast.show({ type: 'success', text1: 'Đã gửi lại email xác thực. Kiểm tra hộp thư của bạn.' });
    } catch (e) {
      Toast.show({ type: 'error', text1: e instanceof Error ? e.message : 'Gửi lại thất bại' });
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const verified = await refreshEmailVerified();
      if (verified) {
        Toast.show({ type: 'success', text1: 'Xác thực email thành công!' });
      } else {
        Toast.show({ type: 'info', text1: 'Email chưa được xác thực. Vui lòng bấm liên kết trong email.' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: e instanceof Error ? e.message : 'Kiểm tra thất bại' });
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // bỏ qua lỗi đăng xuất
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <MaterialIcons name="mark-email-unread" size={34} color={Colors.white} />
        </View>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.title}>Xác thực email của bạn</Text>
        <Text style={styles.subtitle}>
          Chúng tôi đã gửi một email xác thực tới{'\n'}
          <Text style={styles.email}>{user?.email ?? 'địa chỉ email của bạn'}</Text>
          {'\n\n'}
          Vui lòng mở hộp thư và bấm vào liên kết trong email để hoàn tất đăng ký.
        </Text>

        <View style={styles.form}>
          <Button
            title={sending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
            onPress={handleResend}
            loading={sending}
            icon="refresh"
            style={styles.button}
          />
          <Button
            title={checking ? 'Đang kiểm tra...' : 'Tôi đã xác thực, tiếp tục'}
            onPress={handleCheck}
            loading={checking}
            variant="success"
            icon="verified-user"
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Button title="Đăng xuất" onPress={handleLogout} variant="ghost" icon="logout" small />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  appName: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textMuted,
    marginTop: 12,
  },
  email: {
    fontWeight: '700',
    color: Colors.primary,
  },
  form: {
    marginTop: 28,
    gap: 10,
  },
  button: {
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
  },
});