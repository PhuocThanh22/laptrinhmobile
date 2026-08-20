/**
 * Khởi tạo Firebase.
 *
 * - Lưu ý: app KHÔNG sử dụng Firebase Storage.
 *   Hình ảnh được upload lên Cloudinary, Firestore chỉ lưu URL.
 *
 * - Trên React Native, `getAuth()` mặc định chỉ lưu state trong bộ nhớ
 *   (mất đăng nhập khi tắt app). Để giữ đăng nhập lâu dài, ta dùng
 *   `initializeAuth` + `getReactNativePersistence` với AsyncStorage
 *   (hàm này chỉ export ở bản build dành cho RN của SDK v12).
 *
 * - Nếu chưa điền cấu hình trong .env, các service sẽ báo lỗi rõ ràng
 *   thay vì crash app.
 */
import { Platform } from 'react-native';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth, type Persistence } from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { CONFIG_MISSING_MESSAGE, firebaseConfig, isFirebaseConfigured } from '@/constants/config';

/**
 * `getReactNativePersistence` chỉ được export ở bản build dành riêng cho React
 * Native của SDK v12 (Metro resolve `firebase/auth` tới bản đó). TypeScript lại
 * đọc bản types chung nên không nhìn thấy hàm này — cần khai báo kiểu thủ công.
 */
type ReactNativeStorage = typeof ReactNativeAsyncStorage;
type GetReactNativePersistence = (storage: ReactNativeStorage) => Persistence;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

  if (Platform.OS === 'web') {
    // Trên web dùng getAuth() (mặc định lưu ở browser indexedDB/localStorage).
    auth = getAuth(app);
  } else {
    // Trên native: nối AsyncStorage để giữ đăng nhập lâu dài.
    const getReactNativePersistence = (FirebaseAuth as unknown as {
      getReactNativePersistence?: GetReactNativePersistence;
    }).getReactNativePersistence;

    if (!getReactNativePersistence) {
      throw new Error(
        'Firebase Auth (bản React Native) thiếu getReactNativePersistence. Kiểm tra lại phiên bản firebase đã cài.',
      );
    }

    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  }

  db = getFirestore(app);
}

/** Ném lỗi rõ ràng khi Firebase chưa được cấu hình. */
export function requireFirebase(): { auth: Auth; db: Firestore } {
  if (!auth || !db) {
    throw new Error(CONFIG_MISSING_MESSAGE);
  }
  return { auth, db };
}

export { app, auth, db, isFirebaseConfigured };