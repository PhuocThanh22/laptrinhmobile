/** Các hàm kiểm tra dữ liệu. Trả về chuỗi lỗi hoặc null nếu hợp lệ. */

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateRegister(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  if (!input.name.trim()) return 'Vui lòng nhập họ tên.';
  if (!input.email.trim()) return 'Vui lòng nhập email.';
  if (!validateEmail(input.email)) return 'Email không hợp lệ.';
  if (!input.password) return 'Vui lòng nhập mật khẩu.';
  if (input.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
  if (input.password !== input.confirmPassword) return 'Mật khẩu xác nhận không khớp.';
  return null;
}

export function validateLogin(email: string, password: string): string | null {
  if (!email.trim()) return 'Vui lòng nhập email.';
  if (!validateEmail(email)) return 'Email không hợp lệ.';
  if (!password) return 'Vui lòng nhập mật khẩu.';
  return null;
}

export interface ProductFormInput {
  images: string[];
  name: string;
  category: string;
  condition: string;
  description: string;
  saleType: 'fixed' | 'auction';
  price?: string;
  startingPrice?: string;
  bidIncrement?: string;
  endTime?: Date;
}

export function validateProductForm(input: ProductFormInput): string | null {
  if (!input.images.length) return 'Vui lòng chọn ít nhất 1 ảnh sản phẩm.';
  if (!input.name.trim()) return 'Vui lòng nhập tên sản phẩm.';
  if (!input.category) return 'Vui lòng chọn danh mục.';
  if (!input.condition) return 'Vui lòng chọn tình trạng.';

  const toNum = (s?: string) => Number(String(s ?? '').replace(/[^\d]/g, ''));

  if (input.saleType === 'fixed') {
    const price = toNum(input.price);
    if (!input.price || price <= 0) return 'Giá bán phải lớn hơn 0.';
  } else {
    const starting = toNum(input.startingPrice);
    if (!input.startingPrice || starting <= 0) return 'Giá khởi điểm phải lớn hơn 0.';
    const inc = toNum(input.bidIncrement);
    if (!input.bidIncrement || inc <= 0) return 'Bước giá phải lớn hơn 0.';
    if (!input.endTime) return 'Vui lòng chọn thời gian kết thúc.';
    if (input.endTime.getTime() <= Date.now())
      return 'Thời gian kết thúc phải sau thời điểm hiện tại.';
  }
  return null;
}

export function validateBid(productPrice: number, increment: number, amountStr: string): string | null {
  const amount = Number(String(amountStr ?? '').replace(/[^\d]/g, ''));
  if (!amount || Number.isNaN(amount)) return 'Vui lòng nhập giá đấu.';
  const min = productPrice + increment;
  if (amount < min) return `Giá đấu tối thiểu là ${min.toLocaleString('vi-VN')}đ.`;
  return null;
}

export function validateOrder(input: {
  receiverName: string;
  phone: string;
  address: string;
}): string | null {
  if (!input.receiverName.trim()) return 'Vui lòng nhập họ tên người nhận.';
  if (!input.phone.trim()) return 'Vui lòng nhập số điện thoại.';
  if (!/^[0-9+]{9,12}$/.test(input.phone.trim()))
    return 'Số điện thoại không hợp lệ (9-12 số).';
  if (!input.address.trim()) return 'Vui lòng nhập địa chỉ nhận hàng.';
  return null;
}

export function parseNumberInput(value: string): number {
  return Number(value.replace(/[^\d]/g, ''));
}