/** Các kiểu dữ liệu dùng chung cho toàn app. */

export type SaleType = 'fixed' | 'auction';

export type ProductStatus =
  | 'active' // giá cố định, đang bán
  | 'sold' // đã bán
  | 'auction_active' // đang đấu giá
  | 'auction_ended'; // đã kết thúc đấu giá

export interface Product {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;

  name: string;
  description: string;
  category: string;
  images: string[];
  condition: string;

  saleType: SaleType;

  // Giá cố định
  price?: number;

  // Đấu giá
  startingPrice?: number;
  currentPrice?: number;
  bidIncrement?: number;
  startTime?: number; // epoch ms
  endTime?: number; // epoch ms
  bidsCount?: number;
  winnerId?: string | null;
  winnerName?: string;

  status: ProductStatus;
  createdAt: number; // epoch ms
}

export interface Bid {
  id: string;
  productId: string;
  bidderId: string;
  bidderName?: string;
  amount: number;
  createdAt: number; // epoch ms
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  saleType: SaleType;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipping'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  buyerId: string;
  buyerName?: string;
  sellerIds: string[];
  items: OrderItem[];
  totalAmount: number;

  receiverName: string;
  phone: string;
  address: string;
  note?: string;

  paymentMethod: string; // 'cod'
  status: OrderStatus;
  createdAt: number; // epoch ms
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: number; // epoch ms
}

export interface CartDocument {
  userId: string;
  items: CartItem[];
  updatedAt: number;
}