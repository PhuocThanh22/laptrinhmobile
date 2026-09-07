/**
 * Upload hình ảnh / video lên Cloudinary.
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
 *
 * Chiến lược upload:
 *   - Native: dùng File.upload() của expo-file-system mới (multipart native,
 *     không cần FormData polyfill — tránh lỗi "unsupported Formdata").
 *   - Web: dùng Blob + FormData (browser hỗ trợ tốt).
 */
import { Platform } from 'react-native';
import { File, UploadType } from 'expo-file-system';

import { cloudinaryConfig, isCloudinaryConfigured } from '@/constants/config';

const BASE_URL = 'https://api.cloudinary.com/v1_1';

/**
 * Đọc body của response và parse JSON an toàn.
 */
async function parseJsonResponse(body: string, action: string): Promise<Record<string, unknown>> {
  if (!body) {
    throw new Error(`Cloudinary không trả kết quả khi ${action}. Vui lòng thử lại.`);
  }
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new Error(`Lỗi phản hồi từ Cloudinary khi ${action}. Vui lòng thử lại.`);
  }
}

/** Trích xuất MIME type từ URI. */
function guessMime(uri: string, fallback: string): string {
  const extMatch = /\.(\w+)$/.exec(uri.split('/').pop() ?? '');
  if (!extMatch) return fallback;
  const ext = extMatch[1].toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
  };
  return map[ext] ?? fallback;
}

async function uploadOne(uri: string, resourceType: 'image' | 'video'): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Chưa cấu hình Cloudinary. Vui lòng điền EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME và EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET trong file .env.',
    );
  }

  const { cloudName, uploadPreset } = cloudinaryConfig;
  const url = `${BASE_URL}/${cloudName}/${resourceType}/upload`;
  const mime = guessMime(uri, resourceType === 'video' ? 'video/mp4' : 'image/jpeg');

  if (Platform.OS === 'web') {
    const formData = new FormData();
    const blob = await (await fetch(uri)).blob();
    formData.append('file', blob, uri.split('/').pop() ?? `file.${resourceType === 'video' ? 'mp4' : 'jpg'}`);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(url, { method: 'POST', body: formData });
    const json = await parseJsonResponse(await response.text(), `upload ${resourceType}`);

    if (!response.ok || !json.secure_url) {
      const err = (json.error as { message?: string } | undefined)?.message;
      throw new Error(err ?? `Upload ${resourceType} lên Cloudinary thất bại.`);
    }
    return json.secure_url as string;
  }

  // Native: dùng File.upload() — multipart native, không cần FormData.
  const file = new File(uri);
  const result = await file.upload(url, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: mime,
    parameters: { upload_preset: uploadPreset },
  });

  const json = await parseJsonResponse(result.body, `upload ${resourceType}`);

  if (result.status < 200 || result.status >= 300 || !json.secure_url) {
    const err = (json.error as { message?: string } | undefined)?.message;
    throw new Error(err ?? `Upload ${resourceType} lên Cloudinary thất bại.`);
  }
  return json.secure_url as string;
}

/** Upload nhiều ảnh, trả về mảng URL. Lỗi một ảnh sẽ ném ngay. */
export async function uploadImages(uris: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of uris) {
    urls.push(await uploadOne(uri, 'image'));
  }
  return urls;
}

/** Upload một video, trả về URL. */
export async function uploadVideo(uri: string): Promise<string> {
  return uploadOne(uri, 'video');
}
