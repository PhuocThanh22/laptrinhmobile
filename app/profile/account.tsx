import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { uploadImages } from '@/services/cloudinaryService';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';

export default function AccountScreen() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Cần quyền truy cập thư viện ảnh.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploadingAvatar(true);
    try {
      const [url] = await uploadImages([result.assets[0].uri]);
      setAvatar(url);
      await updateProfile({ avatar: url });
      Toast.show({ type: 'success', text1: 'Đã cập nhật ảnh đại diện.' });
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập họ tên.' });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      Toast.show({ type: 'success', text1: 'Đã lưu thông tin.' });
      router.back();
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Thông tin tài khoản" onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <Avatar name={name} uri={avatar} size={88} />
            <Button
              title={uploadingAvatar ? 'Đang tải...' : 'Đổi ảnh đại diện'}
              variant="outline"
              small
              icon="photo-camera"
              loading={uploadingAvatar}
              onPress={pickAvatar}
              style={styles.avatarBtn}
            />
          </View>

          <View style={styles.card}>
            <TextField label="Họ tên" value={name} onChangeText={setName} placeholder="Nguyễn Văn A" />
            <TextField
              label="Số điện thoại"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^0-9+]/g, ''))}
              placeholder="0901234567"
              keyboardType="phone-pad"
              maxLength={12}
            />
            <View style={styles.readonlyWrap}>
              <Text style={styles.readonlyLabel}>Email</Text>
              <View style={styles.readonlyValue}>
                <MaterialIcons name="mail-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.readonlyText}>{user?.email}</Text>
              </View>
            </View>
            <Text style={styles.joined}>
              Tham gia từ {formatDate(user?.createdAt)}
            </Text>
          </View>

          <Button
            title={saving ? 'Đang lưu...' : 'Lưu thông tin'}
            icon="save"
            loading={saving}
            onPress={handleSave}
          />
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
    padding: 16,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  avatarBtn: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 16,
  },
  readonlyWrap: {
    marginBottom: 14,
  },
  readonlyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  readonlyValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  readonlyText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  joined: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});