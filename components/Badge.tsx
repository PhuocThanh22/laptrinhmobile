import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  icon?: string;
  small?: boolean;
}

export function Badge({ label, color = Colors.white, backgroundColor = Colors.primary, icon, small }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }, small && styles.small]}>
      {icon ? <Text style={[styles.icon, small && styles.smallText]}>{icon}</Text> : null}
      <Text style={[styles.text, { color }, small && styles.smallText]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  smallText: {
    fontSize: 10,
  },
  icon: {
    fontSize: 10,
    marginRight: 3,
  },
});