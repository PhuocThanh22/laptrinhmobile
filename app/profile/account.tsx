import { Camera, LocateFixed, Mail, MapPin, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showMessage } from '@/components/MessageCenter';

import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { LocationPicker } from '@/components/LocationPicker';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { uploadImages } from '@/services/cloudinaryService';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';
import type { Location } from '@/types';

import { safeBack } from '@/utils/navigation';
export default function AccountScreen() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [location, setLocation] = useState<Location | undefined>(user?.location);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showMessage({ type: 'error', text1: 'Cần quyền truy cập thư viện ảnh.' });
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
      showMessage({ type: 'success', text1: 'Đã cập nhật ảnh đại diện.' });
    } catch (e) {
      showMessage({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showMessage({ type: 'error', text1: 'Vui lòng nhập họ tên.' });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim(), location });
      showMessage({ type: 'success', text1: 'Đã lưu thông tin.' });
      safeBack();
    } catch (e) {
      showMessage({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Thông tin tài khoản" onBack={safeBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <Avatar name={name} uri={avatar} size={88} />
            <Button
              title={uploadingAvatar ? 'Đang tải...' : 'Đổi ảnh đại diện'}
              variant="outline"
              small
              icon={Camera}
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
                <Mail size={16} color={Colors.textMuted} />
                <Text style={styles.readonlyText}>{user?.email}</Text>
              </View>
            </View>
            <Text style={styles.joined}>
              Tham gia từ {formatDate(user?.createdAt)}
            </Text>
          </View>

          {/* Vị trí */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vị trí của bạn</Text>
            <Pressable style={styles.locationRow} onPress={() => setPickerVisible(true)}>
              <View style={styles.locationIcon}>
                <MapPin size={22} color={Colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                {location ? (
                  <>
                    <Text style={styles.locationAddress} numberOfLines={2}>
                      {location.address}
                    </Text>
                    <Text style={styles.locationCoords}>
                      {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.locationEmpty}>
                    Chưa cài đặt vị trí. Chạm để chọn trên bản đồ.
                  </Text>
                )}
              </View>
              <LocateFixed size={20} color={Colors.textMuted} />
            </Pressable>
            <Text style={styles.locationHint}>
              Vị trí này sẽ hiển thị trên sản phẩm bạn đăng để người mua biết nơi giao dịch.
            </Text>
          </View>

          <Button
            title={saving ? 'Đang lưu...' : 'Lưu thông tin'}
            icon={Save}
            loading={saving}
            onPress={handleSave}
          />

          <LocationPicker
            visible={pickerVisible}
            initial={location}
            onClose={() => setPickerVisible(false)}
            onConfirm={(loc) => {
              setLocation(loc);
              setPickerVisible(false);
            }}
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  locationCoords: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  locationEmpty: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  locationHint: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 10,
  },
});