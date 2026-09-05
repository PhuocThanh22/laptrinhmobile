import { LocateFixed, MapPin, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
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

function buildMapHtml(readOnly: boolean): string {
  const interactive = readOnly ? 'false' : 'true';
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body { height: 100%; margin: 0; padding: 0; }
  #map { position: absolute; top: 0; right: 0; bottom: 0; left: 0; }
  .leaflet-container { background: #e5e3df; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  'use strict';
  var interactive = ${interactive};
  var map = null;
  var marker = null;
  var dragJustEnded = false;

  function postMessage(type, data) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
    }
  }

  function round6(v) {
    return Math.round(v * 1000000) / 1000000;
  }

  function notifyLocation(lat, lng) {
    postMessage('location', { latitude: round6(lat), longitude: round6(lng) });
  }

  function reposition(lat, lng) {
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng]);
  }

  function init() {
    map = L.map('map', {
      center: [21.0285, 105.8542],
      zoom: 17,
      zoomControl: true,
      attributionControl: true,
      dragging: interactive,
      doubleClickZoom: interactive,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    marker = L.marker([21.0285, 105.8542], {
      draggable: interactive,
      keyboard: false,
    }).addTo(map);

    if (!interactive) {
      map.invalidateSize();
      return;
    }

    marker.on('dragend', function () {
      var p = marker.getLatLng();
      notifyLocation(p.lat, p.lng);
    });

    map.on('dragstart', function () {
      dragJustEnded = true;
    });

    map.on('moveend', function () {
      var c = map.getCenter();
      marker.setLatLng(c);
      notifyLocation(c.lat, c.lng);
      setTimeout(function () { dragJustEnded = false; }, 300);
    });

    map.on('click', function (e) {
      if (dragJustEnded) { return; }
      reposition(e.latlng.lat, e.latlng.lng);
      notifyLocation(e.latlng.lat, e.latlng.lng);
    });

    map.invalidateSize();
  }

  window.__setLocation = function (lat, lng) {
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng) || !map) { return; }
    reposition(lat, lng);
  };

  window.addEventListener('load', function () {
    init();
  });
})();
</script>
</body>
</html>`;
}

export function LocationPicker({ visible, initial, readOnly, onClose, onConfirm }: LocationPickerProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>(
    initial ?? HANOI_COORDS,
  );
  const [address, setAddress] = useState(initial?.address ?? '');
  const [locating, setLocating] = useState(false);

  const webRef = useRef<WebView>(null);
  const loadedRef = useRef(false);
  const coordsRef = useRef(coords);

  const mapHtml = useMemo(() => buildMapHtml(!!readOnly), [readOnly]);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  useEffect(() => {
    if (visible) {
      setCoords(initial ?? HANOI_COORDS);
      setAddress(initial?.address ?? '');
    }
  }, [visible, initial]);

  const sendToMap = useCallback((lat: number, lng: number) => {
    webRef.current?.injectJavaScript(
      `window.__setLocation && window.__setLocation(${lat}, ${lng}); true;`,
    );
  }, []);

  useEffect(() => {
    if (visible && loadedRef.current) {
      sendToMap(coordsRef.current.latitude, coordsRef.current.longitude);
    }
  }, [visible, sendToMap]);

  const handleLoadEnd = useCallback(() => {
    loadedRef.current = true;
    sendToMap(coordsRef.current.latitude, coordsRef.current.longitude);
  }, [sendToMap]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (readOnly) return;
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (
          msg?.type === 'location' &&
          Number.isFinite(msg.data?.latitude) &&
          Number.isFinite(msg.data?.longitude)
        ) {
          setCoords({
            latitude: msg.data.latitude,
            longitude: msg.data.longitude,
          });
        }
      } catch {
        // bỏ qua tin nhắn không phải JSON
      }
    },
    [readOnly],
  );

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
      sendToMap(current.latitude, current.longitude);
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{readOnly ? 'Vị trí giao dịch' : 'Chọn vị trí'}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={24} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.mapWrap}>
            <WebView
              ref={webRef}
              style={styles.map}
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              bounces={false}
              scrollEnabled={false}
              overScrollMode="never"
              onLoadEnd={handleLoadEnd}
              onMessage={handleMessage}
            />
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
    fontSize: 17,
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
    flex: 1,
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
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 10,
  },
  addressWrap: {
    marginTop: 12,
  },
  label: {
    fontSize: 12,
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
    fontSize: 14,
    color: Colors.text,
    minHeight: 48,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  confirmBtn: {
    marginTop: 16,
  },
});