import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

interface SectionHeaderProps {
  title: string;
  right?: string;
  onRightPress?: () => void;
}

export function SectionHeader({ title, right, onRightPress }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {right ? (
        <Text style={styles.right} onPress={onRightPress}>
          {right}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  right: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
});