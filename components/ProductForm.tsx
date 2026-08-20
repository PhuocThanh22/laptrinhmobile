import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { Button } from './Button';
import { DateTimeField } from './DateTimeField';
import { Segmented } from './Segmented';
import { TextField } from './TextField';
import { CATEGORIES, CONDITIONS } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { getErrorMessage } from '@/utils/errors';
import { parseNumberInput, validateProductForm } from '@/utils/validation';
import { uploadImages } from '@/services/cloudinaryService';
import type { NewProductInput } from '@/services/productService';

export interface ProductFormValues {
  images: string[];
  name: string;
  category: string;
  condition: string;
  description: string;
  saleType: 'fixed' | 'auction';
  price?: number;
  startingPrice?: number;
  bidIncrement?: number;
  endTime?: number;
}

interface ImageItem {
  uri: string;
  isRemote: boolean;
}

interface ProductFormProps {
  initial?: ProductFormValues;
  submitLabel: string;
  onSubmit: (input: NewProductInput) => Promise<void>;
}

const QUICK_END_TIMES = [
  { label: '+3 giờ', ms: 3 * 3600_000 },
  { label: '+6 giờ', ms: 6 * 3600_000 },
  { label: '+12 giờ', ms: 12 * 3600_000 },
  { label: '+1 ngày', ms: 24 * 3600_000 },
  { label: '+3 ngày', ms: 72 * 3600_000 },
];

