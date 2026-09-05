import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

interface CategoryChipProps {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onPress?: () => void;
}

export function CategoryChip({ label, icon: Icon, active, onPress }: CategoryChipProps) {
  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Icon size={22} color={active ? Colors.primary : Colors.text} />
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 72,
    gap: 6,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.primary,
  },
});