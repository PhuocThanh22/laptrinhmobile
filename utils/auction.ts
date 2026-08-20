import type { Product } from '@/types';

/** Còn bao nhiêu ms cho tới khi đấu giá kết thúc. */
export function getRemainingMs(product: Product, now = Date.now()): number {
  if (!product.endTime) return 0;
  return product.endTime - now;
}

export function isAuctionActive(product: Product, now = Date.now()): boolean {
  return (
    product.saleType === 'auction' &&
    product.status === 'auction_active' &&
    product.endTime !== undefined &&
    product.endTime > now
  );
}

export function isAuctionEnded(product: Product, now = Date.now()): boolean {
  return product.saleType === 'auction' && !isAuctionActive(product, now);
}

/** Giá tối thiểu hợp lệ cho lượt đấu giá tiếp theo. */
export function getMinNextBid(product: Product): number {
  return (product.currentPrice ?? product.startingPrice ?? 0) + (product.bidIncrement ?? 0);
}

/** Giá đặt có hợp lệ không (>= giá hiện tại + bước giá). */
export function isBidValid(product: Product, amount: number): boolean {
  return amount >= getMinNextBid(product);
}

/** Tên ngắn gọn để hiển thị trong lịch sử đấu giá. */
export function shortName(name?: string): string {
  if (!name) return 'Ẩn danh';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.trim();
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/** Lấy chữ cái đầu để làm avatar mặc định. */
export function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}