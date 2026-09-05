import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { Colors } from '@/constants/colors';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AppHeader({ title, subtitle, onBack, right, style }: AppHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <ChevronLeft size={20} color={Colors.text} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});