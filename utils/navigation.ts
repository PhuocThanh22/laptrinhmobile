import { router } from 'expo-router';

/**
 * Quay lại màn hình trước. Nếu không có màn hình nào để quay về
 * (vd: reload app ngay trên màn hình con) thì về trang chủ.
 */
export function safeBack(fallback = '/(tabs)'): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