export function ProductForm({ initial, submitLabel, onSubmit }: ProductFormProps) {
  const [images, setImages] = useState<ImageItem[]>(
    initial?.images.map((uri) => ({ uri, isRemote: true })) ?? [],
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [condition, setCondition] = useState(initial?.condition ?? 'used');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [saleType, setSaleType] = useState<'fixed' | 'auction'>(initial?.saleType ?? 'fixed');
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : '');
  const [startingPrice, setStartingPrice] = useState(initial?.startingPrice ? String(initial.startingPrice) : '');
  const [bidIncrement, setBidIncrement] = useState(initial?.bidIncrement ? String(initial.bidIncrement) : '');
  const [endTime, setEndTime] = useState<Date>(() => {
    if (initial?.endTime) return new Date(initial.endTime);
    return new Date(Date.now() + 24 * 3600_000);
  });
  const [submitting, setSubmitting] = useState(false);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Cần quyền truy cập thư viện ảnh' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - images.length,
    });
    if (!result.canceled) {
      const newItems = result.assets.map((a) => ({ uri: a.uri, isRemote: false }));
      setImages((prev) => [...prev, ...newItems].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validation = validateProductForm({
      images: images.map((i) => i.uri),
      name,
      category,
      condition,
      description,
      saleType,
      price,
      startingPrice,
      bidIncrement,
      endTime,
    });
    if (validation) {
      Toast.show({ type: 'error', text1: validation });
      return;
    }

    setSubmitting(true);
    try {
      const localUris = images.filter((i) => !i.isRemote).map((i) => i.uri);
      const remoteUris = images.filter((i) => i.isRemote).map((i) => i.uri);
      const uploaded = localUris.length ? await uploadImages(localUris) : [];
      const allUrls = [...remoteUris, ...uploaded];

      const input: NewProductInput =
        saleType === 'auction'
          ? {
              name,
              description,
              category,
              images: allUrls,
              condition,
              saleType,
              startingPrice: parseNumberInput(startingPrice),
              bidIncrement: parseNumberInput(bidIncrement),
              endTime: endTime.getTime(),
            }
          : {
              name,
              description,
              category,
              images: allUrls,
              condition,
              saleType,
              price: parseNumberInput(price),
            };

      await onSubmit(input);
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {/* Ảnh */}
      <Text style={styles.label}>Ảnh sản phẩm (tối đa 5)</Text>
      <View style={styles.imageRow}>
        {images.map((img, i) => (
          <View key={`${img.uri}-${i}`} style={styles.imageWrap}>
            <Image source={{ uri: img.uri }} style={styles.image} contentFit="cover" />
            <Pressable style={styles.removeBtn} onPress={() => removeImage(i)} hitSlop={6}>
              <MaterialIcons name="close" size={14} color={Colors.white} />
            </Pressable>
            {img.isRemote ? (
              <View style={styles.remoteTag}>
                <Text style={styles.remoteTagText}>URL</Text>
              </View>
            ) : null}
          </View>
        ))}
        {images.length < 5 ? (
          <Pressable style={styles.addImage} onPress={pickImages}>
            <MaterialIcons name="add-photo-alternate" size={26} color={Colors.primary} />
            <Text style={styles.addImageText}>Thêm ảnh</Text>
          </Pressable>
        ) : null}
      </View>

      <TextField
        label="Tên sản phẩm"
        value={name}
        onChangeText={setName}
        placeholder="VD: Giáo trình Lập trình C++"
        maxLength={100}
      />

      {/* Danh mục */}
      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.chipsWrap}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setCategory(c.key)}
            style={[styles.chip, category === c.key && styles.chipActive]}>
            <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Tình trạng */}
      <Text style={styles.label}>Tình trạng</Text>
      <View style={styles.chipsWrap}>
        {CONDITIONS.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setCondition(c.key)}
            style={[styles.chip, condition === c.key && styles.chipActive]}>
            <Text style={[styles.chipText, condition === c.key && styles.chipTextActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <TextField
        label="Mô tả"
        value={description}
        onChangeText={setDescription}
        placeholder="Mô tả tình trạng, lý do bán, ..."
        multiline
        maxLength={1000}
      />

      {/* Hình thức bán */}
      <Text style={styles.label}>Hình thức bán</Text>
      <Segmented
        options={[
          { key: 'fixed', label: 'Giá cố định' },
          { key: 'auction', label: 'Đấu giá' },
        ]}
        value={saleType}
        onChange={setSaleType}
      />

      {saleType === 'fixed' ? (
        <View style={styles.fieldGroup}>
          <TextField
            label="Giá bán (VNĐ)"
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^\d]/g, ''))}
            placeholder="VD: 250000"
            keyboardType="number-pad"
          />
        </View>
      ) : (
        <View style={styles.fieldGroup}>
          <View style={styles.auctionCard}>
            <Text style={styles.auctionTitle}>Thông tin đấu giá</Text>
            <TextField
              label="Giá khởi điểm (VNĐ)"
              value={startingPrice}
              onChangeText={(t) => setStartingPrice(t.replace(/[^\d]/g, ''))}
              placeholder="VD: 100000"
              keyboardType="number-pad"
            />
            <TextField
              label="Bước giá (VNĐ)"
              value={bidIncrement}
              onChangeText={(t) => setBidIncrement(t.replace(/[^\d]/g, ''))}
              placeholder="VD: 10000"
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Thời gian kết thúc</Text>
            <View style={styles.quickRow}>
              {QUICK_END_TIMES.map((q) => (
                <Pressable
                  key={q.label}
                  style={styles.quickChip}
                  onPress={() => setEndTime(new Date(Date.now() + q.ms))}>
                  <Text style={styles.quickChipText}>{q.label}</Text>
                </Pressable>
              ))}
            </View>
            <DateTimeField
              value={endTime}
              onChange={setEndTime}
              minimumDate={new Date(Date.now() + 5 * 60_000)}
            />
            <Text style={styles.hint}>
              Giá hiện tại sẽ bắt đầu từ giá khởi điểm. Mỗi lượt đấu phải lớn hơn giá hiện tại ít nhất một bước giá.
            </Text>
          </View>
        </View>
      )}

      <Button
        title={submitting ? 'Đang xử lý...' : submitLabel}
        onPress={handleSubmit}
        loading={submitting}
        icon="check"
        style={styles.submit}
      />
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  imageWrap: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remoteTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: Colors.info,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  remoteTagText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  addImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
    gap: 4,
  },
  addImageText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.white,
  },
  fieldGroup: {
    marginTop: 16,
  },
  auctionCard: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    marginBottom: 4,
  },
  auctionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  quickChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  hint: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  submit: {
    marginTop: 8,
  },
  bottomSpace: {
    height: 24,
  },
});