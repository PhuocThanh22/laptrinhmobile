import { LogIn, Store } from 'lucide-react-native';
import { Link } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { APP_NAME } from '@/constants/config';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { validateLogin } from '@/utils/validation';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const error = validateLogin(email, password);
    if (error) {
      Toast.show({ type: 'error', text1: error });
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      Toast.show({ type: 'success', text1: 'Đăng nhập thành công' });
    } catch (e) {
      Toast.show({ type: 'error', text1: e instanceof Error ? e.message : 'Đăng nhập thất bại' });
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
          <View style={styles.logoWrap}>
            <Store size={34} color={Colors.white} />
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.title}>Chào mừng trở lại</Text>
          <Text style={styles.subtitle}>Đăng nhập để mua bán và tham gia đấu giá</Text>

          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextField
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            <View style={styles.forgotRow}>
              <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
                Quên mật khẩu?
              </Link>
            </View>
            <Button
              title={loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              onPress={handleLogin}
              loading={loading}
              icon={LogIn}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <Link href="/(auth)/register" style={styles.footerLink}>
              Đăng ký ngay
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
    color: Colors.textMuted,
    marginTop: 4,
  },
  form: {
    marginTop: 28,
    gap: 4,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    padding: 4,
  },
  button: {
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
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