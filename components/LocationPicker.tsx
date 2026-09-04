import { LocateFixed, MapPin, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { showMessage } from '@/components/MessageCenter';
import * as Location from 'expo-location';

import { Button } from './Button';
import { Colors } from '@/constants/colors';
import type { Location as AppLocation } from '@/types';

interface LocationPickerProps {
  visible: boolean;
  initial?: AppLocation;
  readOnly?: boolean;
  onClose: () => void;
  onConfirm?: (location: AppLocation) => void;
}

const HANOI_COORDS = { latitude: 21.0285, longitude: 105.8542 };

export function LocationPicker({ visible, initial, readOnly, onClose, onConfirm }: LocationPickerProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>(
    initial ?? HANOI_COORDS,
  );
  const [address, setAddress] = useState(initial?.address ?? '');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (visible) {
      setCoords(initial ?? HANOI_COORDS);
      setAddress(initial?.address ?? '');
    }
  }, [visible, initial]);

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      showMessage({ type: 'error', text1: 'Cần quyền truy cập vị trí.' });
      return;
    }
    setLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const current = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setCoords(current);
      if (!address) {
        setAddress('Vị trí hiện tại');
      }
    } catch {
      showMessage({ type: 'error', text1: 'Không lấy được vị trí. Vui lòng thử lại.' });
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    if (!address.trim()) {
      showMessage({ type: 'error', text1: 'Vui lòng nhập địa chỉ chi tiết.' });
      return;
    }
    onConfirm?.({
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: address.trim(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{readOnly ? 'Vị trí giao dịch' : 'Chọn vị trí'}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={24} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.mapWrap}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(e) => !readOnly && setCoords(e.nativeEvent.coordinate)}
              onRegionChangeComplete={(region) =>
                !readOnly && setCoords({ latitude: region.latitude, longitude: region.longitude })
              }
            >
              <Marker coordinate={coords} draggable={!readOnly} onDragEnd={(e) => setCoords(e.nativeEvent.coordinate)}>
                <View style={styles.markerWrap}>
                  <MapPin size={28} color={Colors.primary} />
                </View>
              </Marker>
            </MapView>
            {!readOnly && (
              <Pressable style={styles.locateBtn} onPress={getCurrentLocation} disabled={locating}>
                {locating ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <LocateFixed size={22} color={Colors.primary} />
                )}
              </Pressable>
            )}
          </View>

          <Text style={styles.hint}>
            {readOnly ? address : 'Kéo marker hoặc chạm lên bản đồ để đặt chính xác vị trí của bạn.'}
          </Text>

          {!readOnly && (
            <>
              <View style={styles.addressWrap}>
                <Text style={styles.label}>Địa chỉ chi tiết</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="VD: 12 Nguyễn Văn Bảo, phường 4, Gò Vấp, TP.HCM"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </View>

              <Button
                title="Xác nhận vị trí"
                icon={MapPin}
                onPress={handleConfirm}
                style={styles.confirmBtn}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '92%',
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  mapWrap: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerWrap: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 3,
    shadowColor: Colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  locateBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 10,
  },
  addressWrap: {
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 48,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  confirmBtn: {
    marginTop: 16,
  },
});
