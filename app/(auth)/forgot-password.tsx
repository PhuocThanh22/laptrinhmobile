import { ChevronLeft, KeyRound, Mail } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';
import { showMessage } from '@/components/MessageCenter';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { APP_NAME } from '@/constants/config';
import { Colors } from '@/constants/colors';
import { resetPassword, checkEmailExists } from '@/services/authService';
import { getFirebaseErrorMessage } from '@/utils/errors';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      showMessage({ type: 'error', text1: 'Vui lòng nhập email.' });
      return;
    }
    if (!validateEmail(email)) {
      showMessage({ type: 'error', text1: 'Email không hợp lệ.' });
      return;
    }
    setLoading(true);
    try {
      const exists = await checkEmailExists(email);
      if (!exists) {
        showMessage({ type: 'error', text1: 'Email này chưa có tài khoản.' });
        return;
      }
      await resetPassword(email);
      showMessage({
        type: 'success',
        text1: 'Đã gửi email đặt lại mật khẩu',
        text2: 'Kiểm tra hộp thư và làm theo hướng dẫn.',
      });
      setTimeout(() => router.replace('/(auth)/login'), 600);
    } catch (e) {
      showMessage({ type: 'error', text1: getFirebaseErrorMessage(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Link href="/(auth)/login" style={styles.backBtn} asChild>
              <Pressable hitSlop={12}>
                <ChevronLeft size={20} color={Colors.text} />
              </Pressable>
            </Link>
            <View style={styles.logoWrap}>
              <KeyRound size={30} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.title}>Quên mật khẩu?</Text>
          <Text style={styles.subtitle}>
            Nhập email đã đăng ký, chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
          </Text>

          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title={loading ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}
              onPress={handleReset}
              loading={loading}
              icon={Mail}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Nhớ ra mật khẩu rồi? </Text>
            <Link href="/(auth)/login" style={styles.footerLink}>
              Đăng nhập
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    padding: 4,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  appName: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '900',
    color: Colors.text,
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 14,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textMuted,
    marginTop: 6,
  },
  form: {
    marginTop: 20,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});