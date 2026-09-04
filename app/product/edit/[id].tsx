import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { showMessage } from '@/components/MessageCenter';

import { AppHeader } from '@/components/AppHeader';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { ProductForm, type ProductFormValues } from '@/components/ProductForm';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { getProductById, updateProduct } from '@/services/productService';
import { getErrorMessage } from '@/utils/errors';
import type { Product } from '@/types';

import { safeBack } from '@/utils/navigation';
export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getProductById(id);
      if (!p) throw new Error('Không tìm thấy sản phẩm.');
      setProduct(p);
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Chỉnh sửa sản phẩm" onBack={safeBack} />
        <Loading />
      </Screen>
    );
  }

  if (error || !product) {
    return (
      <Screen>
        <AppHeader title="Chỉnh sửa sản phẩm" onBack={safeBack} />
        <ErrorState message={error ?? 'Không tìm thấy sản phẩm.'} onRetry={load} />
      </Screen>
    );
  }

  if (user?.uid !== product.sellerId) {
    return (
      <Screen>
        <AppHeader title="Chỉnh sửa sản phẩm" onBack={safeBack} />
        <ErrorState message="Bạn không có quyền chỉnh sửa sản phẩm này." />
      </Screen>
    );
  }

  const initial: ProductFormValues = {
    images: product.images ?? [],
    video: product.video ?? undefined,
    name: product.name,
    category: product.category,
    condition: product.condition,
    description: product.description,
    saleType: product.saleType,
    price: product.price,
    startingPrice: product.startingPrice,
    bidIncrement: product.bidIncrement,
    endTime: product.endTime,
  };

  const handleSubmit = async (input: Parameters<typeof updateProduct>[1]) => {
    try {
      await updateProduct(product.id, input);
      showMessage({ type: 'success', text1: 'Đã cập nhật sản phẩm.' });
      safeBack();
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  };

  return (
    <Screen>
      <AppHeader title="Chỉnh sửa sản phẩm" onBack={safeBack} />
      <ProductForm initial={initial} submitLabel="Lưu thay đổi" onSubmit={handleSubmit} />
    </Screen>
  );
}