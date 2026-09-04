import { ChevronLeft, UserCheck, UserPlus } from 'lucide-react-native';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { showMessage } from '@/components/MessageCenter';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { APP_NAME, googleWebClientId, isConfiguredForGoogle } from '@/constants/config';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { checkEmailExists } from '@/services/authService';
import { validateEmail, validateRegister } from '@/utils/validation';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailTaken, setEmailTaken] = useState<string | null>(null);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleWebClientId,
  });

  const handleGoogleSignIn = useCallback(async (idToken: string) => {
    setLoading(true);
    try {
      await signInWithGoogle(idToken);
      showMessage({ type: 'success', text1: 'Đăng nhập bằng Google thành công' });
    } catch (e) {
      showMessage({ type: 'error', text1: e instanceof Error ? e.message : 'Đăng nhập Google thất bại' });
    } finally {
      setLoading(false);
    }
  }, [signInWithGoogle]);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      handleGoogleSignIn(id_token);
    }
  }, [googleResponse, handleGoogleSignIn]);

  const handleCheckEmail = async () => {
    if (!email.trim() || !validateEmail(email)) {
      setEmailTaken(null);
      return;
    }
    try {
      const exists = await checkEmailExists(email);
      setEmailTaken(
        exists ? 'Email này đã được đăng ký. Bạn có thể đăng nhập hoặc dùng email khác.' : null,
      );
    } catch {
      setEmailTaken(null);
    }
  };

  const handleRegister = async () => {
    const error = validateRegister({ name, email, password, confirmPassword });
    if (error) {
      showMessage({ type: 'error', text1: error });
      return;
    }
    setLoading(true);
    try {
      await signUp({ name, email, password, phone });
      showMessage({ type: 'success', text1: 'Đăng ký thành công', text2: 'Vui lòng xác thực email để tiếp tục.' });
    } catch (e) {
      showMessage({ type: 'error', text1: e instanceof Error ? e.message : 'Đăng ký thất bại' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Link href="/(auth)/login" style={styles.backBtn} asChild>
              <Pressable hitSlop={12}>
                <ChevronLeft size={20} color={Colors.text} />
              </Pressable>
            </Link>
            <View style={styles.logoWrap}>
              <UserPlus size={30} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>Bắt đầu mua bán và đấu giá ngay hôm nay</Text>

          <View style={styles.form}>
            <TextField label="Họ tên" value={name} onChangeText={setName} placeholder="Nguyễn Văn A" />
            <TextField
              label="Email"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailTaken) setEmailTaken(null);
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailTaken}
              onBlur={handleCheckEmail}
            />
            <TextField
              label="Số điện thoại (không bắt buộc)"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^0-9+]/g, ''))}
              placeholder="0901234567"
              keyboardType="phone-pad"
              maxLength={12}
            />
            <TextField
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="Ít nhất 6 ký tự"
              secureTextEntry
            />
            <TextField
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry
            />
            <Button
              title={loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              onPress={handleRegister}
              loading={loading}
              icon={UserCheck}
              style={styles.button}
            />
          </View>

          {isConfiguredForGoogle && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>hoặc</Text>
                <View style={styles.dividerLine} />
              </View>
              <Button
                title="Đăng nhập bằng Google"
                onPress={() => googlePromptAsync()}
                loading={loading}
                disabled={!googleRequest}
                style={styles.googleButton}
              />
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
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
    color: Colors.textMuted,
    marginTop: 4,
  },
  form: {
    marginTop: 20,
  },
  button: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: Colors.textMuted,
  },
  googleButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
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
