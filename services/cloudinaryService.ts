/**
 * Upload hình ảnh lên Cloudinary.
 *
 * Flow bắt buộc:
 *   Điện thoại -> Expo Image Picker -> Cloudinary Upload API -> Image URL -> Firestore
 *
 * KHÔNG sử dụng Firebase Storage.
 *
 * Cấu hình qua biến môi trường:
 *   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET  (upload preset loại Unsigned)
 *
 * Tuyệt đối không nhúng API secret vào app mobile.
 */
import { Platform } from 'react-native';

import { cloudinaryConfig, isCloudinaryConfigured } from '@/constants/config';

const BASE_URL = 'https://api.cloudinary.com/v1_1';

async function uploadOne(uri: string): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Chưa cấu hình Cloudinary. Vui lòng điền EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME và EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET trong file .env.',
    );
  }

  const { cloudName, uploadPreset } = cloudinaryConfig;
  const url = `${BASE_URL}/${cloudName}/image/upload`;

  const formData = new FormData();
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  const extMatch = /\.(\w+)$/.exec(filename);
  const mime = extMatch ? `image/${extMatch[1].toLowerCase()}` : 'image/jpeg';

  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    formData.append('file', blob, filename);
  } else {
    formData.append('file', { uri, name: filename, type: mime } as unknown as Blob);
  }
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(url, { method: 'POST', body: formData });
  const json = await response.json();

  if (!response.ok || !json.secure_url) {
    throw new Error(json?.error?.message ?? 'Upload ảnh lên Cloudinary thất bại.');
  }
  return json.secure_url as string;
}

/** Upload nhiều ảnh, trả về mảng URL. Lỗi một ảnh sẽ ném ngay. */
export async function uploadImages(uris: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of uris) {
    urls.push(await uploadOne(uri));
  }
  return urls;
}