/** Bóc lỗi từ Firebase/Cloudinary và trả về thông báo tiếng Việt thân thiện. */

export function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof Error && 'code' in error) {
    const code = (error as { code?: string }).code;
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email này đã được đăng ký.';
      case 'auth/invalid-email':
        return 'Email không hợp lệ.';
      case 'auth/weak-password':
        return 'Mật khẩu quá yếu (tối thiểu 6 ký tự).';
      case 'auth/user-not-found':
        return 'Không tìm thấy tài khoản với email này.';
      case 'auth/wrong-password':
        return 'Mật khẩu không đúng.';
      case 'auth/invalid-credential':
        return 'Email hoặc mật khẩu không đúng.';
      case 'auth/too-many-requests':
        return 'Quá nhiều lần thử, vui lòng thử lại sau.';
      case 'auth/network-request-failed':
        return 'Lỗi mạng, vui lòng kiểm tra kết nối.';
      case 'permission-denied':
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 'not-found':
        return 'Không tìm thấy dữ liệu.';
      case 'unavailable':
        return 'Dịch vụ đang tạm thời không khả dụng.';
      default:
        return error.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại.';
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Đã có lỗi xảy ra, vui lòng thử lại.';
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra.';
}