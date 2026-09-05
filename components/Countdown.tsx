import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/colors';
import { formatCountdown, formatCountdownLong } from '@/utils/format';

interface CountdownProps {
  endTime: number;
  onEnd?: () => void;
  long?: boolean;
  compact?: boolean;
}

export function Countdown({ endTime, onEnd, long, compact }: CountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = endTime - now;
  const ended = remaining <= 0;

  useEffect(() => {
    if (ended && onEnd && !firedRef.current) {
      firedRef.current = true;
      onEnd();
    }
  }, [ended, onEnd]);

  if (ended) {
    return <Text style={[styles.ended, compact && styles.compactText]}>Đã kết thúc</Text>;
  }

  return (
    <Text style={[styles.time, compact && styles.compactText]}>
      {long ? formatCountdownLong(remaining) : formatCountdown(remaining)}
    </Text>
  );
}

const styles = StyleSheet.create({
  time: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
  },
  compactText: {
    fontSize: 10,
  },
  ended: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
});