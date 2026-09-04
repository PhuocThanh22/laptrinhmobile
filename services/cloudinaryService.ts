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

/**
 * Đọc body của response và parse JSON an toàn.
 *
 * Một số trường hợp (mạng chậm/timeout, Cloudinary trả trang lỗi HTML,
 * định tuyến trả body rỗng...) khiến `response.json()` ném lỗi "Unexpected
 * token ... in JSON" — lỗi khó hiểu với người dùng. Hàm này đọc text trước
 * và ném thông báo tiếng Việt rõ ràng.
 */
async function parseJsonResponse(response: Response, action: string): Promise<Record<string, unknown>> {
  let text = '';
  try {
    text = await response.text();
  } catch {
    throw new Error(`Không đọc được phản hồi khi ${action} lên Cloudinary. Kiểm tra kết nối mạng.`);
  }
  if (!text) {
    throw new Error(`Cloudinary không trả kết quả khi ${action}. Vui lòng thử lại.`);
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Lỗi phản hồi từ Cloudinary khi ${action} (mã ${response.status}). Vui lòng thử lại.`);
  }
}

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
  const json = await parseJsonResponse(response, 'upload ảnh');

  if (!response.ok || !json.secure_url) {
    const err = (json.error as { message?: string } | undefined)?.message;
    throw new Error(err ?? 'Upload ảnh lên Cloudinary thất bại.');
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

async function uploadVideoOne(uri: string): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Chưa cấu hình Cloudinary. Vui lòng điền EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME và EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET trong file .env.',
    );
  }

  const { cloudName, uploadPreset } = cloudinaryConfig;
  const url = `${BASE_URL}/${cloudName}/video/upload`;

  const formData = new FormData();
  const filename = uri.split('/').pop() ?? 'video.mp4';
  const extMatch = /\.(\w+)$/.exec(filename);
  const mime = extMatch ? `video/${extMatch[1].toLowerCase()}` : 'video/mp4';

  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    formData.append('file', blob, filename);
  } else {
    formData.append('file', { uri, name: filename, type: mime } as unknown as Blob);
  }
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(url, { method: 'POST', body: formData });
  const json = await parseJsonResponse(response, 'upload video');

  if (!response.ok || !json.secure_url) {
    const err = (json.error as { message?: string } | undefined)?.message;
    throw new Error(err ?? 'Upload video lên Cloudinary thất bại.');
  }
  return json.secure_url as string;
}

/** Upload một video, trả về URL. */
export async function uploadVideo(uri: string): Promise<string> {
  return uploadVideoOne(uri);
}