import {
  BookOpen,
  Footprints,
  Headphones,
  Laptop,
  MonitorSmartphone,
  Shapes,
  Shirt,
  Smartphone,
  type LucideIcon,
} from 'lucide-react-native';

/** Danh mục sản phẩm. `key` là giá trị lưu trong Firestore. */
export const CATEGORIES = [
  { key: 'sach', label: 'Sách', icon: BookOpen },
  { key: 'dien-tu', label: 'Điện tử', icon: MonitorSmartphone },
  { key: 'dien-thoai', label: 'Điện thoại', icon: Smartphone },
  { key: 'laptop', label: 'Laptop', icon: Laptop },
  { key: 'quan-ao', label: 'Quần áo', icon: Shirt },
  { key: 'giay-dep', label: 'Giày dép', icon: Footprints },
  { key: 'phu-kien', label: 'Phụ kiện', icon: Headphones },
  { key: 'khac', label: 'Khác', icon: Shapes },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export function getCategoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? 'Khác';
}

export function getCategoryIcon(key: string): LucideIcon {
  return CATEGORIES.find((c) => c.key === key)?.icon ?? Shapes;
}

/** Tình trạng sản phẩm. `key` là giá trị lưu trong Firestore. */
export const CONDITIONS = [
  { key: 'new', label: 'Mới 100%' },
  { key: 'like-new', label: 'Như mới' },
  { key: 'used', label: 'Đã sử dụng' },
  { key: 'heavily-used', label: 'Sử dụng nhiều' },
] as const;

export function getConditionLabel(key: string): string {
  return CONDITIONS.find((c) => c.key === key)?.label ?? 'Đã sử dụng';
}

/** Hình thức bán sản phẩm. */
export const SALE_TYPES = [
  { key: 'fixed', label: 'Giá cố định' },
  { key: 'auction', label: 'Đấu giá' },
] as const;

export type SaleTypeKey = (typeof SALE_TYPES)[number]['key'];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};