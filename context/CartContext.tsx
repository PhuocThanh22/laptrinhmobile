import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  addToCart,
  clearCart,
  getCartWithProducts,
  removeFromCart,
  updateCartQuantity,
} from '@/services/cartService';
import { getErrorMessage } from '@/utils/errors';
import type { Product } from '@/types';
import { useAuth } from './AuthContext';

export interface CartItemView {
  productId: string;
  quantity: number;
  product: Product;
}

interface CartContextValue {
  items: CartItemView[];
  loading: boolean;
  totalAmount: number;
  totalItems: number;
  refresh: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  changeQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemView[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getCartWithProducts(user.uid);
      setItems(data);
    } catch {
      // Không làm rối UI khi chưa cấu hình Firebase.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh, user?.uid]);

  const addItem = useCallback(
    async (product: Product, quantity = 1) => {
      if (!user) throw new Error('Vui lòng đăng nhập để thêm vào giỏ hàng.');
      try {
        await addToCart(user.uid, product.id, quantity);
        await refresh();
      } catch (e) {
        throw new Error(getErrorMessage(e));
      }
    },
    [user, refresh],
  );

  const changeQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!user) return;
      try {
        await updateCartQuantity(user.uid, productId, quantity);
        await refresh();
      } catch {
        // bỏ qua
      }
    },
    [user, refresh],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (!user) return;
      try {
        await removeFromCart(user.uid, productId);
        await refresh();
      } catch {
        // bỏ qua
      }
    },
    [user, refresh],
  );

  const clear = useCallback(async () => {
    if (!user) return;
    try {
      await clearCart(user.uid);
      await refresh();
    } catch {
      // bỏ qua
    }
  }, [user, refresh]);

  const { totalAmount, totalItems } = useMemo(() => {
    return items.reduce(
      (acc, it) => ({
        totalAmount: acc.totalAmount + (it.product.price ?? 0) * it.quantity,
        totalItems: acc.totalItems + it.quantity,
      }),
      { totalAmount: 0, totalItems: 0 },
    );
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      loading,
      totalAmount,
      totalItems,
      refresh,
      addItem,
      changeQuantity,
      removeItem,
      clear,
    }),
    [items, loading, totalAmount, totalItems, refresh, addItem, changeQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải được dùng bên trong CartProvider.');
  return ctx;
}