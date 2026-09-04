/** Bóc lỗi từ Firebase/Cloudinary và trả về thông báo tiếng Việt thân thiện. */

const FIREBASE_MESSAGES: Record<string, string> = {
  // Xác thực (Firebase Auth)
  'auth/email-already-in-use': 'Email này đã được đăng ký.',
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
  'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
  'auth/wrong-password': 'Mật khẩu không đúng.',
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/too-many-requests': 'Quá nhiều lần thử, vui lòng thử lại sau.',
  'auth/network-request-failed': 'Lỗi mạng, vui lòng kiểm tra kết nối.',
  'auth/operation-not-allowed': 'Chức năng này chưa được bật trên hệ thống.',
  'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hoá.',
  'auth/requires-recent-login': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  'auth/account-exists-with-different-credential': 'Tài khoản đã tồn tại với phương thức đăng nhập khác.',
  'auth/credential-already-in-use': 'Thông tin xác thực này đã được sử dụng bởi tài khoản khác.',
  // Firestore / Rules
  'permission-denied': 'Bạn không có quyền thực hiện thao tác này.',
  'not-found': 'Không tìm thấy dữ liệu.',
  'unavailable': 'Dịch vụ đang tạm thời không khả dụng, vui lòng thử lại.',
  'failed-precondition': 'Không thể thực hiện lúc này, vui lòng thử lại.',
  'already-exists': 'Dữ liệu đã tồn tại.',
  'aborted': 'Thao tác bị huỷ, vui lòng thử lại.',
};

function getErrorCode(error: unknown): string | null {
  if (error instanceof Error && 'code' in error) {
    return (error as { code?: string }).code ?? null;
  }
  return null;
}

function toVietnamese(error: unknown): string | null {
  const code = getErrorCode(error);
  if (code && code in FIREBASE_MESSAGES) return FIREBASE_MESSAGES[code];
  return null;
}

export function getFirebaseErrorMessage(error: unknown): string {
  return toVietnamese(error) ?? getErrorMessage(error);
}

export function getErrorMessage(error: unknown): string {
  const viet = toVietnamese(error);
  if (viet) return viet;
  if (error instanceof Error && error.message) return error.message;
  return 'Đã có lỗi xảy ra.';
}