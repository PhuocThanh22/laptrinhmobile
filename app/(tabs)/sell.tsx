import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { showMessage } from '@/components/MessageCenter';

import { ProductForm } from '@/components/ProductForm';
import { Screen } from '@/components/Screen';
import { CartButton } from '@/components/CartButton';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { createProduct } from '@/services/productService';
import { getErrorMessage } from '@/utils/errors';

export default function SellScreen() {
  const { user } = useAuth();
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (input: Parameters<typeof createProduct>[1]) => {
    if (!user) {
      showMessage({ type: 'error', text1: 'Vui lòng đăng nhập để đăng bán.' });
      return;
    }
    try {
      const product = await createProduct(user.uid, input);
      showMessage({ type: 'success', text1: 'Đăng sản phẩm thành công!' });
      setFormKey((k) => k + 1);
      router.navigate('/');
      router.push(`/product/${product.id}`);
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Đăng bán sản phẩm</Text>
          <Text style={styles.subtitle}>Chọn giá cố định hoặc tổ chức đấu giá</Text>
        </View>
        <CartButton size={40} />
      </View>
      <ProductForm key={formKey} submitLabel="Đăng bán" onSubmit={handleSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 23,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});