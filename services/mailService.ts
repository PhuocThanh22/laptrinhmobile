/**
 * Gọi mail server (Brevo) để gửi email thông báo thắng đấu giá.
 * Server chạy riêng (server/) — cấu hình qua EXPO_PUBLIC_API_URL.
 */
import { apiUrl, isApiConfigured } from '@/constants/config';

export async function sendAuctionWinEmail(input: {
  email: string;
  name?: string;
  productName: string;
  amount: string;
  hoursLeft?: string;
}): Promise<void> {
  if (!isApiConfigured) return; // chưa cấu hình server -> bỏ qua im lặng
  const resp = await fetch(`${apiUrl}/send-auction-win-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      name: input.name ?? '',
      productName: input.productName,
      amount: input.amount,
      hoursLeft: input.hoursLeft ?? '24 giờ',
    }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error ?? 'Gửi email thắng đấu giá thất bại.');
  }
}
