import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ProductForm } from '@/components/ProductForm';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { createProduct } from '@/services/productService';
import { getErrorMessage } from '@/utils/errors';

export default function SellScreen() {
  const { user } = useAuth();

  const handleSubmit = async (input: Parameters<typeof createProduct>[1]) => {
    if (!user) {
      Toast.show({ type: 'error', text1: 'Vui lòng đăng nhập để đăng bán.' });
      return;
    }
    try {
      const product = await createProduct(user.uid, input);
      Toast.show({ type: 'success', text1: 'Đăng sản phẩm thành công!' });
      router.replace(`/product/${product.id}`);
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Đăng bán sản phẩm</Text>
        <Text style={styles.subtitle}>Chọn giá cố định hoặc tổ chức đấu giá</Text>
      </View>
      <ProductForm submitLabel="Đăng bán" onSubmit={handleSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});