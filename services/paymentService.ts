/**
 * VietQR payment - tạo QR và xác nhận thanh toán giả lập.
 * Sử dụng API ảnh của VietQR: https://img.vietqr.io/image/<BANK>-<ACCOUNT>-<TEMPLATE>.png
 * Không cần backend, chỉ tạo URL với amount + addInfo (orderId).
 * Việc "đã thanh toán" được mô phỏng bằng cập nhật Firestore sau delay.
 */
import { doc, updateDoc } from 'firebase/firestore';

import { vietQRConfig } from '@/constants/config';
import { requireFirebase } from './firebase';

export function buildVietQRUrl(amount: number, addInfo: string): string {
  const { bankId, accountNo, template, accountName } = vietQRConfig;
  const safeInfo = encodeURIComponent(addInfo.slice(0, 20));
  const safeName = encodeURIComponent(accountName);
  // amount phải là số nguyên VND
  const amt = Math.round(amount);
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amt}&addInfo=${safeInfo}&accountName=${safeName}`;
}

export async function confirmVietQRPayment(orderId: string): Promise<void> {
  const { db } = requireFirebase();
  await updateDoc(doc(db, 'orders', orderId), {
    paymentStatus: 'paid',
    paidAt: Date.now(),
  });
}

export async function markVietQRFailed(orderId: string): Promise<void> {
  const { db } = requireFirebase();
  await updateDoc(doc(db, 'orders', orderId), {
    paymentStatus: 'failed',
  });
}

export async function simulateVietQRCheck(orderId: string, shouldSucceed = true): Promise<void> {
  // giả lập call API ngân hàng: delay 1.5s rồi cập nhật
  await new Promise((r) => setTimeout(r, 1500));
  if (shouldSucceed) await confirmVietQRPayment(orderId);
  else await markVietQRFailed(orderId);
}
