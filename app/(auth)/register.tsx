import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
import { checkEmailExists } from '@/services/authService';
import { validateEmail, validateRegister } from '@/utils/validation';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailTaken, setEmailTaken] = useState<string | null>(null);

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
      // Không kiểm tra được (ví dụ chưa cấu hình Firebase) — bỏ qua, submit vẫn báo lỗi từ Firebase.
      setEmailTaken(null);
    }
  };

  const handleRegister = async () => {
    const error = validateRegister({ name, email, password, confirmPassword });
    if (error) {
      Toast.show({ type: 'error', text1: error });
      return;
    }
    setLoading(true);
    try {
      await signUp({ name, email, password, phone });
      Toast.show({ type: 'success', text1: 'Đăng ký thành công', text2: 'Vui lòng xác thực email để tiếp tục.' });
    } catch (e) {
      Toast.show({ type: 'error', text1: e instanceof Error ? e.message : 'Đăng ký thất bại' });
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
              <MaterialIcons name="arrow-back-ios" size={20} color={Colors.text} />
            </Link>
            <View style={styles.logoWrap}>
              <MaterialIcons name="person-add" size={30} color={Colors.white} />
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
              icon="how-to-reg"
              style={styles.button}
            />
          </View>

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