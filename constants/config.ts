/**
 * Cấu hình tập trung cho toàn app.
 *
 * Mọi biến môi trường (Firebase, Cloudinary, ...) được đọc tại đây
 * từ file `.env` thông qua các biến `EXPO_PUBLIC_*`.
 *
 * Khi deploy bằng EAS (`eas update` / `eas build`), EAS tự động nạp các
 * biến `EXPO_PUBLIC_*` từ file `.env` -> không cần cấu hình thêm.
 */

export const APP_NAME = 'MiniShop';
export const APP_TAGLINE = 'Sàn đồ cũ sinh viên · Đấu giá nhẹ';
export const CURRENCY = 'đ';

/** Ảnh mặc định dùng khi sản phẩm không có ảnh. */
export const DEFAULT_PRODUCT_IMAGE = 'https://picsum.photos/seed/minishop/600/600';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const cloudinaryConfig = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '',
};

/** Firebase đã được cấu hình đầy đủ chưa (đủ apiKey + projectId). */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

/** Cloudinary đã được cấu hình đầy đủ chưa. */
export const isCloudinaryConfigured = Boolean(
  cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset,
);

export const CONFIG_MISSING_MESSAGE =
  'Chưa cấu hình Firebase/Cloudinary. Vui lòng điền thông tin trong file .env (xem .env.example) rồi khởi động lại Expo.';
