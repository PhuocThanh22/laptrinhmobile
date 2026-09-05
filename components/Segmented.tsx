import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

interface SegmentedProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.segment, active && styles.active]}>
            <Text style={[styles.text, active && styles.activeText]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 3,
  },
  segment: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  active: {
    backgroundColor: Colors.card,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  activeText: {
    color: Colors.primary,
    fontWeight: '800',
  },
});