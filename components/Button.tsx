import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/colors';

type Variant = 'primary' | 'outline' | 'danger' | 'success' | 'ghost';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}

const COLORS: Record<Variant, string> = {
  primary: Colors.primary,
  outline: 'transparent',
  danger: Colors.danger,
  success: Colors.success,
  ghost: 'transparent',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
  small,
}: ButtonProps) {
  const bg = COLORS[variant];
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const textColor =
    isOutline || isGhost ? (isGhost ? Colors.textMuted : Colors.primary) : Colors.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: bg, borderColor: isOutline ? Colors.primary : 'transparent' },
        isGhost && { backgroundColor: 'transparent' },
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? (
            <MaterialIcons name={icon} size={18} color={textColor} style={styles.icon} />
          ) : null}
          <Text style={[styles.title, { color: textColor }, small && styles.smallTitle]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  small: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  smallTitle: {
    fontSize: 13,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  icon: {
    marginRight: 6,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.85,
  },
});