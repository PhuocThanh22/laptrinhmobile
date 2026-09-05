import { Search, X } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useState } from 'react';

import { Colors } from '@/constants/colors';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChangeText, onSubmit, placeholder = 'Tìm kiếm sản phẩm...', autoFocus }: SearchBarProps) {
  const [local, setLocal] = useState(value ?? '');
  const controlled = value !== undefined;
  const current = controlled ? value ?? '' : local;

  const handleChange = (text: string) => {
    if (controlled) onChangeText?.(text);
    else setLocal(text);
    if (controlled) return;
  };

  return (
    <View style={styles.container}>
      <Search size={20} color={Colors.textMuted} />
      <TextInput
        value={current}
        onChangeText={controlled ? onChangeText : handleChange}
        onSubmitEditing={() => onSubmit?.(current)}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        autoFocus={autoFocus}
        style={styles.input}
      />
      {current ? (
        <Pressable
          onPress={() => {
            if (controlled) onChangeText?.('');
            else setLocal('');
            onSubmit?.('');
          }}
          hitSlop={8}>
          <X size={18} color={Colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
});