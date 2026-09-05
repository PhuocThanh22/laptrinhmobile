import { ShoppingBag } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';

const FUN_MESSAGES = [
  'Đang nạp hàng lên kệ...',
  'Sắp xong, kiên nhẫn chút nhé...',
  'Pha chút cà phê trong lúc chờ...',
  'Đang tải, một giây thôi...',
];

function Loader({ text }: { text?: string }) {
  const spin = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 1200, easing: Easing.linear }), -1, false);
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 500, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [spin, scale]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const [message, setMessage] = useState(text ?? FUN_MESSAGES[0]);

  useEffect(() => {
    if (text) {
      setMessage(text);
      return;
    }
    let i = 1;
    const id = setInterval(() => {
      setMessage(FUN_MESSAGES[i % FUN_MESSAGES.length]);
      i += 1;
    }, 2200);
    return () => clearInterval(id);
  }, [text]);

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.logo, logoStyle]}>
          <ShoppingBag size={24} color={Colors.white} />
        </Animated.View>
      </View>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} index={i} />
        ))}
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function Dot({ index }: { index: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withDelay(
          index * 160,
          withTiming(1, { duration: 450, easing: Easing.inOut(Easing.quad) }),
        ),
        withTiming(0.3, { duration: 450, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [opacity, index]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function Loading({ text }: { text?: string }) {
  return (
    <View style={styles.container}>
      <Loader text={text} />
    </View>
  );
}

export function LoadingFullScreen() {
  return (
    <View style={styles.fullscreen}>
      <Loader />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  wrap: {
    alignItems: 'center',
  },
  stage: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: Colors.border,
    borderTopColor: Colors.primary,
    borderRightColor: Colors.primarySoft,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  text: {
    marginTop: 12,
    color: Colors.textMuted,
    fontSize: 12,
  },
});